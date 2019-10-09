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
    seriesInstanceUIDs: PropTypes.array,
    sopInstanceUIDs: PropTypes.array,
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
      const { server, studyInstanceUids, seriesInstanceUids, sopInstanceUIDs } = this.props;
      const queryParamObj = {};
      // Use the first, discard others
      const seriesInstanceUID = seriesInstanceUids && seriesInstanceUids[0];
      const sopInstanceUID = sopInstanceUIDs && sopInstanceUIDs[0];

      if (seriesInstanceUID) {
        queryParamObj.seriesInstanceUID = seriesInstanceUID;
      }

      if (sopInstanceUID) {
        queryParamObj.sopInstanceUID = sopInstanceUID;
      }


      const studies = await retrieveStudiesMetadata(
        server,
        studyInstanceUids,
        queryParamObj
      );

      this.setStudies(studies, queryParamObj);
    } catch (e) {
      this.setState({ error: true });
      log.error(e);
    }
  }

  updateMetaDataManager(study, studyMetadata, series) {
    updateMetaDataManager(study, series);

    const { studyInstanceUID } = study;

    if (!studyMetadataManager.get(studyInstanceUID)) {
      studyMetadataManager.add(studyMetadata);
    }
  }

  setStudies(givenStudies, queryParamObj = {}) {
    if (Array.isArray(givenStudies) && givenStudies.length > 0) {
      // Map studies to new format, update metadata manager?
      const studies = givenStudies.map(study => {
        const studyMetadata = new OHIFStudyMetadata(
          study,
          study.studyInstanceUid
        );

        this.updateStudyDisplaySets(study, studyMetadata, true);
        this.updateMetaDataManager(study, studyMetadata);

        // Attempt to load remaning series if any
        this._loadRemainingSeries(studyMetadata, queryParamObj, study).then(this._studyDidLoad.bind(this, study, studyMetadata, queryParamObj));

        return study;
      });
      this.setState({ studies });
    }
  }

  updateStudyDisplaySets(study, studyMetadata, shouldSort) {
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

  promoteStudyDisplaySet(study, studyMetadata, queryParamsObj) {
    let promoted = false;
    const queryParamsLength = Object.keys(queryParamsObj).length;
    const shouldPromoteToFront = queryParamsLength > 0;

    if (shouldPromoteToFront) {
      const promotedResponse = studyMetadata.promoteDisplaySetToFront(studyMetadata.getDisplaySets(), queryParamsObj);
      study.displaySets = promotedResponse.displaySets;
      promoted = promotedResponse.errors.length < queryParamsLength;

      if (promotedResponse.errors.length) {
        // toast message
        alert(promotedResponse.errors.map(error => error.msg).join("\n"));
      }
    }

    return promoted;
  }

  sortStudyDisplaySet(study, studyMetadata) {
    studyMetadata.sortDisplaySets(study.displaySets);
  }

  _studyDidLoad(study, studyMetadata, queryParamsObj) {

    this.sortStudyDisplaySet(study, studyMetadata);
    const promoted = this.promoteStudyDisplaySet(study, studyMetadata, queryParamsObj);

    // Clear viewport to allow new promoted one to be displayed
    if (promoted) {
      this.props.clearViewportSpecificData(0);
    }

    // Update studies to reflect latest changes
    this.setState(function (state) {
      return { studies: state.studies.slice() };
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
      seriesMetadata,
      false
    );
    study.displaySets = studyMetadata.getDisplaySets();
    this.updateMetaDataManager(study, series.seriesInstanceUid);
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

export default ViewerRetrieveStudyData;
