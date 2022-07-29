import React, { Component } from 'react';
import PropTypes from 'prop-types';
import OHIF from '@ohif/core';
import OHIFComponentPlugin from './OHIFComponentPlugin.js';
import DicomECGViewport from './DicomECGViewport';

const { DicomLoaderService } = OHIF.utils;

class OHIFDicomECGViewport extends Component {
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
    error: false,
  };

  static id = 'DicomECGViewport';

  static init() {
    console.log('DicomECGViewport init()');
  }

  static destroy() {
    console.log('DicomECGViewport destroy()');
  }

  //Load byteArray:
  componentDidMount() {
    const { displaySet, studies } = this.props.viewportData;

    //Load local:
    DicomLoaderService.findDicomDataPromise(displaySet, studies).then(
      data => {
        const byteArray = new Uint8Array(data);
        this.setState({
          byteArray: byteArray,
        });
      },
      error => {
        //Load from server request:
        var oReq = new XMLHttpRequest();
        oReq.open('get', this.props.viewportData.displaySet.wadoUri, true);
        oReq.responseType = 'arraybuffer';
        oReq.onreadystatechange = () => {
          if (oReq.readyState === 4) {
            if (oReq.status == 200) {
              const byteArrayReq = new Uint8Array(oReq.response);
              this.setState({
                byteArray: byteArrayReq,
              });
            } else {
              this.setState({
                error: true,
              });
              throw new Error(error);
            }
          }
        };
        oReq.send();
      }
    );
  }

  render() {
    const {
      viewportData,
      setViewportActive,
      viewportIndex,
      activeViewportIndex,
    } = this.props;
    const { byteArray, error } = this.state;
    const { id, init, destroy } = OHIFDicomECGViewport;
    const pluginProps = { id, init, destroy };

    //Cargo la vista:
    return (
      <OHIFComponentPlugin {...pluginProps}>
        {this.state.byteArray && (
          <DicomECGViewport
            byteArray={byteArray}
            viewportData={viewportData}
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

export default OHIFDicomECGViewport;
