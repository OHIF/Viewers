import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import CornerstoneViewport from 'react-cornerstone-viewport';
import OHIF from '@ohif/core';
import { ViewportActionBar } from '@ohif/ui';
import debounce from 'lodash.debounce';
import throttle from 'lodash.throttle';


// const cine = viewportSpecificData.cine;

// isPlaying = cine.isPlaying === true;
// frameRate = cine.cineFrameRate || frameRate;

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
  };

  static name = 'OHIFCornerstoneViewport';

  static init() {
    console.log('OHIFCornerstoneViewport init()');
  }

  // TODO: Still needed? Better way than import `OHIF` and destructure?
  // Why is this managed by `core`?
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
    const { frameIndex } = displaySet;

    // Get stack from Stack Manager
    const storedStack = StackManager.findOrCreateStack(displaySet, dataSource);

    // Clone the stack here so we don't mutate it
    const stack = Object.assign({}, storedStack);

    stack.currentImageIdIndex = frameIndex;

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
        <ViewportActionBar
          onSeriesChange={direction => alert(`Series ${direction}`)}
          studyData={{
            label: 'A',
            isTracked: true,
            isLocked: false,
            studyDate: '07-Sep-2011',
            currentSeries: 1,
            seriesDescription:
              'Series description lorem ipsum dolor sit Series description lorem ipsum dolor sit Series description lorem ipsum dolor sit ',
            modality: 'CT',
            patientInformation: {
              patientName: 'Smith, Jane',
              patientSex: 'F',
              patientAge: '59',
              MRN: '10000001',
              thickness: '5.0mm',
              spacing: '1.25mm',
              scanner: 'Aquilion',
            },
          }}
        />
        <CornerstoneViewport
          viewportIndex={viewportIndex}
          imageIds={imageIds}
          imageIdIndex={currentImageIdIndex}
          // TODO: ViewportGrid Context?
          isActive={true} // todo
          isStackPrefetchEnabled={true} // todo
          isPlaying={false}
          frameRate={24}
        />
        {childrenWithProps}
      </>
    );
  }
}

export default OHIFCornerstoneViewport;
