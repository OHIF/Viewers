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
    currentImageIdIndex: 0, // we would never use this?
    displaySetInstanceUid: undefined,
    frameRate: undefined,
    imageIds: undefined,
    studyInstanceUid: undefined,
  };

  static propTypes = {
    studies: PropTypes.arrayOf(
      PropTypes.shape({
        accessionNumber: PropTypes.string,
        displaySets: PropTypes.arrayOf(PropTypes.object),
        imageCount: PropTypes.number,
        institutionName: PropTypes.string,
        modalities: PropTypes.any,
        patientAge: PropTypes.number,
        patientId: PropTypes.string,
        patientName: PropTypes.string,
        patientSize: PropTypes.any,
        patientWeight: PropTypes.string,
        qidoRoot: PropTypes.string,
        seriesList: PropTypes.arrayOf(PropTypes.object),
        studyDate: PropTypes.string,
        studyDescription: PropTypes.string,
        studyInstanceUid: PropTypes.string,
        wadoRoot: PropTypes.string,
        wadoUriRoot: PropTypes.string,
      })
    ),
    displaySet: PropTypes.shape({
      displaySetInstanceUid: PropTypes.string,
      frameRate: PropTypes.number,
      instanceNumber: PropTypes.number,
      isMultiFrame: PropTypes.bool,
      modality: PropTypes.string,
      numImageFrames: PropTypes.number,
      plugin: PropTypes.string, // 'cornerstone'
      seriesDate: PropTypes.string,
      seriesDescription: PropTypes.string,
      seriesInstanceUid: PropTypes.string,
      seriesNumber: PropTypes.number,
      seriesTime: PropTypes.string,
      sopClassUids: PropTypes.arrayOf(PropTypes.string),
      studyInstanceUid: PropTypes.string,
    }),
    viewportIndex: PropTypes.number,
    children: PropTypes.node,
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
  getCornerstoneStack = (
    studies,
    studyInstanceUid,
    displaySetInstanceUid,
    sopInstanceUid,
    frameIndex = 0
  ) => {
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

    // Is this so our start image index aligns with the sopInstanceUid for the stack?
    // A little lost.
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
  };

  // CALLED IN GETSTATEFROMPROPS
  getViewportData = async (
    studies,
    studyInstanceUid,
    displaySetInstanceUid,
    sopClassUid,
    sopInstanceUid,
    frameIndex
  ) => {
    switch (sopClassUid) {
      case SOP_CLASSES.SEGMENTATION_STORAGE:
        const specialCaseHandler =
          specialCaseHandlers[SOP_CLASSES.SEGMENTATION_STORAGE];

        return await specialCaseHandler(
          studies,
          studyInstanceUid,
          displaySetInstanceUid,
          sopInstanceUid,
          frameIndex
        );
      default:
        return this.getCornerstoneStack(
          studies,
          studyInstanceUid,
          displaySetInstanceUid,
          sopInstanceUid,
          frameIndex
        );
    }
  };

  setStateFromProps() {
    const { studies, displaySet } = this.props;
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
      const {
        currentImageIdIndex,
        displaySetInstanceUid,
        frameRate,
        imageIds,
        studyInstanceUid,
      } = viewportData;

      this.setState({
        currentImageIdIndex, // we would never use this?
        displaySetInstanceUid,
        frameRate,
        imageIds,
        studyInstanceUid,
      });
    });
  }

  componentDidMount() {
    this.setStateFromProps();
  }

  componentDidUpdate(prevProps) {
    const { studies, displaySet } = this.props;
    const { displaySet: prevDisplaySet } = prevProps;

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
          key: index,
        });
      });
    }

    const {
      currentImageIdIndex: imageIdIndex,
      imageIds,
      frameRate,
    } = this.state;

    return imageIds ? (
      <>
        <ConnectedCornerstoneViewport
          tools={[]} // TODO: Fix
          imageIds={imageIds}
          imageIdIndex={imageIdIndex}
          frameRate={frameRate}
          // We shouldn't need this?
          viewportIndex={this.props.viewportIndex}
        />
        {childrenWithProps}
      </>
    ) : null;
  }
}

export default OHIFCornerstoneViewport;
