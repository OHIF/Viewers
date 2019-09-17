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
    this.isReady = false;
    this.state = {
      studies: null,
      error: null,
    };
  }

  triggerDataLoad() {
    const { props } = this;
    retrieveStudiesMetadata(
      props.server,
      props.studyInstanceUids,
      props.seriesInstanceUids
    ).then(
      studies => {
        if (this.isReady) {
          this.setStudies(studies);
        }
      },
      error => {
        if (this.isReady) {
          this.setState({ error: true });
        }
        log.error(error);
      }
    );
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
        this._attemptToLoadRemainingSeries(study, studyMetadata);
        return study;
      });
      this.setState({ studies });
    }
  }

  _attemptToLoadRemainingSeries(study, studyMetadata) {
    const { seriesLoadQueue } = study;
    if (seriesLoadQueue) {
      const view = this;
      study.subscribe('seriesAdded', function seriesAddedHandler(series) {
        if (view.isReady) {
          const sopClassHandlerModules =
            extensionManager.modules['sopClassHandlerModule'];
          const seriesMetadata = new OHIFSeriesMetadata(series, study);
          studyMetadata.addSeries(seriesMetadata);
          studyMetadata.createAndAddDisplaySetsForSeries(
            sopClassHandlerModules,
            seriesMetadata
          );
          study.displaySets = studyMetadata.getDisplaySets();
          updateMetaDataManager(study, series.seriesInstanceUid);
          view.setState(function(state) {
            return { studies: state.studies.slice() };
          });
        } else {
          study.unsubscribe('seriesAdded', seriesAddedHandler);
        }
      });
      while (seriesLoadQueue.size() > 0) {
        seriesLoadQueue.dequeue();
      }
    }
  }

  componentDidMount() {
    // TODO: CLEAR THIS SOMEWHERE ELSE
    studyMetadataManager.purge();
    this.isReady = true;
    this.triggerDataLoad();
  }

  componentWillUnmount() {
    this.isReady = false;
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
