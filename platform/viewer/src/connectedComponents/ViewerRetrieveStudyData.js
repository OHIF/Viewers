import React, { Component } from "react";
import { metadata, studies, utils } from "@ohif/core";

import ConnectedViewer from "./ConnectedViewer.js";
import PropTypes from "prop-types";
import { extensionManager } from "./../App.js";

const { OHIFStudyMetadata } = metadata;
const { retrieveStudiesMetadata } = studies;
const { studyMetadataManager, updateMetaDataManager } = utils;

class ViewerRetrieveStudyData extends Component {
  static propTypes = {
    studyInstanceUids: PropTypes.array.isRequired,
    seriesInstanceUids: PropTypes.array,
    server: PropTypes.object
  };

  state = {
    studies: null,
    error: null
  };

  async componentDidMount() {
    // TODO: Avoid using timepoints here
    //const params = { studyInstanceUids, seriesInstanceUids, timepointId, timepointsFilter={} };
    const { studyInstanceUids, seriesInstanceUids, server } = this.props;

    try {
      const studies = await retrieveStudiesMetadata(
        server,
        studyInstanceUids,
        seriesInstanceUids
      );

      // Render the viewer when the data is ready
      // TODO: CLEAR THIS SOMEWHERE ELSE
      studyMetadataManager.purge();

      // Map studies to new format, update metadata manager?
      const updatedStudies = studies.map(study => {
        const studyMetadata = new OHIFStudyMetadata(
          study,
          study.studyInstanceUid
        );
        const sopClassHandlerModules =
          extensionManager.modules["sopClassHandlerModule"];

        study.displaySets =
          study.displaySets ||
          studyMetadata.createDisplaySets(sopClassHandlerModules);
        studyMetadata.setDisplaySets(study.displaySets);

        // Updates WADO-RS metaDataManager
        updateMetaDataManager(study);

        studyMetadataManager.add(studyMetadata);

        return study;
      });

      this.setState({
        studies: updatedStudies
      });
    } catch (err) {
      this.setState({
        error: true
      });

      // TODO: Handle gracefully instead of throwing?
      throw new Error(err);
    }
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
