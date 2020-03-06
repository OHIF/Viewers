import React, { useState, useEffect, useContext } from 'react';
import { metadata, studies, utils, log } from '@ohif/core';
import usePrevious from '../customHooks/usePrevious';

import ConnectedViewer from './ConnectedViewer.js';
import PropTypes from 'prop-types';
import { extensionManager } from './../App.js';
import { useSnackbarContext } from '@ohif/ui';

const { OHIFStudyMetadata, OHIFSeriesMetadata } = metadata;
const { retrieveStudiesMetadata, deleteStudyMetadataPromise } = studies;
const { studyMetadataManager, updateMetaDataManager, makeCancelable } = utils;

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
      return displaySet.seriesInstanceUid === valueToCompare;
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

  const { seriesList = [], displaySets = [] } = study;
  const firstSeries = isFilterStrategy ? seriesList[0] : displaySets[0];

  if (!firstSeries || firstSeries.seriesInstanceUid !== seriesInstanceUID) {
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
  studyMetadata.addSeries(seriesMetadata);
  studyMetadata.createAndAddDisplaySetsForSeries(
    sopClassHandlerModules,
    seriesMetadata,
    false
  );
  study.displaySets = studyMetadata.getDisplaySets();
  _updateMetaDataManager(study, series.seriesInstanceUid);
};

const _updateMetaDataManager = (study, studyMetadata, series) => {
  updateMetaDataManager(study, series);

  const { studyInstanceUid } = study;

  if (!studyMetadataManager.get(studyInstanceUid)) {
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
const _loadRemainingSeries = studyMetadata => {
  const { seriesLoader } = studyMetadata.getData();
  if (!seriesLoader) {
    return Promise.resolve();
  }
  const promisesLoaders = [];
  while (seriesLoader.hasNext()) {
    promisesLoaders.push(
      seriesLoader
        .next()
        .then(
          series => void _addSeriesToStudy(studyMetadata, series),
          error => void log.error(error)
        )
    );
  }

  return Promise.all(promisesLoaders);
};

function ViewerRetrieveStudyData({
  server,
  studyInstanceUids,
  seriesInstanceUids,
  clearViewportSpecificData,
}) {
  // hooks
  const [error, setError] = useState(false);
  const [studies, setStudies] = useState([]);
  const [isStudyLoaded, setIsStudyLoaded] = useState(false);
  const snackbarContext = useSnackbarContext();
  const { appConfig = {} } = useContext(AppContext);
  const { filterQueryParam: isFilterStrategy = false } = appConfig;

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
          study.studyInstanceUid
        );

        _updateStudyDisplaySets(study, studyMetadata);
        _updateMetaDataManager(study, studyMetadata);

        // Attempt to load remaning series if any
        cancelableSeriesPromises[study.studyInstanceUid] = makeCancelable(
          _loadRemainingSeries(studyMetadata)
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

  const loadStudies = async () => {
    try {
      const filters = {};
      // Use the first, discard others
      const seriesInstanceUID = seriesInstanceUids && seriesInstanceUids[0];

      const retrieveParams = [server, studyInstanceUids];

      if (seriesInstanceUID) {
        filters.seriesInstanceUID = seriesInstanceUID;
        // Query param filtering controlled by appConfig property
        if (isFilterStrategy) {
          retrieveParams.push(filters);
        }
      }

      cancelableStudiesPromises[studyInstanceUids] = makeCancelable(
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
    for (let studyInstanceUids in cancelableStudiesPromises) {
      if ('cancel' in cancelableStudiesPromises[studyInstanceUids]) {
        cancelableStudiesPromises[studyInstanceUids].cancel();
      }
    }

    for (let studyInstanceUids in cancelableSeriesPromises) {
      if ('cancel' in cancelableSeriesPromises[studyInstanceUids]) {
        cancelableSeriesPromises[studyInstanceUids].cancel();
        deleteStudyMetadataPromise(studyInstanceUids);
        studyMetadataManager.remove(studyInstanceUids);
      }
    }
  };

  const prevStudyInstanceUids = usePrevious(studyInstanceUids);

  useEffect(() => {
    const hasStudyInstanceUidsChanged = !(prevStudyInstanceUids && prevStudyInstanceUids.every(e => studyInstanceUids.includes(e)));

    if (hasStudyInstanceUidsChanged) {
      studyMetadataManager.purge();
      purgeCancellablePromises();
    }
  }, [studyInstanceUids]);

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
      studyInstanceUids={studyInstanceUids}
    />
  );
}

ViewerRetrieveStudyData.propTypes = {
  studyInstanceUids: PropTypes.array.isRequired,
  seriesInstanceUids: PropTypes.array,
  server: PropTypes.object,
  clearViewportSpecificData: PropTypes.func.isRequired,
};

export default ViewerRetrieveStudyData;
