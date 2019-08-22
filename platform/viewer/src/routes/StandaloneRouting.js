import React, { Component } from "react";
import { log, metadata, studies, utils } from "@ohif/core";

import PropTypes from "prop-types";
import Viewer from "../connectedComponents/Viewer";
import { extensionManager } from "./../App.js";
import qs from "querystring";

const { OHIFStudyMetadata } = metadata;
const { retrieveStudiesMetadata } = studies;
const { studyMetadataManager, updateMetaDataManager } = utils;

class StandaloneRouting extends Component {
  state = {
    studies: null,
    error: null
  };

  static propTypes = {
    location: PropTypes.object,
    store: PropTypes.object
  };

  static parseQueryAndFetchStudies(query) {
    return new Promise((resolve, reject) => {
      const url = query.url;

      if (!url) {
        return reject(new Error("No URL was specified. Use ?url=$yourURL"));
      }

      // Define a request to the server to retrieve the study data
      // as JSON, given a URL that was in the Route
      const oReq = new XMLHttpRequest();

      // Add event listeners for request failure
      oReq.addEventListener("error", error => {
        log.warn("An error occurred while retrieving the JSON data");
        reject(error);
      });

      // When the JSON has been returned, parse it into a JavaScript Object
      // and render the OHIF Viewer with this data
      oReq.addEventListener("load", () => {
        // Parse the response content
        // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseText
        if (!oReq.responseText) {
          log.warn("Response was undefined");
          reject(new Error("Response was undefined"));
        }

        log.info(JSON.stringify(oReq.responseText, null, 2));

        const data = JSON.parse(oReq.responseText);
        if (data.servers && query.studyInstanceUids) {
          const server = data.servers.dicomWeb[0];
          server.type = "dicomWeb";

          const studyInstanceUids = query.studyInstanceUids.split(";");
          const seriesInstanceUids = [];

          retrieveStudiesMetadata(
            server,
            studyInstanceUids,
            seriesInstanceUids
          ).then(
            studies => {
              resolve(studies);
            },
            error => {
              reject(error);
            }
          );
        } else {
          resolve(data.studies);
        }
      });

      // Open the Request to the server for the JSON data
      // In this case we have a server-side route called /api/
      // which responds to GET requests with the study data
      log.info(`Sending Request to: ${url}`);
      oReq.open("GET", url);
      oReq.setRequestHeader("Accept", "application/json");

      // Fire the request to the server
      oReq.send();
    });
  }

  async componentDidMount() {
    try {
      let { search } = this.props.location;

      // Remove ? prefix which is included for some reason
      search = search.slice(1, search.length);

      const query = qs.parse(search);
      const studies = await StandaloneRouting.parseQueryAndFetchStudies(query);

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

      this.setState({ studies: updatedStudies });
    } catch (error) {
      this.setState({ error });
    }
  }

  render() {
    if (this.state.error) {
      return <div>Error: {JSON.stringify(this.state.error)}</div>;
    } else if (!this.state.studies) {
      return <div>Loading...</div>;
    }

    return <Viewer studies={this.state.studies} />;
  }
}

export default StandaloneRouting;
