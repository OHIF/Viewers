import React, { useState, useEffect, useContext, useCallback } from 'react';
import { metadata, studies, utils, log } from '@ohif/core';
import usePrevious from '../customHooks/usePrevious';

import ConnectedViewer from './ConnectedViewer.js';
import PropTypes from 'prop-types';
import { extensionManager } from './../App.js';
import { useSnackbarContext, ErrorPage } from '@ohif/ui';

// Contexts
import AppContext from '../context/AppContext';
import NotFound from '../routes/NotFound';

const { OHIFStudyMetadata, OHIFSeriesMetadata } = metadata;
const { retrieveStudiesMetadata, deleteStudyMetadataPromise } = studies;
const { studyMetadataManager, makeCancelable } = utils;

const _promoteToFront = (list, value, searchMethod) => {
  let response = [...list];
  let promoted = false;
  const index = response.findIndex(searchMethod.bind(undefined, value));

  if (index > 0) {
    const first = response.splice(index, 1);
    response = [...first, ...response];
  }

  if (index >= 0) {
    promoted = true;
  }

  return {
    promoted,
    data: response,
  };
};

/**
 * Promote series to front if find found equivalent on filters object
 * @param {Object} study - study reference to promote series against
 * @param {Object} [filters] - Object containing filters to be applied
 * @param {string} [filter.seriesInstanceUID] - series instance uid to filter results against
 * @param {boolean} isFilterStrategy - if filtering by query param strategy ON
 */
const _promoteList = (study, studyMetadata, filters, isFilterStrategy) => {
  let promoted = false;
  // Promote only if no filter should be applied
  if (!isFilterStrategy) {
    promoted = _promoteStudyDisplaySet(study, studyMetadata, filters);
  }

  return promoted;
};

const _promoteStudyDisplaySet = (study, studyMetadata, filters) => {
  let promoted = false;
  const queryParamsLength = Object.keys(filters).length;
  const shouldPromoteToFront = queryParamsLength > 0;

  if (shouldPromoteToFront) {
    const { seriesInstanceUID } = filters;

    const _seriesLookup = (valueToCompare, displaySet) => {
      return displaySet.SeriesInstanceUID === valueToCompare;
    };
    const promotedResponse = _promoteToFront(
      studyMetadata.getDisplaySets(),
      seriesInstanceUID,
      _seriesLookup
    );

    study.displaySets = promotedResponse.data;
    promoted = promotedResponse.promoted;
  }

  return promoted;
};

/**
 * Returns the frame of a SOPInstanceUID from a given displaySet. If the SOPInstanceUID
 * is not in this displayset, it will return undefined;
 *
 * @param {*} displaySet displaySet to be displayed
 * @param {string} SOPInstanceUID SOPIntanceUID of the frame to be hung
 * @returns {number} the FrameIndex of the SOPInstanceUID in the given displaySet
 */
const _findSOPInstanceUIDFrame = (displaySet, SOPInstanceUID) => {
  const objectList = displaySet.images || displaySet.others;
  if (!objectList) {
    console.warn('displaySet missing images array', displaySet);
    return;
  }
  const frameIndex = objectList.findIndex(
    image => image.SOPInstanceUID === SOPInstanceUID
  );

  if (frameIndex !== -1) {
    return frameIndex;
  }
};

/**
 * Method to identify if query param (from url) was applied to given list
 * @param {Object} study - study reference to promote series against
 * @param {Object} [filters] - Object containing filters to be applied
 * @param {string} [filter.seriesInstanceUID] - series instance uid to filter results against
 * @param {boolean} isFilterStrategy - if filtering by query param strategy ON
 */
