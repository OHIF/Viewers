import React, { Component } from 'react';

import ConnectedCornerstoneViewport from './ConnectedCornerstoneViewport';
import OHIF from '@ohif/core';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import handleSegmentationStorage from './handleSegmentationStorage.js';

const { StackManager } = OHIF.utils;

// Metadata configuration
const metadataProvider = new OHIF.cornerstone.MetadataProvider();

cornerstone.metaData.addProvider(
  metadataProvider.provider.bind(metadataProvider)
);

StackManager.setMetadataProvider(metadataProvider);

const SOP_CLASSES = {
  SEGMENTATION_STORAGE: '1.2.840.10008.5.1.4.1.1.66.4',
};

const specialCaseHandlers = {};
specialCaseHandlers[
  SOP_CLASSES.SEGMENTATION_STORAGE
] = handleSegmentationStorage;

class OHIFCornerstoneViewport extends Component {
  state = {
    viewportData: null,
  };

  static defaultProps = {
    customProps: {},
  };

  static propTypes = {
    studies: PropTypes.object,
    displaySet: PropTypes.object,
    viewportIndex: PropTypes.number,
    children: PropTypes.node,
    customProps: PropTypes.object,
  };

  static id = 'OHIFCornerstoneViewport';

  static init() {
    console.log('OHIFCornerstoneViewport init()');
  }

  static destroy() {
    console.log('OHIFCornerstoneViewport destroy()');
    StackManager.clearStacks();
  }

  /**
   * Obtain the CornerstoneTools Stack for the specified display set.
   *
   * @param {Object[]} studies
   * @param {String} studyInstanceUid
   * @param {String} displaySetInstanceUid
   * @param {String} [sopInstanceUid]
   * @param {Number} [frameIndex=1]
   * @return {Object} CornerstoneTools Stack
   */
  static getCornerstoneStack(
    studies,
    studyInstanceUid,
    displaySetInstanceUid,
    sopInstanceUid,
    frameIndex = 0
  ) {
    if (!studies || !studies.length) {
      throw new Error('Studies not provided.');
    }

    if (!studyInstanceUid) {
      throw new Error('StudyInstanceUID not provided.');
    }

    if (!displaySetInstanceUid) {
      throw new Error('StudyInstanceUID not provided.');
    }

    // Create shortcut to displaySet
    const study = studies.find(
      study => study.studyInstanceUid === studyInstanceUid
    );

    if (!study) {
      throw new Error('Study not found.');
    }

    const displaySet = study.displaySets.find(set => {
      return set.displaySetInstanceUid === displaySetInstanceUid;
    });

    if (!displaySet) {
      throw new Error('Display Set not found.');
    }

    // Get stack from Stack Manager
    const storedStack = StackManager.findOrCreateStack(study, displaySet);

    // Clone the stack here so we don't mutate it
    const stack = Object.assign({}, storedStack);
    stack.currentImageIdIndex = frameIndex;

    if (sopInstanceUid) {
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
      } else {
        console.warn(
          'SOPInstanceUID provided was not found in specified DisplaySet'
        );
      }
    }

    return stack;
  }

  getViewportData = async (
    studies,
    studyInstanceUid,
    displaySetInstanceUid,
    sopClassUid,
    sopInstanceUid,
    frameIndex
  ) => {
    let viewportData;

    switch (sopClassUid) {
      case SOP_CLASSES.SEGMENTATION_STORAGE:
        const specialCaseHandler =
          specialCaseHandlers[SOP_CLASSES.SEGMENTATION_STORAGE];

        viewportData = await specialCaseHandler(
          studies,
          studyInstanceUid,
          displaySetInstanceUid,
          sopInstanceUid,
          frameIndex
        );
        break;
      default:
        const stack = OHIFCornerstoneViewport.getCornerstoneStack(
          studies,
          studyInstanceUid,
          displaySetInstanceUid,
          sopInstanceUid,
          frameIndex
        );

        viewportData = {
          studyInstanceUid,
          displaySetInstanceUid,
          stack,
        };

        break;
    }

    return viewportData;
  };

  setStateFromProps() {
    const { studies, displaySet } = this.props.viewportData;
    const {
      studyInstanceUid,
      displaySetInstanceUid,
      sopClassUids,
      sopInstanceUid,
      frameIndex,
    } = displaySet;

    if (!studyInstanceUid || !displaySetInstanceUid) {
      return;
    }

    if (sopClassUids && sopClassUids.length > 1) {
      console.warn(
        'More than one SOPClassUid in the same series is not yet supported.'
      );
    }

    const sopClassUid = sopClassUids && sopClassUids[0];

    this.getViewportData(
      studies,
      studyInstanceUid,
      displaySetInstanceUid,
      sopClassUid,
      sopInstanceUid,
      frameIndex
    ).then(viewportData => {
      this.setState({
        viewportData,
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

    if (!this.state.viewportData) {
      return null;
    }
    const { viewportIndex } = this.props;
    const {
      imageIds,
      currentImageIdIndex,
      // If this comes from the instance, would be a better default
      // `FrameTime` in the instance
      // frameRate = 0,
    } = this.state.viewportData.stack;

    // TODO: Does it make more sense to use Context?
    if (this.props.children && this.props.children.length) {
      childrenWithProps = this.props.children.map((child, index) => {
        return (
          child &&
          React.cloneElement(child, {
            viewportIndex: this.props.viewportIndex,
            key: index,
          })
        );
      });
    }

    return (
      <>
        <ConnectedCornerstoneViewport
          viewportIndex={viewportIndex}
          imageIds={imageIds}
          imageIdIndex={currentImageIdIndex}
          // ~~ Connected (From REDUX)
          // frameRate={frameRate}
          // isPlaying={false}
          // isStackPrefetchEnabled={true}
          // onElementEnabled={() => {}}
          // setViewportActive{() => {}}
          {...this.props.customProps}
        />
        {childrenWithProps}
      </>
    );
  }
}

export default OHIFCornerstoneViewport;
