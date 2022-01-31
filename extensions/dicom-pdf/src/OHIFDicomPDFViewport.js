import React, { Component } from 'react';
import PropTypes from 'prop-types';
import OHIF from '@ohif/core';
import OHIFComponentPlugin from './OHIFComponentPlugin.js';
import DicomPDFViewport from './DicomPDFViewport';
import { str2ab } from '@ohif/core';

const { DicomLoaderService } = OHIF.utils;

class OHIFDicomPDFViewport extends Component {
  static propTypes = {
    studies: PropTypes.object,
    displaySet: PropTypes.object,
    viewportIndex: PropTypes.number,
    viewportData: PropTypes.object,
    activeViewportIndex: PropTypes.number,
    setViewportActive: PropTypes.func,
  };

  state = {
    byteArray: null,
    rawPdf: false,
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
    const { displaySet, studies } = this.props.viewportData;

    if (displaySet.metadata && displaySet.metadata.EncapsulatedDocument) {
      const { InlineBinary, BulkDataURI } = displaySet.metadata.EncapsulatedDocument;
      if (InlineBinary) {
        const inlineBinaryData = atob(InlineBinary);
        const byteArray = str2ab(inlineBinaryData);
        this.setState({ byteArray, rawPdf: true });
        return;
      }
    }
    DicomLoaderService.findDicomDataPromise(displaySet, studies).then(
      data => this.setState({ byteArray: new Uint8Array(data) }),
      error => {
        this.setState({ error });
        throw new Error(error);
      }
    );
  }

  render() {
    const {
      setViewportActive,
      viewportIndex,
      activeViewportIndex,
    } = this.props;
    const { byteArray, error, rawPdf } = this.state;
    const { id, init, destroy } = OHIFDicomPDFViewport;
    const pluginProps = { id, init, destroy };

    return (
      <OHIFComponentPlugin {...pluginProps}>
        {(byteArray) && (
          <DicomPDFViewport
            byteArray={byteArray}
            rawPdf={rawPdf}
            setViewportActive={setViewportActive}
            viewportIndex={viewportIndex}
            activeViewportIndex={activeViewportIndex}
          />
        )}
        {error && <h2>{JSON.stringify(error)}</h2>}
      </OHIFComponentPlugin>
    );
  }
}

export default OHIFDicomPDFViewport;
