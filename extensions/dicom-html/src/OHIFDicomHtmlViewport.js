import React, { Component } from 'react';
import PropTypes from 'prop-types';
import DicomHtmlViewport from './DicomHtmlViewport';
import OHIF from '@ohif/core';
const { DicomLoaderService } = OHIF.utils;

class OHIFDicomHtmlViewport extends Component {
  static propTypes = {
    studies: PropTypes.object,
    displaySet: PropTypes.object,
    viewportIndex: PropTypes.number,
  };

  state = {
    byteArray: null,
    error: null,
  };

  componentDidMount() {
    const { displaySet, studies } = this.props.viewportData;

    DicomLoaderService.findDicomDataPromise(displaySet, studies).then(
      data => {
        const byteArray = new Uint8Array(data);
        this.setState({
          byteArray: byteArray,
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
