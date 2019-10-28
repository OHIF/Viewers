import React, { Component } from 'react';
import { metadata, studies, utils, log } from '@ohif/core';

import ConnectedViewer from './ConnectedViewer.js';
import PropTypes from 'prop-types';
import { extensionManager } from './../App.js';
import { withSnackbar } from '@ohif/ui';

const { OHIFStudyMetadata, OHIFSeriesMetadata } = metadata;
const { retrieveStudiesMetadata } = studies;
const { studyMetadataManager, updateMetaDataManager } = utils;

class ViewerRetrieveStudyData extends Component {
  static propTypes = {
    studyInstanceUids: PropTypes.array.isRequired,
    seriesInstanceUIDs: PropTypes.array,
    server: PropTypes.object,
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

      if (seriesInstanceUID) {
        filters.seriesInstanceUID = seriesInstanceUID;
      }

      const studies = await retrieveStudiesMetadata(
        server,
        studyInstanceUids,
        filters
      );
      this.validateFilters(studies, filters);
      this.setStudies(studies);
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
    const { seriesList = [] } = firstStudy;
    const firstSeries = seriesList[0];

    if (!firstSeries || firstSeries.seriesInstanceUid !== seriesInstanceUID) {
      snackbarContext.show({
        message: 'No series for given filter: ' + seriesInstanceUID,
      });
    }
  }

  setStudies(givenStudies) {
    if (Array.isArray(givenStudies) && givenStudies.length > 0) {
      const sopClassHandlerModules =
        extensionManager.modules['sopClassHandlerModule'];
      // Map studies to new format, update metadata manager?
      const studies = givenStudies.map(study => {
        const studyMetadata = new OHIFStudyMetadata(
          study,
          study.studyInstanceUid
        );
        if (!study.displaySets) {
          study.displaySets = studyMetadata.createDisplaySets(
            sopClassHandlerModules
          );
        }
        studyMetadata.setDisplaySets(study.displaySets);
        // Updates WADO-RS metaDataManager
        updateMetaDataManager(study);
        studyMetadataManager.add(studyMetadata);
        // Attempt to load remaning series if any
        this._attemptToLoadRemainingSeries(studyMetadata);
        return study;
      });
      this.setState({ studies });
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
      seriesMetadata
    );
    study.displaySets = studyMetadata.getDisplaySets();
    updateMetaDataManager(study, series.seriesInstanceUid);
    this.setState(function(state) {
      return { studies: state.studies.slice() };
    });
  }

  _attemptToLoadRemainingSeries(studyMetadata) {
    const { seriesLoader } = studyMetadata.getData();
    if (!seriesLoader) {
      return;
    }
    while (seriesLoader.hasNext()) {
      seriesLoader
        .next()
        .then(
          series => void this._addSeriesToStudy(studyMetadata, series),
          error => void log.error(error)
        );
    }
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
