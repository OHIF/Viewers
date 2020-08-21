import React, { Component } from 'react';
import CornerstoneViewport from 'react-cornerstone-viewport';
import OHIF from '@ohif/core';
import csTools from 'cornerstone-tools';
import PropTypes from 'prop-types';
import debounce from 'lodash.debounce';
import getTools from './utils/getTools.js';
import setActiveAndPassiveToolsForElement from './utils/setActiveAndPassiveToolsForElement';

import { setEnabledElement } from './state';

const { StackManager } = OHIF.utils;

class OHIFCornerstoneViewport extends Component {
  state = {
    viewportData: null,
  };

  static defaultProps = {
    customProps: {},
  };

  static propTypes = {
    displaySet: PropTypes.object,
    viewportIndex: PropTypes.number,
    dataSource: PropTypes.object,
    children: PropTypes.node,
    customProps: PropTypes.object,
    ToolBarService: PropTypes.object,
  };

  static name = 'OHIFCornerstoneViewport';

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
   * @param {Object} displaySet
   * @param {Object} dataSource
   * @return {Object} CornerstoneTools Stack
   */
  static getCornerstoneStack(displaySet, dataSource) {
    const { imageIndex } = displaySet;

    // Get stack from Stack Manager
    const storedStack = StackManager.findOrCreateStack(displaySet, dataSource);

    // Clone the stack here so we don't mutate it
    const stack = Object.assign({}, storedStack);

    stack.currentImageIdIndex = imageIndex;

    // TODO -> Do we ever use this like this?
    // if (SOPInstanceUID) {
    //   const index = stack.imageIds.findIndex(imageId => {
    //     const imageIdSOPInstanceUID = cornerstone.metaData.get(
    //       'SOPInstanceUID',
    //       imageId
    //     );

    //     return imageIdSOPInstanceUID === SOPInstanceUID;
    //   });

    //   if (index > -1) {
    //     stack.currentImageIdIndex = index;
    //   } else {
    //     console.warn(
    //       'SOPInstanceUID provided was not found in specified DisplaySet'
    //     );
    //   }
    // }

    return stack;
  }

  getViewportData = async displaySet => {
    let viewportData;

    const { dataSource } = this.props;

    const stack = OHIFCornerstoneViewport.getCornerstoneStack(
      displaySet,
      dataSource
    );

    viewportData = {
      StudyInstanceUID: displaySet.StudyInstanceUID,
      displaySetInstanceUID: displaySet.displaySetInstanceUID,
      stack,
    };

    return viewportData;
  };

  setStateFromProps() {
    const { displaySet } = this.props;
    const {
      StudyInstanceUID,
      displaySetInstanceUID,
      sopClassUids,
    } = displaySet;

    if (!StudyInstanceUID || !displaySetInstanceUID) {
      return;
    }

    if (sopClassUids && sopClassUids.length > 1) {
      console.warn(
        'More than one SOPClassUID in the same series is not yet supported.'
      );
    }

    this.getViewportData(displaySet).then(viewportData => {
      this.setState({
        viewportData,
      });
    });
  }

  componentDidMount() {
    this.setStateFromProps();
  }

  componentDidUpdate(prevProps) {
    const { displaySet } = this.props;
    const prevDisplaySet = prevProps.displaySet;

    if (
      displaySet.displaySetInstanceUID !==
        prevDisplaySet.displaySetInstanceUID ||
      displaySet.SOPInstanceUID !== prevDisplaySet.SOPInstanceUID ||
      displaySet.imageIndex !== prevDisplaySet.imageIndex
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

    const debouncedNewImageHandler = debounce(
      ({ currentImageIdIndex, sopInstanceUid }) => {
        const { displaySet } = this.props;
        const { StudyInstanceUID } = displaySet;
        if (currentImageIdIndex > 0) {
          this.props.onNewImage({
            StudyInstanceUID,
            SOPInstanceUID: sopInstanceUid,
            imageIndex: currentImageIdIndex,
            activeViewportIndex: viewportIndex,
          });
        }
      },
      700
    );

    // TODO -> We may still want a wrapped component to define all the measurement api stuff.

    return (
      <>
        <CornerstoneViewport
          viewportIndex={viewportIndex}
          imageIds={imageIds}
          imageIdIndex={currentImageIdIndex}
          onNewImage={debouncedNewImageHandler}
          // TODO: ViewportGrid Context?
          isActive={true} // todo
          isStackPrefetchEnabled={true} // todo
          isPlaying={false}
          frameRate={24}
          // TODO: How do we share/track this?
          // For example, Tracked Extension also wraps this component
          // Could use window? Doesn't have to be reactive
          // Need to expose viewportGrid as a "UI Service"
          onElementEnabled={evt => {
            const enabledElement = evt.detail.element;
            const tools = getTools();
            const toolAlias = ToolBarService.state.primaryToolId;

            setEnabledElement(viewportIndex, enabledElement);
            setActiveAndPassiveToolsForElement(enabledElement, tools);
            csTools.setToolActiveForElement(enabledElement, toolAlias, {
              mouseButtonMask: 1,
            });
          }}
          // Sync resize throttle w/ sidepanel animation duration to prevent
          // seizure inducing strobe blinking effect
          resizeRefreshRateMs={150}
        />
        {childrenWithProps}
      </>
    );
  }
}

export default OHIFCornerstoneViewport;
