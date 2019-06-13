import './ViewerMain.css';

import { Component } from 'react';
import ConnectedLayoutManager from './ConnectedLayoutManager.js';
// import { OHIF } from 'ohif-core';
//
import PropTypes from 'prop-types';
import React from 'react';

class ViewerMain extends Component {
  static propTypes = {
    activeViewportIndex: PropTypes.number.isRequired,
    layout: PropTypes.object,
    viewportSpecificData: PropTypes.object,
    setViewportSpecificData: PropTypes.func.isRequired,
    clearViewportSpecificData: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);

    // Initialize hotkeys
    // new OHIF.HotkeysUtil('viewer', {
    //   setViewportSpecificData: props.setViewportSpecificData,
    //   clearViewportSpecificData: props.clearViewportSpecificData,
    //   setToolActive: props.setToolActive,
    //   setActiveViewportSpecificData: props.setActiveViewportSpecificData,
    // });
    // hotkeys.init();

    this.state = {
      displaySets: [],
    };

    this.cachedViewportData = {};
  }

  getDisplaySets(studies) {
    const displaySets = [];
    studies.forEach(study => {
      study.displaySets.forEach(dSet => {
        if (!dSet.plugin) {
          dSet.plugin = 'cornerstone';
        }
        displaySets.push(dSet);
      });
    });

    return displaySets;
  }

  findDisplaySet(studies, studyInstanceUid, displaySetInstanceUid) {
    const study = studies.find(study => {
      return study.studyInstanceUid === studyInstanceUid;
    });

    if (!study) {
      return;
    }

    return study.displaySets.find(displaySet => {
      return displaySet.displaySetInstanceUid === displaySetInstanceUid;
    });
  }

  componentDidMount() {
    // Add beforeUnload event handler to check for unsaved changes
    //window.addEventListener('beforeunload', unloadHandlers.beforeUnload);

    // Get all the display sets for the viewer studies
    const displaySets = this.getDisplaySets(this.props.studies);

    this.setState({
      displaySets,
    });
  }

  getViewportData = () => {
    const viewportData = [];
    const { layout, viewportSpecificData } = this.props;

    for (
      let viewportIndex = 0;
      viewportIndex < layout.viewports.length;
      viewportIndex++
    ) {
      let displaySet = viewportSpecificData[viewportIndex];

      // Use the cached display set in viewport if the new one is empty
      if (displaySet && !displaySet.displaySetInstanceUid) {
        displaySet = this.cachedViewportData[viewportIndex];
      }

      if (
        displaySet &&
        displaySet.studyInstanceUid &&
        displaySet.displaySetInstanceUid
      ) {
        // Get missing fields from original display set
        const originalDisplaySet = this.findDisplaySet(
          this.props.studies,
          displaySet.studyInstanceUid,
          displaySet.displaySetInstanceUid
        );
        viewportData.push(Object.assign({}, originalDisplaySet, displaySet));
      } else {
        // If the viewport is empty, get one available in study
        const { displaySets } = this.state;
        displaySet = displaySets.find(
          ds =>
            !viewportData.some(
              v => v.displaySetInstanceUid === ds.displaySetInstanceUid
            )
        );
        viewportData.push(Object.assign({}, displaySet));
      }
    }

    this.cachedViewportData = viewportData;

    return viewportData;
  };

  setViewportData = ({ viewportIndex, item }) => {
    const displaySet = this.findDisplaySet(
      this.props.studies,
      item.studyInstanceUid,
      item.displaySetInstanceUid
    );

    this.props.setViewportSpecificData(viewportIndex, displaySet);
  };

  render() {
    return (
      <div className="ViewerMain">
        <ConnectedLayoutManager
          studies={this.props.studies}
          viewportData={this.getViewportData()}
          setViewportData={this.setViewportData}
        />
      </div>
    );
  }

  componentWillUnmount() {
    // Clear the entire viewport specific data
    const { viewportSpecificData } = this.props;
    Object.keys(viewportSpecificData).forEach(viewportIndex => {
      this.props.clearViewportSpecificData(viewportIndex);
    });

    // TODO: These don't have to be viewer specific?
    // Could qualify for other routes?
    // hotkeys.destroy();

    // Remove beforeUnload event handler...
    //window.removeEventListener('beforeunload', unloadHandlers.beforeUnload);
    // Destroy the synchronizer used to update reference lines
    //OHIF.viewer.updateImageSynchronizer.destroy();
    // TODO: Instruct all plugins to clean up themselves
    //
    // Clear references to all stacks in the StackManager
    //StackManager.clearStacks();
    // @TypeSafeStudies
    // Clears OHIF.viewer.Studies collection
    //OHIF.viewer.Studies.removeAll();
    // @TypeSafeStudies
    // Clears OHIF.viewer.StudyMetadataList collection
    //OHIF.viewer.StudyMetadataList.removeAll();
  }
}

export default ViewerMain;
