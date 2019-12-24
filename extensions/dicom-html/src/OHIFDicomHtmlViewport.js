import React, { Component } from 'react';
import PropTypes from 'prop-types';
import OHIF from '@ohif/core';
import ConnectedDicomHtmlViewport from './ConnectedDicomHtmlViewport';

const { DicomLoaderService } = OHIF.utils;

class OHIFDicomHtmlViewport extends Component {
  static propTypes = {
    studies: PropTypes.object,
    displaySet: PropTypes.object,
    viewportIndex: PropTypes.number,
    viewportData: PropTypes.object,
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
          <ConnectedDicomHtmlViewport
            byteArray={this.state.byteArray}
            viewportIndex={this.props.viewportIndex}
          />
        )}
        {this.state.error && <h2>{JSON.stringify(this.state.error)}</h2>}
      </>
    );
  }
}

export default OHIFDicomHtmlViewport;
