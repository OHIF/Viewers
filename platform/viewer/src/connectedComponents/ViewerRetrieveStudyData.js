import React, { useState, useEffect, useContext } from 'react';
import { metadata, studies, utils, log } from '@ohif/core';
import usePrevious from '../customHooks/usePrevious';

import ConnectedViewer from './ConnectedViewer.js';
import PropTypes from 'prop-types';
import { extensionManager } from './../App.js';
import { useSnackbarContext } from '@ohif/ui';

const { OHIFStudyMetadata, OHIFSeriesMetadata } = metadata;
const { retrieveStudiesMetadata, deleteStudyMetadataPromise } = studies;
const { studyMetadataManager, makeCancelable } = utils;

// Contexts
import AppContext from '../context/AppContext';

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
    _sortStudyDisplaySet(study, studyMetadata);
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

  const { series = [], displaySets = [] } = study;
  const firstSeries = isFilterStrategy ? series[0] : displaySets[0];

  if (!firstSeries || firstSeries.SeriesInstanceUID !== seriesInstanceUID) {
    applied = false;
  }

  return applied;
};
const _showUserMessage = (queryParamApplied, message, dialog = {}) => {
  if (queryParamApplied) {
    return;
  }

  const { show: showUserMessage = () => { } } = dialog;
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
    seriesMetadata,
  );
  study.displaySets = studyMetadata.getDisplaySets();
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
    study.displaySets = studyMetadata.createDisplaySets(sopClassHandlerModules);
  }

  studyMetadata.setDisplaySets(study.displaySets);
};

const _sortStudyDisplaySet = (study, studyMetadata) => {
  studyMetadata.sortDisplaySets(study.displaySets);
};

function ViewerRetrieveStudyData({
  server,
  studyInstanceUIDs,
  seriesInstanceUIDs,
  clearViewportSpecificData,
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

    const isQueryParamApplied = _isQueryParamApplied(
      study,
      filters,
      isFilterStrategy
    );
    // Show message in case not promoted neither filtered but should to
    _showUserMessage(
      isQueryParamApplied,
      'Query parameters were not applied. Using original series list for given study.',
      snackbarContext
    );

    setStudies([...studies, study]);
    setIsStudyLoaded(true);
  };

  /**
   * Method to process studies. It will update displaySet, studyMetadata, load remaining series, ...
   * @param {Array} studiesData Array of studies retrieved from server
   * @param {Object} [filters] - Object containing filters to be applied
   * @param {string} [filter.seriesInstanceUID] - series instance uid to filter results against
   */
  const processStudies = (studiesData, filters) => {
    if (Array.isArray(studiesData) && studiesData.length > 0) {
      // Map studies to new format, update metadata manager?
      const studies = studiesData.map(study => {
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
            }
          })
          .catch(error => {
            if (error && !error.isCanceled) {
              setError(true);
              log.error(error);
            }
          });

        return study;
      });

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
      _addSeriesToStudy(studyMetadata, series);
      forceRerender();
      return loadNextSeries();
    };

    const concurrentRequestsAllowed = maxConcurrentMetadataRequests || studyMetadata.getSeriesCount();
    const promises = Array(concurrentRequestsAllowed)
      .fill(null)
      .map(loadNextSeries);

    return await Promise.all(promises);
  };

  const loadStudies = async () => {
    try {
      const filters = {};
      // Use the first, discard others
      const seriesInstanceUID = seriesInstanceUIDs && seriesInstanceUIDs[0];

      const retrieveParams = [server, studyInstanceUIDs];

      if (seriesInstanceUID) {
        filters.seriesInstanceUID = seriesInstanceUID;
        // Query param filtering controlled by appConfig property
        if (isFilterStrategy) {
          retrieveParams.push(filters);
        }
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
            setError(true);
            log.error(error);
          }
        });
    } catch (error) {
      if (error) {
        setError(true);
        log.error(error);
      }
    }
  };

  const purgeCancellablePromises = () => {
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
  };

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
  }, [studyInstanceUIDs]);

  useEffect(() => {
    cancelableSeriesPromises = {};
    cancelableStudiesPromises = {};
    loadStudies();

    return () => {
      purgeCancellablePromises();
    };
  }, []);

  if (error) {
    return <div>Error: {JSON.stringify(error)}</div>;
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
  server: PropTypes.object,
  clearViewportSpecificData: PropTypes.func.isRequired,
};

export default ViewerRetrieveStudyData;
