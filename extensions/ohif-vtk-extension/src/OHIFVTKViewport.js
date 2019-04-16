import React, { Component } from 'react';
import PropTypes from 'prop-types';
import OHIF from 'ohif-core';
import ConnectedVTKViewport from './ConnectedVTKViewport';
import cornerstone from 'cornerstone-core';
import handleSegmentationStorage from './handleSegmentationStorage.js';
import { getImageData, loadImageData } from 'react-vtkjs-viewport';
import LoadingIndicator from './LoadingIndicator.js';

const { StackManager } = OHIF.utils;

// Metadata configuration
const metadataProvider = new OHIF.cornerstone.MetadataProvider();

cornerstone.metaData.addProvider(
  metadataProvider.provider.bind(metadataProvider)
);

StackManager.setMetadataProvider(metadataProvider);

const SOP_CLASSES = {
  SEGMENTATION_STORAGE: '1.2.840.10008.5.1.4.1.1.66.4'
};

const specialCaseHandlers = {};
specialCaseHandlers[
  SOP_CLASSES.SEGMENTATION_STORAGE
] = handleSegmentationStorage;

class OHIFVTKViewport extends Component {
  state = {
    viewportData: null
  };

  static propTypes = {
    studies: PropTypes.object,
    displaySet: PropTypes.object,
    viewportIndex: PropTypes.number,
    children: PropTypes.node
  };

  static id = 'OHIFCornerstoneViewport';

  static init() {
    console.log('OHIFCornerstoneViewport init()');
  }

  static destroy() {
    console.log('OHIFCornerstoneViewport destroy()');
    StackManager.clearStacks();
  }

  static getCornerstoneStack(
    studies,
    studyInstanceUid,
    displaySetInstanceUid,
    sopInstanceUid,
    frameIndex
  ) {
    // Create shortcut to displaySet
    const study = studies.find(
      study => study.studyInstanceUid === studyInstanceUid
    );

    const displaySet = study.displaySets.find(set => {
      return set.displaySetInstanceUid === displaySetInstanceUid;
    });

    // Get stack from Stack Manager
    const storedStack = StackManager.findOrCreateStack(study, displaySet);

    // Clone the stack here so we don't mutate it
    const stack = Object.assign({}, storedStack);

    if (frameIndex !== undefined) {
      stack.currentImageIdIndex = frameIndex;
    } else if (sopInstanceUid) {
      const index = stack.imageIds.findIndex(imageId => {
        const sopCommonModule = cornerstone.metaData.get(
          'sopCommonModule',
          imageId
        );
        if (!sopCommonModule) {
          return;
        }

        return sopCommonModule.sopInstanceUID === sopInstanceUid;
      });

      if (index > -1) {
        stack.currentImageIdIndex = index;
      }
    } else {
      stack.currentImageIdIndex = 0;
    }

    return stack;
  }

  static getViewportData = (
    studies,
    studyInstanceUid,
    displaySetInstanceUid,
    sopInstanceUid,
    frameIndex
  ) => {
    return OHIFVTKViewport.getCornerstoneStack(
      studies,
      studyInstanceUid,
      displaySetInstanceUid,
      sopInstanceUid,
      frameIndex
    );
  };

  getViewportData = (
    studies,
    studyInstanceUid,
    displaySetInstanceUid,
    sopClassUid,
    sopInstanceUid,
    frameIndex
  ) => {
    return new Promise((resolve, reject) => {
      const stack = OHIFVTKViewport.getViewportData(
        studies,
        studyInstanceUid,
        displaySetInstanceUid,
        sopClassUid,
        sopInstanceUid,
        frameIndex
      );

      let imageDataObject;
      let labelmapDataObject;
      let doneLoadingCallback;
      let callbacks;

      switch (sopClassUid) {
        case SOP_CLASSES.SEGMENTATION_STORAGE:
          throw new Error("Not yet implemented");

          const data = handleSegmentationStorage(stack.imageIds, displaySetInstanceUid, cornerstone);
          imageDataObject = data.referenceDataObject;
          labelmapDataObject = data.labelmapDataObject;

          doneLoadingCallback = () => {
            resolve({
              data: imageDataObject.vtkImageData,
              labelmap: labelmapDataObject
            });
          };

          callbacks = [
            doneLoadingCallback
          ];

          loadImageData(imageDataObject, callbacks, cornerstone);

          break;
        default:
          imageDataObject = getImageData(stack.imageIds, displaySetInstanceUid, cornerstone);
          doneLoadingCallback = () => {
            resolve({
              data: imageDataObject.vtkImageData,
            });
          };

          callbacks = [
            doneLoadingCallback
          ];

          loadImageData(imageDataObject, callbacks, cornerstone);

          break;
      }
    });
  };

  setStateFromProps() {
    const { studies, displaySet } = this.props.viewportData;
    const {
      studyInstanceUid,
      displaySetInstanceUid,
      sopClassUids,
      sopInstanceUid,
      frameIndex
    } = displaySet;

    if (sopClassUids.length > 1) {
      console.warn(
        'More than one SOPClassUid in the same series is not yet supported.'
      );
    }

    const sopClassUid = sopClassUids[0];

    this.getViewportData(
      studies,
      studyInstanceUid,
      displaySetInstanceUid,
      sopClassUid,
      sopInstanceUid,
      frameIndex
    ).then(({ data, labelmap })=> {
      this.setState({
        viewportData: data,
        labelmap
      });
    });
  }

  componentDidMount() {
    this.setStateFromProps();
  }

  componentDidUpdate(prevProps) {
    const { studies, displaySet } = this.props.viewportData;
    const prevDisplaySet = prevProps.viewportData.displaySet;

    if (
      displaySet.displaySetInstanceUid !==
        prevDisplaySet.displaySetInstanceUid ||
      displaySet.sopInstanceUid !== prevDisplaySet.sopInstanceUid ||
      displaySet.frameIndex !== prevDisplaySet.frameIndex
    ) {
      this.setStateFromProps();
    }
  }

  render() {
    let childrenWithProps = null;

    // TODO: Does it make more sense to use Context?
    if (this.props.children && this.props.children.length) {
      childrenWithProps = this.props.children.map((child, index) => {
        return React.cloneElement(child, {
          viewportIndex: this.props.viewportIndex,
          key: index
        });
      });
    }

    const style = { width: '100%', height: '100%', position: 'relative' };

    return (
      <>
        {this.state.viewportData ? (
          <ConnectedVTKViewport
            data={this.state.viewportData}
            labelmap={this.state.labelmap}
            viewportIndex={this.props.viewportIndex}
          />
        ) : <div style={style}>
          <LoadingIndicator/>
        </div>}
        {childrenWithProps}
      </>
    );
  }
}

export default OHIFVTKViewport;
