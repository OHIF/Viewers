import React, { Component } from 'react';
import PropTypes from 'prop-types';
import DicomHtmlViewport from './DicomHtmlViewport';

class OHIFDicomHtmlViewport extends Component {
  static propTypes = {
    studies: PropTypes.object,
    displaySet: PropTypes.object,
    viewportIndex: PropTypes.number
  };

  state = {
    byteArray: null,
    error: null
  };

  componentDidMount() {
    const { displaySet } = this.props.viewportData;
    const {
      studyInstanceUid,
      seriesInstanceUid,
      sopInstanceUid,
      wadoRoot,
      wadoUri,
      authorizationHeaders
    } = displaySet;

    this.retrieveDicomData(
      studyInstanceUid,
      seriesInstanceUid,
      sopInstanceUid,
      wadoRoot,
      wadoUri,
      authorizationHeaders
    ).then(
      byteArray => {
        this.setState({
          byteArray
        });
      },
      error => {
        this.setState({
          error
        });

        throw new Error(error);
      }
    );
  }

  retrieveDicomData(
    studyInstanceUid,
    seriesInstanceUid,
    sopInstanceUid,
    wadoRoot,
    wadoUri,
    authorizationHeaders
  ) {
    // TODO: Passing in a lot of data we aren't using

    // TODO: Authorization header depends on the server. If we ever have multiple servers
    // we will need to figure out how / when to pass this information in.
    return fetch(wadoUri, {
      headers: authorizationHeaders
    })
      .then(response => response.arrayBuffer())
      .then(arraybuffer => {
        return new Uint8Array(arraybuffer);
      });
  }

  render() {
    return (
      <>
        {this.state.byteArray && (
          <DicomHtmlViewport byteArray={this.state.byteArray} />
        )}
        {this.state.error && <h2>{JSON.stringify(this.state.error)}</h2>}
      </>
    );
  }
}

export default OHIFDicomHtmlViewport;
