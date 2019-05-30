import React, { Component } from 'react';
import PropTypes from 'prop-types';
import qs from 'querystring';
import Viewer from '../connectedComponents/Viewer';
import OHIF from 'ohif-core';

const { createDisplaySets } = OHIF.utils;

class StandaloneRouting extends Component {
  state = {
    studies: null,
    error: null,
  };

  static propTypes = {
    location: PropTypes.object,
    store: PropTypes.object,
  };

  static parseQueryAndFetchStudies(query) {
    return new Promise((resolve, reject) => {
      const url = query.url;

      if (!url) {
        reject(new Error('No URL was specified. Use ?url=$yourURL'));
      }

      // Define a request to the server to retrieve the study data
      // as JSON, given a URL that was in the Route
      const oReq = new XMLHttpRequest();

      // Add event listeners for request failure
      oReq.addEventListener('error', error => {
        OHIF.log.warn('An error occurred while retrieving the JSON data');
        reject(error);
      });

      // When the JSON has been returned, parse it into a JavaScript Object
      // and render the OHIF Viewer with this data
      oReq.addEventListener('load', () => {
        // Parse the response content
        // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseText
        if (!oReq.responseText) {
          OHIF.log.warn('Response was undefined');
          reject(new Error('Response was undefined'));
        }

        OHIF.log.info(JSON.stringify(oReq.responseText, null, 2));

        const data = JSON.parse(oReq.responseText);
        if (data.servers && query.studyInstanceUids) {
          const server = data.servers.dicomWeb[0];
          server.type = 'dicomWeb';

          const studyInstanceUids = query.studyInstanceUids.split(';');
          const seriesInstanceUids = [];

          OHIF.studies
            .retrieveStudiesMetadata(
              server,
              studyInstanceUids,
              seriesInstanceUids
            )
            .then(
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
      OHIF.log.info(`Sending Request to: ${url}`);
      oReq.open('GET', url);
      oReq.setRequestHeader('Accept', 'application/json');

      // Fire the request to the server
      oReq.send();
    });
  }

  componentDidMount() {
    const query = qs.parse(this.props.location.search);
    StandaloneRouting.parseQueryAndFetchStudies(query).then(
      studies => {
        const updatedStudies = createDisplaySets(studies);

        this.setState({ studies: updatedStudies });
      },
      error => {
        this.setState({ error });
      }
    );
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
