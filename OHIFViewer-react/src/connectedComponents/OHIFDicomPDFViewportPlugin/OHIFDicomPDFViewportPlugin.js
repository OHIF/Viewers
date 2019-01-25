import React, { Component } from "react";
import PropTypes from "prop-types";
import OHIF from 'ohif-core';
import OHIFComponentPlugin from '../OHIFComponentPlugin.js';
import DicomPDFViewport from './DicomPDFViewport';

const { DICOMWeb } = OHIF;

class OHIFDicomPDFViewportPlugin extends Component {
  static propTypes = {
    studies: PropTypes.object,
    displaySet: PropTypes.object,
    viewportIndex: PropTypes.number,
  };

  state = {
    byteArray: null,
    error: null
  }

  static id = 'DicomPDFViewportPlugin';

  static init() {
    console.log('DicomPDFViewportPlugin init()');
  }

  static destroy() {
    console.log('DicomPDFViewportPlugin destroy()');
  }

  componentDidMount() {
    const { displaySet } = this.props.viewportData;
    const { studyInstanceUid, seriesInstanceUid, sopInstanceUid, wadoRoot, wadoUri } = displaySet;

    this.retrieveDicomData(studyInstanceUid, seriesInstanceUid, sopInstanceUid, wadoRoot, wadoUri).then(byteArray => {
      this.setState({
        byteArray
      });
    }, error => {
      this.setState({
        error
      });

      throw new Error(error);
    });
  }

  retrieveDicomData(studyInstanceUid, seriesInstanceUid, sopInstanceUid, wadoRoot, wadoUri) {
    // TODO: Passing in a lot of data we aren't using

    // TODO: Authorization header depends on the server. If we ever have multiple servers
    // we will need to figure out how / when to pass this information in.
    return fetch(wadoUri, {
      headers: DICOMWeb.getAuthorizationHeader()
    }).then(response => response.arrayBuffer()).then(arraybuffer => {
      debugger;
      return new Uint8Array(arraybuffer);
    });
  }

  render() {
    const { id, init, destroy } = OHIFDicomPDFViewportPlugin;
    const pluginProps = { id, init, destroy };

    return (
      <OHIFComponentPlugin {...pluginProps}>
        {this.state.byteArray && <DicomPDFViewport byteArray={this.state.byteArray}/>}
        {this.state.error &&
        <h2>{JSON.stringify(this.state.error)}</h2>
        }
      </OHIFComponentPlugin>
    );
  }
}


export default OHIFDicomPDFViewportPlugin;
