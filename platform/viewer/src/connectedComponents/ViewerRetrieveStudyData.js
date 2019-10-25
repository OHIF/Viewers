import React, { Component } from 'react';
import { metadata, studies, utils, log } from '@ohif/core';

import ConnectedViewer from './ConnectedViewer.js';
import PropTypes from 'prop-types';
import { extensionManager } from './../App.js';

const { OHIFStudyMetadata, OHIFSeriesMetadata } = metadata;
const { retrieveStudiesMetadata, deleteStudyMetadataPromise } = studies;
const { studyMetadataManager, updateMetaDataManager } = utils;

class ViewerRetrieveStudyData extends Component {
  static propTypes = {
    studyInstanceUids: PropTypes.array.isRequired,
    seriesInstanceUids: PropTypes.array,
    server: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.abortSeriesLoad = false;
    this.seriesLoadStats = Object.create(null);
    this.state = {
      studies: null,
      error: null,
    };
  }

  async loadStudies() {
    try {
      const { server, studyInstanceUids, seriesInstanceUids } = this.props;
      const studies = await retrieveStudiesMetadata(
        server,
        studyInstanceUids,
        seriesInstanceUids
      );
      this.setStudies(studies);
    } catch (e) {
      this.setState({ error: true });
      log.error(e);
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

  _handleSeriesLoadResult(error, studyMetadata, series) {
    if (this.abortSeriesLoad) return;
    const seriesLoadStats = this.seriesLoadStats[
      studyMetadata.getStudyInstanceUID()
    ];
    if (!seriesLoadStats) return;
    seriesLoadStats.count--;
    if (error || !series) {
      seriesLoadStats.errors++;
      log.error(error || 'Bad Series');
      return;
    }
    this._addSeriesToStudy(studyMetadata, series);
  }

  _attemptToLoadRemainingSeries(studyMetadata) {
    const { seriesLoader } = studyMetadata.getData();
    if (!seriesLoader) {
      return;
    }
    const seriesLoadStats = (this.seriesLoadStats[
      studyMetadata.getStudyInstanceUID()
    ] = {
      errors: 0,
      count: 0,
    });
    while (seriesLoader.hasNext()) {
      seriesLoader
        .next()
        .then(
          series =>
            void this._handleSeriesLoadResult(null, studyMetadata, series),
          error => void this._handleSeriesLoadResult({ error }, null, null)
        );
      seriesLoadStats.count++;
    }
  }

  componentWillUnmount() {
    this.abortSeriesLoad = true;
    for (const studyInstanceUid in this.seriesLoadStats) {
      const seriesLoadStats = this.seriesLoadStats[studyInstanceUid];
      if (
        seriesLoadStats &&
        (seriesLoadStats.count > 0 || seriesLoadStats.errors > 0)
      ) {
        deleteStudyMetadataPromise(studyInstanceUid);
        studyMetadataManager.remove(studyInstanceUid);
        log.info(`Purging incomplete study data: ${studyInstanceUid}`);
      }
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

export default ViewerRetrieveStudyData;
