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
const promoteToFront = (list, value, searchMethod) => {

  const response = [...list];
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
      const toPromoteFilters = {};
      // Use the first, discard others
      const seriesInstanceUID = seriesInstanceUIDs && seriesInstanceUIDs[0];

      if (seriesInstanceUID) {
        if (NOT_FILTER) {
          toPromoteFilters.seriesInstanceUID = seriesInstanceUID;
        } else {
          filters.seriesInstanceUID = seriesInstanceUID;
        }
      }

      const studies = await retrieveStudiesMetadata(
        server,
        studyInstanceUids,
        filters
      );
      this.setStudies(studies, toPromoteFilters);
    } catch (e) {
      this.setState({ error: true });
      log.error(e);
    }
  }

  /**
   * Validate filters and promp user a message in case filter is unsuccessfully applied.
   * In case of success, studies array contains, as the first element, the queried content (from filter)
   * @param {Array} studies array of studies to be evaluated
   * @param {Object} filters filters to test against
   */
  validateFilters(studies = [], filters = {}) {
    const { seriesInstanceUID } = filters;

    const { snackbarContext } = this.props;
    // skip in case no filter or no toast manager
    if (!seriesInstanceUID || !snackbarContext) {
      return;
    }

    const firstStudy = studies[0] || {};
    const { seriesList = [], displaySets = [] } = firstStudy;
    const firstSeries = NOT_FILTER ? displaySets[0] : seriesList[0];

    if (!firstSeries || firstSeries.seriesInstanceUid !== seriesInstanceUID) {
      snackbarContext.show({
        message: 'No series for given filter: ' + seriesInstanceUID,
      });
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

        this._updateStudyDisplaySets(study, studyMetadata, true);
        this._updateMetaDataManager(study, studyMetadata);

        // Attempt to load remaning series if any
        this._loadRemainingSeries(studyMetadata).then(this._studyDidLoad.bind(this, study, studyMetadata, filters));

        return study;
      });
      this.setState({ studies });
    }
  }

  _updateStudyDisplaySets(study, studyMetadata, shouldSort) {
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

  _promoteStudyDisplaySet(study, studyMetadata, filters) {
    let promoted = false;
    const queryParamsLength = Object.keys(filters).length;
    const shouldPromoteToFront = queryParamsLength > 0;

    if (shouldPromoteToFront && NOT_FILTER) {
      const {
        seriesInstanceUID
      } = filters;

      const _seriesLookup = (valueToCompare, displaySet) => {
        return displaySet.seriesInstanceUid === valueToCompare
      };
      const promotedResponse = promoteToFront(studyMetadata.getDisplaySets(), seriesInstanceUID, _seriesLookup);

      study.displaySets = promotedResponse.data;
      promoted = promotedResponse.promoted;
    }

    return promoted;
  }

  _sortStudyDisplaySet(study, studyMetadata) {
    studyMetadata.sortDisplaySets(study.displaySets);
  }

  _studyDidLoad(study, studyMetadata, filters) {

    this._sortStudyDisplaySet(study, studyMetadata);
    const promoted = this._promoteStudyDisplaySet(study, studyMetadata, filters);

    // Clear viewport to allow new promoted one to be displayed
    if (promoted) {
      this.props.clearViewportSpecificData(0);
    }

    const studies = this.state.studies;
    this.validateFilters(studies, filters);
    // Update studies to reflect latest changes
    this.setState(function (state) {
      return { studies: state.studies.slice() };
    });
  }

  _updateMetaDataManager(study, studyMetadata, series) {
    updateMetaDataManager(study, series);

    const { studyInstanceUID } = study;

    if (!studyMetadataManager.get(studyInstanceUID)) {
      studyMetadataManager.add(studyMetadata);
    }
  }

  _addSeriesToStudy(studyMetadata, series) {
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
    this._updateMetaDataManager(study, series.seriesInstanceUid);
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
          series => void this._addSeriesToStudy(studyMetadata, series),
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
