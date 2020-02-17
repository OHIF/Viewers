import React, { Component } from 'react';
import PropTypes from 'prop-types';
import debounce from 'lodash.debounce';

import cornerstone from 'cornerstone-core';
import OHIF from '@ohif/core';
import ConnectedCornerstoneViewport from './ConnectedCornerstoneViewport';

const { StackManager } = OHIF.utils;
const { setViewportSpecificData } = OHIF.redux.actions;

class OHIFCornerstoneViewport extends Component {
  state = {
    imageIds: null,
    currentImageIdIndex: null
  };

  static defaultProps = {
    customProps: {},
  };

  /** INTERFACE FOR PLATFORM/VIEWER PROJECT
   *  - Our "Generic Viewport" interface
   */
  static propTypes = {
    viewportIndex: PropTypes.number.isRequired,
    /** viewportSpecificData from REDUX */
    viewportData: PropTypes.shape({
      studies: PropTypes.arrayOf(PropTypes.object).isRequired,
      displaySet: PropTypes.shape({
        studyInstanceUid: PropTypes.string.isRequired,
        displaySetInstanceUid: PropTypes.string.isRequired,
        sopClassUids: PropTypes.arrayOf(PropTypes.string),
        sopInstanceUid: PropTypes.string.string,
        frameIndex: PropTypes.number,
      }).isRequired
    }),
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
   * @param {Number} [frameIndex=0]
   * @return {Object} { imageIds: strin[], currentImageIdIndex: number }
   */
  static getCornerstoneStack(
    studies,
    studyInstanceUid,
    displaySetInstanceUid,
    sopInstanceUid,
    frameIndex = 0
  ) {
    try {
      const study = studies.find(
        study => study.studyInstanceUid === studyInstanceUid
      );

      const displaySet = study.displaySets.find(set => {
        return set.displaySetInstanceUid === displaySetInstanceUid;
      });

      const { imageIds } = StackManager.findOrCreateStack(study, displaySet);
      const currentImageIdIndex = _getIndexOfSopInstanceUid(imageIds, sopInstanceUid) || frameIndex;

      return {
        imageIds,
        currentImageIdIndex,
      };
    } catch (ex) {
      console.error(ex);
      throw new Error(`OHIFCornerstoneViewport: getCornerstoneStack: ${ex.message}`);
    }
  }

  setStateFromProps(studies,
    studyInstanceUid,
    displaySetInstanceUid,
    sopClassUids,
    sopInstanceUid,
    frameIndex
  ) {
    const shouldWarnSopClassLimitation = sopClassUids && sopClassUids.length > 1;

    if (shouldWarnSopClassLimitation) {
      console.warn(
        'More than one SOPClassUid in the same series is not yet supported.'
      );
    }

    const {
      imageIds,
      currentImageIdIndex,
    } = OHIFCornerstoneViewport.getCornerstoneStack(
      studies,
      studyInstanceUid,
      displaySetInstanceUid,
      sopInstanceUid,
      frameIndex
    );

    this.setState({
      imageIds,
      currentImageIdIndex
    });
  }

  componentDidMount() {
    const { studies, displaySet } = this.props.viewportData;
    const {
      studyInstanceUid,
      displaySetInstanceUid,
      sopClassUids,
      sopInstanceUid,
      frameIndex,
    } = displaySet;

    this.setStateFromProps(studies,
      studyInstanceUid,
      displaySetInstanceUid,
      sopClassUids,
      sopInstanceUid,
      frameIndex);
  }

  componentDidUpdate(prevProps) {
    const { studies, displaySet } = this.props.viewportData;
    const {
      studyInstanceUid,
      displaySetInstanceUid,
      sopClassUids,
      sopInstanceUid,
      frameIndex,
    } = displaySet;
    const prevDisplaySet = prevProps.viewportData.displaySet;
    /*
     * These values drill down and identify the location of the image that
     * should be displayed. DisplaySet --> SopInstance --> Frame
     */
    const displaySetChanged = displaySet.displaySetInstanceUid !==
      prevDisplaySet.displaySetInstanceUid;
    const sopInstanceChanged = displaySet.sopInstanceUid !== prevDisplaySet.sopInstanceUid;
    const frameIndexChanged = displaySet.frameIndex !== prevDisplaySet.frameIndex;
    const shouldDisplayNewImage = displaySetChanged || sopInstanceChanged || frameIndexChanged;

    if (shouldDisplayNewImage) {
      this.setStateFromProps(studies,
        studyInstanceUid,
        displaySetInstanceUid,
        sopClassUids,
        sopInstanceUid,
        frameIndex);
    }
  }

  render() {
    if (!this.state.imageIds) {
      return null;
    }
    const { viewportIndex } = this.props;
    const {
      imageIds,
      currentImageIdIndex,
      // If this comes from the instance, would be a better default
      // `FrameTime` in the instance
      // frameRate = 0,
    } = this.state;

    const onStackScrollStop = debounce(event => {
      const { imageId: newImageId } = event.detail.image;

      const { sopInstanceUid } =
        cornerstone.metaData.get('generalImageModule', newImageId) || {};

      window.store.dispatch(setViewportSpecificData(
        viewportIndex, {
        ...this.props.viewportData.displaySet,
        sopInstanceUid
      }));
    }, 1000);

    return (
      <ConnectedCornerstoneViewport
        viewportIndex={viewportIndex}
        imageIds={imageIds}
        imageIdIndex={currentImageIdIndex}
        // ~~
        eventListeners={[
          {
            target: 'element',
            eventName: cornerstone.EVENTS.NEW_IMAGE,
            handler: onStackScrollStop
          }
        ]}
        // ~~ Connected (From REDUX)
        // frameRate={frameRate}
        // isPlaying={false}
        // isStackPrefetchEnabled={true}
        // onElementEnabled={() => {}}
        // setViewportActive{() => {}}
        {...this.props.customProps}
      />
    );
  }
}

/**
 *
 *
 * @param {string[]} imageIds - Array of "Cornerstone Image Ids"
 * @param {string} sopInstanceUid - DICOM SopInstanceUid (uniquely identifies a DICOM instance)
 * @returns {number} Index of imageId with matching sopInstanceUid, or undefined if no match
 */
function _getIndexOfSopInstanceUid(imageIds, sopInstanceUid) {
  try {
    const index = imageIds.findIndex(imageId => {
      const sopCommonModule = cornerstone.metaData.get(
        'sopCommonModule',
        imageId
      );

      return sopCommonModule.sopInstanceUID === sopInstanceUid;
    });

    if (index > -1) {
      return index;
    }

    throw new Error('SOPInstanceUID not found in imageIds');

  } catch (ex) {
    console.warn(
      'SOPInstanceUID provided was not found in specified DisplaySet'
    );
  }
}

export default OHIFCornerstoneViewport;
