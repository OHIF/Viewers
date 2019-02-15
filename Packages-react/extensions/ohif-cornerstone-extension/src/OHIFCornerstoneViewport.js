import React, { Component } from 'react';
import PropTypes from 'prop-types';
import OHIF from 'ohif-core';
import ConnectedCornerstoneViewport from './ConnectedCornerstoneViewport';
import cornerstoneTools from 'cornerstone-tools';
import cornerstone from 'cornerstone-core';
import './config';
import handleSegmentationStorage from './handleSegmentationStorage.js';

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

class OHIFCornerstoneViewport extends Component {
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

  static getCornerstoneStack(studies, studyInstanceUid, displaySetInstanceUid) {
    // Create shortcut to displaySet
    const study = studies.find(
      study => study.studyInstanceUid === studyInstanceUid
    );

    const displaySet = study.displaySets.find(set => {
      return set.displaySetInstanceUid === displaySetInstanceUid;
    });

    // Get stack from Stack Manager
    return StackManager.findOrCreateStack(study, displaySet);
  }

  static getViewportData = (
    studies,
    studyInstanceUid,
    displaySetInstanceUid
  ) => {
    const currentStack = OHIFCornerstoneViewport.getCornerstoneStack(
      studies,
      studyInstanceUid,
      displaySetInstanceUid
    );

    // Clone the stack here so we don't mutate it later
    const stack = Object.assign({}, currentStack);
    stack.currentImageIdIndex = 0;

    return stack;
  };

  getViewportData = async (
    studies,
    studyInstanceUid,
    displaySetInstanceUid,
    sopClassUid
  ) => {
    let viewportData;

    switch (sopClassUid) {
      case SOP_CLASSES.SEGMENTATION_STORAGE:
        const specialCaseHandler =
          specialCaseHandlers[SOP_CLASSES.SEGMENTATION_STORAGE];

        viewportData = await specialCaseHandler(
          studies,
          studyInstanceUid,
          displaySetInstanceUid
        );
        break;
      default:
        const stack = OHIFCornerstoneViewport.getViewportData(
          studies,
          studyInstanceUid,
          displaySetInstanceUid
        );
        viewportData = {
          studyInstanceUid,
          displaySetInstanceUid,
          stack
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
      sopClassUids
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
      sopClassUid
    ).then(viewportData => {
      this.setState({
        viewportData
      });
    });
  }

  componentDidMount() {
    this.setStateFromProps();
  }

  componentDidUpdate(prevProps) {
    const { studies, displaySet } = this.props.viewportData;
    const { displaySetInstanceUid } = displaySet;
    const prevDisplaySet = prevProps.viewportData.displaySet;

    if (
      displaySet.displaySetInstanceUid !== prevDisplaySet.displaySetInstanceUid
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

    return (
      <>
        {this.state.viewportData && (
          <ConnectedCornerstoneViewport
            viewportData={this.state.viewportData}
            viewportIndex={this.props.viewportIndex}
          />
        )}
        {childrenWithProps}
      </>
    );
  }
}

export default OHIFCornerstoneViewport;