const _isQueryParamApplied = (study, filters = {}, isFilterStrategy) => {
  const { seriesInstanceUID } = filters;
  let applied = true;
  // skip in case no filter or no toast manager

  if (!seriesInstanceUID) {
    return applied;
  }
  const seriesInstanceUIDs = seriesInstanceUID.split(',');

  let validateFilterApplied = () => {
    const sameSize = arrayToInspect.length === seriesInstanceUIDs.length;
    if (!sameSize) {
      return;
    }

    return arrayToInspect.every(item =>
      seriesInstanceUIDs.some(
        seriesInstanceUIDStr => seriesInstanceUIDStr === item.SeriesInstanceUID
      )
    );
  };

  let validatePromoteApplied = () => {
    let isValid = true;
    for (let index = 0; index < seriesInstanceUIDs.length; index++) {
      const seriesInstanceUIDStr = seriesInstanceUIDs[index];
      const resultSeries = arrayToInspect[index];

      if (
        !resultSeries ||
        resultSeries.SeriesInstanceUID !== seriesInstanceUIDStr
      ) {
        isValid = false;
        break;
      }
    }
    return isValid;
  };

  const { series = [], displaySets = [] } = study;
  const arrayToInspect = isFilterStrategy ? series : displaySets;
  const validateMethod = isFilterStrategy
    ? validateFilterApplied
    : validatePromoteApplied;

  if (!arrayToInspect) {
    applied = false;
  } else {
    applied = validateMethod();
  }

  return applied;
};
const _showUserMessage = (queryParamApplied, message, dialog = {}) => {
  if (queryParamApplied) {
    return;
  }

  const { show: showUserMessage = () => {} } = dialog;
  showUserMessage({
    message,
  });
};

const _addSeriesToStudy = (studyMetadata, series) => {
  const sopClassHandlerModules =
    extensionManager.modules['sopClassHandlerModule'];
  const study = studyMetadata.getData();
  const seriesMetadata = new OHIFSeriesMetadata(series, study);
  const existingSeries = studyMetadata.getSeriesByUID(series.SeriesInstanceUID);
  if (existingSeries) {
    studyMetadata.updateSeries(series.SeriesInstanceUID, seriesMetadata);
  } else {
    studyMetadata.addSeries(seriesMetadata);
  }

  studyMetadata.createAndAddDisplaySetsForSeries(
    sopClassHandlerModules,
    seriesMetadata
  );

  study.displaySets = studyMetadata.getDisplaySets();
  study.derivedDisplaySets = studyMetadata.getDerivedDatasets({
    Modality: series.Modality,
  });

  _updateStudyMetadataManager(study, studyMetadata);
};

const _updateStudyMetadataManager = (study, studyMetadata) => {
  const { StudyInstanceUID } = study;

  if (!studyMetadataManager.get(StudyInstanceUID)) {
    studyMetadataManager.add(studyMetadata);
  }
};

const _updateStudyDisplaySets = (study, studyMetadata) => {
  const sopClassHandlerModules =
    extensionManager.modules['sopClassHandlerModule'];

  if (!study.displaySets) {
    study.displaySets = studyMetadata.createDisplaySets(
      sopClassHandlerModules
    );
  }

  if (study.derivedDisplaySets) {
    studyMetadata._addDerivedDisplaySets(study.derivedDisplaySets);
  }
};

const _thinStudyData = study => {
  return {
    StudyInstanceUID: study.StudyInstanceUID,
    series: study.series.map(item => ({
      SeriesInstanceUID: item.SeriesInstanceUID,
    })),
  };
};

