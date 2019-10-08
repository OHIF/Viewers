import React, { Component } from 'react';
import PropTypes from 'prop-types';
import OHIFComponentPlugin from './OHIFComponentPlugin.js';
import DicomPDFViewport from './DicomPDFViewport';

class OHIFDicomPDFViewport extends Component {
  static propTypes = {
    authorizationHeaders: PropTypes.any,
    wadoUri: PropTypes.string.isRequired,
  };

  state = {
    byteArray: null,
    error: null,
  };

  static id = 'DicomPDFViewportPDF';

  static init() {
    console.log('DicomPDFViewport init()');
  }

  static destroy() {
    console.log('DicomPDFViewport destroy()');
  }

  componentDidMount() {
    const { wadoUri, authorizationHeaders } = this.props;

    this.retrieveDicomData(
      undefined,
      undefined,
      undefined,
      undefined,
      wadoUri,
      authorizationHeaders
    ).then(
      byteArray => {
        this.setState({
          byteArray,
        });
      },
      error => {
        this.setState({
          error,
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
      headers: authorizationHeaders,
    })
      .then(response => response.arrayBuffer())
      .then(arraybuffer => {
        return new Uint8Array(arraybuffer);
      });
  }

  render() {
    const { id, init, destroy } = OHIFDicomPDFViewport;
    const pluginProps = { id, init, destroy };

    return (
      <OHIFComponentPlugin {...pluginProps}>
        {this.state.byteArray && (
          <DicomPDFViewport byteArray={this.state.byteArray} />
        )}
        {this.state.error && <h2>{JSON.stringify(this.state.error)}</h2>}
      </OHIFComponentPlugin>
    );
  }
}

export default OHIFDicomPDFViewport;
