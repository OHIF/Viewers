import React, { Component } from 'react';
import { metadata, studies, utils, log } from '@ohif/core';

import ConnectedViewer from './ConnectedViewer.js';
import PropTypes from 'prop-types';
import { extensionManager } from './../App.js';

const { OHIFStudyMetadata, OHIFSeriesMetadata } = metadata;
const { retrieveStudiesMetadata } = studies;
const { studyMetadataManager, updateMetaDataManager } = utils;

class ViewerRetrieveStudyData extends Component {
  static propTypes = {
    studyInstanceUids: PropTypes.array.isRequired,
    seriesInstanceUids: PropTypes.array,
    server: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = {
      studies: null,
      seriesLoaded: false,
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
        this._loadRemainingSeries(studyMetadata).then(
          this._studyDidLoad.bind(this)
        );

        return study;
      });
      this.setState({ studies });
    }
  }

  _studyDidLoad() {
    this.setState({
      seriesLoaded: true,
    });
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

  _loadRemainingSeries(studyMetadata) {
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
            series => void this._addSeriesToStudy(studyMetadata, series),
            error => void log.error(error)
          )
      );
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
        seriesLoaded={this.state.seriesLoaded}
        studyInstanceUids={this.props.studyInstanceUids}
      />
    );
  }
}

export default ViewerRetrieveStudyData;
