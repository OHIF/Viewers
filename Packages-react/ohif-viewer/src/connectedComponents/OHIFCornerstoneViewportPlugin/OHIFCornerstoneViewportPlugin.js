import React, { Component } from "react";
import PropTypes from "prop-types";
import OHIF from 'ohif-core';
import ConnectedCornerstoneViewport from './ConnectedCornerstoneViewport';
import OHIFComponentPlugin from '../OHIFComponentPlugin.js';
import cornerstoneTools from "cornerstone-tools";
import cornerstone from "cornerstone-core";
import './config';

const { StackManager } = OHIF.utils;

// Create the synchronizer used to update reference lines
OHIF.viewer.updateImageSynchronizer = new cornerstoneTools.Synchronizer('cornerstonenewimage', cornerstoneTools.updateImageSynchronizer);

// Metadata configuration
const metadataProvider = new OHIF.cornerstone.MetadataProvider();

cornerstone.metaData.addProvider(metadataProvider.provider.bind(metadataProvider));

StackManager.setMetadataProvider(metadataProvider);

class OHIFCornerstoneViewportPlugin extends Component {
  static propTypes = {
    studies: PropTypes.object,
    displaySet: PropTypes.object,
    viewportIndex: PropTypes.number,
  };

  static id = 'CornerstoneViewportPlugin';

  static init() {
    console.log('CornerstoneViewportPlugin init()');
  }

  static destroy() {
    console.log('CornerstoneViewportPlugin destroy()');
    StackManager.clearStacks();
  }

  static getCornerstoneStack(studies, studyInstanceUid, displaySetInstanceUid) {
    // Create shortcut to displaySet
    const study = studies.find(study => study.studyInstanceUid === studyInstanceUid);

    const displaySet = study.displaySets.find((set) => {
      return set.displaySetInstanceUid === displaySetInstanceUid;
    });

    // Get stack from Stack Manager
    return StackManager.findOrCreateStack(study, displaySet);
  }

  static getPluginViewportData = (studies, studyInstanceUid, displaySetInstanceUid) => {
    const currentStack = OHIFCornerstoneViewportPlugin.getCornerstoneStack(studies, studyInstanceUid, displaySetInstanceUid);

    // Clone the stack here so we don't mutate it later
    const stack = Object.assign({}, currentStack);
    stack.currentImageIdIndex = 0;

    return stack;
  }

  render() {
    const { viewportIndex } = this.props;
    const { studies, displaySet } = this.props.viewportData;
    const { studyInstanceUid, displaySetInstanceUid } = displaySet;
    const stack = OHIFCornerstoneViewportPlugin.getPluginViewportData(studies, studyInstanceUid, displaySetInstanceUid);
    const viewportData = {
      studyInstanceUid,
      displaySetInstanceUid,
      stack
    };

    const { id, init, destroy } = OHIFCornerstoneViewportPlugin;
    const pluginProps = { id, init, destroy };

    return (
      <OHIFComponentPlugin {...pluginProps}>
        <ConnectedCornerstoneViewport viewportData={viewportData} viewportIndex={viewportIndex}/>
      </OHIFComponentPlugin>
    );
  }
}


export default OHIFCornerstoneViewportPlugin;