function ViewerRetrieveStudyData({
  server,
  studyInstanceUIDs,
  seriesInstanceUIDs,
  sopInstanceUID,
  clearViewportSpecificData,
  setFirstViewportSpecificData,
}) {
  // hooks
  const [error, setError] = useState(false);
  const [studies, setStudies] = useState([]);
  const [isStudyLoaded, setIsStudyLoaded] = useState(false);
  const snackbarContext = useSnackbarContext();
  const { appConfig = {} } = useContext(AppContext);
  const {
    filterQueryParam: isFilterStrategy = false,
    maxConcurrentMetadataRequests,
  } = appConfig;

  let cancelableSeriesPromises;
  let cancelableStudiesPromises;
  /**
   * Callback method when study is totally loaded
   * @param {object} study study loaded
   * @param {object} studyMetadata studyMetadata for given study
   * @param {Object} [filters] - Object containing filters to be applied
   * @param {string} [filter.seriesInstanceUID] - series instance uid to filter results against
   */
  const studyDidLoad = (study, studyMetadata, filters) => {
    const seriesInstanceUID =
      seriesInstanceUIDs && seriesInstanceUIDs.length > 0
        ? seriesInstanceUIDs[0]
        : undefined;
    // User message
    const promoted = _promoteList(
      study,
      studyMetadata,
      filters,
      isFilterStrategy
    );

    // Clear viewport to allow new promoted one to be displayed
    if (promoted) {
      clearViewportSpecificData(0);
    }

    if (seriesInstanceUID || sopInstanceUID) {
      let frameIndex;
      const displaySet = study.displaySets.filter(
        displaySet =>
          !seriesInstanceUID
          || displaySet.SeriesInstanceUID === seriesInstanceUID
      ).find(displaySet => {
        if (!sopInstanceUID) return true;
        frameIndex = _findSOPInstanceUIDFrame(
            displaySet,
            sopInstanceUID
          );
        if (frameIndex !== undefined && frameIndex !== -1) return true;
      });

      if (displaySet) {
        if (frameIndex !== undefined) {
          setFirstViewportSpecificData({ ...displaySet, frameIndex });
        } else {
          setFirstViewportSpecificData(displaySet);
        }
      } else {
        log.warn(
          `Couldn't find a displaySet for the required SeriesInstanceUID: ${seriesInstanceUID}`
        );
      }
    }

    const isQueryParamApplied = _isQueryParamApplied(
      study,
      filters,
      isFilterStrategy
    );
    // Show message in case not promoted neither filtered but should to
    _showUserMessage(
      isQueryParamApplied,
      'Query parameters were not totally applied. It might be using original series list for given study.',
      snackbarContext
    );

    setStudies([...studies, study]);
  };

  /**
   * Method to process studies. It will update displaySet, studyMetadata, load remaining series, ...
   * @param {Array} studiesData Array of studies retrieved from server
   * @param {Object} [filters] - Object containing filters to be applied
   * @param {string} [filters.seriesInstanceUID] - series instance uid to filter results against
   */
  const processStudies = async (studiesData, filters) => {
    if (Array.isArray(studiesData) && studiesData.length > 0) {
      // Map studies to new format, update metadata manager?
      const seriesInstanceUID =
        seriesInstanceUIDs && seriesInstanceUIDs.length > 0
          ? seriesInstanceUIDs[0]
          : undefined;
      let studies = studiesData.map(async study => {
        //setStudyData(study.StudyInstanceUID, _thinStudyData(study));
        const studyMetadata = new OHIFStudyMetadata(
          study,
          study.StudyInstanceUID
        );

        _updateStudyDisplaySets(study, studyMetadata);
        _updateStudyMetadataManager(study, studyMetadata);

        // Attempt to load remaning series if any
        cancelableSeriesPromises[study.StudyInstanceUID] = makeCancelable(
          loadRemainingSeries(studyMetadata)
        )
          .then(result => {
            if (result && !result.isCanceled) {
              studyDidLoad(study, studyMetadata, filters);
            } else if (
              !result &&
              study.displaySets &&
              study.displaySets.length > 0
            ) {
              // When we are loading synchronously result will come undefined
              if (sopInstanceUID) {
                study.displaySets.forEach(displaySet => {
                  if (!seriesInstanceUID || !displaySet.SeriesInstanceUID || displaySet.SeriesInstanceUID === seriesInstanceUID) {
                    const frameIndex = _findSOPInstanceUIDFrame(
                      displaySet,
                      sopInstanceUID
                    );
                    if (frameIndex !== undefined) {
                      setFirstViewportSpecificData({ ...displaySet, frameIndex });
                    }
                  }
                });
              }
            }
          })
          .catch(error => {
            if (error && !error.isCanceled) {
              setError(error);
              log.error(error);
            }
          })
          .finally(() => {
            setIsStudyLoaded(true);
          });

        return study;
      });

      studies = await Promise.all(studies);

      setStudies(studies);
    }
  };

  const forceRerender = () => setStudies(studies => [...studies]);

  const loadRemainingSeries = async studyMetadata => {
    const { seriesLoader } = studyMetadata.getData();
    if (!seriesLoader) return;

    const loadNextSeries = async () => {
      if (!seriesLoader.hasNext()) return;
      const series = await seriesLoader.next();
      await _addSeriesToStudy(studyMetadata, series);
      forceRerender();
      return loadNextSeries();
    };

    const concurrentRequestsAllowed =
      maxConcurrentMetadataRequests || studyMetadata.getSeriesCount();
    const promises = Array(concurrentRequestsAllowed)
      .fill(null)
      .map(loadNextSeries);
    const remainingSeriesPromise = await Promise.all(promises);

    /**
     * Wait all series to load (which includes SR series)
     * because there are instance checks when parsing the latest SR.
     * If there are not instances loaded yet, the latest SR
     * is not going to be loaded by default.
     */
    setIsStudyLoaded(true);

    return remainingSeriesPromise;
  };

  const loadStudies = async () => {
    try {
      const filters = {
        seriesInstanceUIDs: seriesInstanceUIDs ? seriesInstanceUIDs : [],
        // Query param filtering controlled by appConfig property
        isFilterStrategy,
      };

      const retrieveParams = [server, studyInstanceUIDs, filters];

      if (
        appConfig.splitQueryParameterCalls ||
        appConfig.enableGoogleCloudAdapter
      ) {
        retrieveParams.push(true); // Seperate SeriesInstanceUID filter calls.
      }

      cancelableStudiesPromises[studyInstanceUIDs] = makeCancelable(
        retrieveStudiesMetadata(...retrieveParams)
      )
        .then(result => {
          if (result && !result.isCanceled) {
            processStudies(result, filters);
          }
        })
        .catch(error => {
          if (error && !error.isCanceled) {
            setError(error);
            log.error(error);
          }
        });
    } catch (error) {
      if (error) {
        setError(error);
        log.error(error);
      }
    }
  };

  const purgeCancellablePromises = useCallback(() => {
    for (let studyInstanceUIDs in cancelableStudiesPromises) {
      if ('cancel' in cancelableStudiesPromises[studyInstanceUIDs]) {
        cancelableStudiesPromises[studyInstanceUIDs].cancel();
      }
    }

    for (let studyInstanceUIDs in cancelableSeriesPromises) {
      if ('cancel' in cancelableSeriesPromises[studyInstanceUIDs]) {
        cancelableSeriesPromises[studyInstanceUIDs].cancel();
        deleteStudyMetadataPromise(studyInstanceUIDs);
        studyMetadataManager.remove(studyInstanceUIDs);
      }
    }
  });

  const prevStudyInstanceUIDs = usePrevious(studyInstanceUIDs);

  useEffect(() => {
    const hasStudyInstanceUIDsChanged = !(
      prevStudyInstanceUIDs &&
      prevStudyInstanceUIDs.every(e => studyInstanceUIDs.includes(e))
    );

    if (hasStudyInstanceUIDsChanged) {
      studyMetadataManager.purge();
      purgeCancellablePromises();
    }
  }, [prevStudyInstanceUIDs, purgeCancellablePromises, studyInstanceUIDs]);

  useEffect(() => {
    cancelableSeriesPromises = {};
    cancelableStudiesPromises = {};
    loadStudies();

    return () => {
      purgeCancellablePromises();
    };
  }, []);

  if (error) {
    const content = JSON.stringify(error);
    if (content.includes('404') || content.includes('NOT_FOUND')) {
      return <NotFound />;
    }

    return <NotFound message="Failed to retrieve study data" />;
  }

  return (
    <ConnectedViewer
      studies={studies}
      isStudyLoaded={isStudyLoaded}
      studyInstanceUIDs={studyInstanceUIDs}
    />
  );
}

ViewerRetrieveStudyData.propTypes = {
  studyInstanceUIDs: PropTypes.array.isRequired,
  seriesInstanceUIDs: PropTypes.array,
  sopInstanceUID: PropTypes.string,
  server: PropTypes.object,
  clearViewportSpecificData: PropTypes.func.isRequired,
  setFirstViewportSpecificData: PropTypes.func.isRequired,
};

export default ViewerRetrieveStudyData;
