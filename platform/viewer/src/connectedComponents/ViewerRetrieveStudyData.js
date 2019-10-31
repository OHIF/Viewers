import React, { Component } from 'react';
import { metadata, studies, utils, log } from '@ohif/core';

import ConnectedViewer from './ConnectedViewer.js';
import PropTypes from 'prop-types';
import { extensionManager } from './../App.js';
import { withSnackbar } from '@ohif/ui';

const { OHIFStudyMetadata, OHIFSeriesMetadata } = metadata;
const { retrieveStudiesMetadata } = studies;
const { studyMetadataManager, updateMetaDataManager } = utils;

const NOT_FILTER = true;

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
    data: response
  };
};

const _promoteList = (study, studyMetadata, filters) => {
  let promoted = false;
  // Promote only if no filter should be applied
  if (NOT_FILTER) {
    _sortStudyDisplaySet(study, studyMetadata);
    promoted = _promoteStudyDisplaySet(study, studyMetadata, filters);
  }

  return promoted;
}

const _promoteStudyDisplaySet = (study, studyMetadata, filters) => {
  let promoted = false;
  const queryParamsLength = Object.keys(filters).length;
  const shouldPromoteToFront = queryParamsLength > 0;

  if (shouldPromoteToFront) {
    const {
      seriesInstanceUID
    } = filters;

    const _seriesLookup = (valueToCompare, displaySet) => {
      return displaySet.seriesInstanceUid === valueToCompare
    };
    const promotedResponse = _promoteToFront(studyMetadata.getDisplaySets(), seriesInstanceUID, _seriesLookup);

    study.displaySets = promotedResponse.data;
    promoted = promotedResponse.promoted;
  }

  return promoted;
}

/**
 * Method to identify if query param (from url) was applied to given list
 * @param {Array} studies list of studies to be inspected
 * @param {Object} filters filters to be checked against
 */
const _isQueryParamApplied = (studies = [], filters = {}) => {
  const { seriesInstanceUID } = filters;
  let applied = true;
  // skip in case no filter or no toast manager
  if (!seriesInstanceUID) {
    return applied;
  }

  const firstStudy = studies[0] || {};
  const { seriesList = [], displaySets = [] } = firstStudy;
  const firstSeries = NOT_FILTER ? displaySets[0] : seriesList[0];

  if (!firstSeries || firstSeries.seriesInstanceUid !== seriesInstanceUID) {
    applied = false;
  }

  return applied;
}

const _showUserMessage = (filterApplied, message, dialog) => {

  if (filterApplied || !dialog) {
    return;
  }

  const {
    show: showUserMessage = () => { }
  } = dialog;
  showUserMessage({
    message,
  })
}

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
}

const _updateMetaDataManager = (study, studyMetadata, series) => {
  updateMetaDataManager(study, series);

  const { studyInstanceUID } = study;

  if (!studyMetadataManager.get(studyInstanceUID)) {
    studyMetadataManager.add(studyMetadata);
  }
}

const _updateStudyDisplaySets = (study, studyMetadata, shouldSort) => {
  const sopClassHandlerModules =
    extensionManager.modules['sopClassHandlerModule'];

  if (!study.displaySets) {
    study.displaySets = studyMetadata.createDisplaySets(
      sopClassHandlerModules,
      shouldSort
    );
  }

  studyMetadata.setDisplaySets(study.displaySets, shouldSort);
}

const _sortStudyDisplaySet = (study, studyMetadata) => {
  studyMetadata.sortDisplaySets(study.displaySets);
}

class ViewerRetrieveStudyData extends Component {
  static propTypes = {
    studyInstanceUids: PropTypes.array.isRequired,
    seriesInstanceUIDs: PropTypes.array,
    server: PropTypes.object,
    clearViewportSpecificData: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      studies: null,
      error: null,
    };
  }
  async loadStudies() {
    try {
      const { server, studyInstanceUids, seriesInstanceUIDs } = this.props;
      const filters = {};

      // Use the first, discard others
      const seriesInstanceUID = seriesInstanceUIDs && seriesInstanceUIDs[0];

      const retrieveParams = [
        server,
        studyInstanceUids
      ];

      if (seriesInstanceUID) {
        filters.seriesInstanceUID = seriesInstanceUID;
        // Query param filtering controlled by appConfig property
        if (!NOT_FILTER) {
          retrieveParams.push(filters);
        }
      }

      const studies = await retrieveStudiesMetadata(...retrieveParams);
      this.setStudies(studies, filters);
    } catch (e) {
      this.setState({ error: true });
      log.error(e);
    }
  }

  setStudies(givenStudies, filters) {
    if (Array.isArray(givenStudies) && givenStudies.length > 0) {
      // Map studies to new format, update metadata manager?
      const studies = givenStudies.map(study => {
        const studyMetadata = new OHIFStudyMetadata(
          study,
          study.studyInstanceUid
        );

        _updateStudyDisplaySets(study, studyMetadata, true);
        _updateMetaDataManager(study, studyMetadata);

        // Attempt to load remaning series if any
        this._loadRemainingSeries(studyMetadata).then(this._studyDidLoad.bind(this, study, studyMetadata, filters));

        return study;
      });
      this.setState({ studies });
    }
  }
  _studyDidLoad(study, studyMetadata, filters) {
    // User message
    const studies = this.state.studies;
    const { snackbarContext } = this.props;

    const promoted = _promoteList(study, studyMetadata, filters);

    // Clear viewport to allow new promoted one to be displayed
    if (promoted) {
      this.props.clearViewportSpecificData(0);
    }

    const isFiltersApplied = _isQueryParamApplied(studies, filters);
    // Show message in case not promoted neither filtered but should to
    _showUserMessage(isFiltersApplied, 'Query parameters were not applied. Using default series list.', snackbarContext);

    // Update studies to reflect latest changes
    this.setState(function (state) {
      return { studies: state.studies.slice() };
    });
  }

  _loadRemainingSeries(studyMetadata) {
    const { seriesLoader } = studyMetadata.getData();
    if (!seriesLoader) {
      return Promise.resolve();
    }
    const promisesLoaders = [];
    while (seriesLoader.hasNext()) {
      promisesLoaders.push(seriesLoader
        .next()
        .then(
          series => void _addSeriesToStudy(studyMetadata, series),
          error => void log.error(error)
        ));
    }

    return Promise.all(promisesLoaders);
  }

  componentDidMount() {
    // TODO: CLEAR THIS SOMEWHERE ELSE
    studyMetadataManager.purge();
    this.loadStudies();
  }

  render() {
    if (this.state.error) {
      return <div>Error: {JSON.stringify(this.state.error)}</div>;
    }

    return (
      <ConnectedViewer
        studies={this.state.studies}
        studyInstanceUids={this.props.studyInstanceUids}
      />
    );
  }
}

export default withSnackbar(ViewerRetrieveStudyData);
