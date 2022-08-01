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
    error: null,
    pathname: window.location.pathname,
  };

  static id = 'DicomECGViewport';

  static init() {
    console.log('DicomECGViewport init()');
  }

  static destroy() {
    console.log('DicomECGViewport destroy()');
  }

  //On udapte element:
  componentDidUpdate(prevProps) {
    const { displaySet } = this.props.viewportData;
    const prevDisplaySet = prevProps.viewportData.displaySet;

    if (
      displaySet.displaySetInstanceUID !==
        prevDisplaySet.displaySetInstanceUID ||
      displaySet.SOPInstanceUID !== prevDisplaySet.SOPInstanceUID
    ) {
      this.setState({
        byteArray: null,
      });
      //Change data:
      if (this.state.pathname == '/local') {
        this.loadLocalByteArray();
      } else {
        this.loadServerByteArray();
      }
    }
  }

  componentDidMount() {
    //Load byteArray:
    if (this.state.pathname != '/local') {
      this.loadServerByteArray();
    } else {
      this.loadLocalByteArray();
    }
  }

  //Load from server request:
  loadServerByteArray() {
    const { displaySet } = this.props.viewportData;
    var oReq = new XMLHttpRequest();
    oReq.open('get', displaySet.wadoUri, true);
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
        }
      }
    };
    oReq.send();
  }

  //Local data:
  loadLocalByteArray() {
    const { displaySet, studies } = this.props.viewportData;
    //Get index of selected:
    let index = 0;
    for (let i = 0; i < studies.length; i++) {
      if (studies[i].StudyInstanceUID == displaySet.StudyInstanceUID) {
        index = i;
      }
    }
    let studySelected = [studies[index]];
    DicomLoaderService.findDicomDataPromise(displaySet, studySelected).then(
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
        {byteArray && (
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
