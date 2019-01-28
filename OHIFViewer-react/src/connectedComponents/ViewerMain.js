import { Component } from 'react';
import React from 'react';
import PropTypes from 'prop-types';
import { OHIF } from 'ohif-core';
import ConnectedLayoutManager from './ConnectedLayoutManager.js';
import './ViewerMain.css';

class ViewerMain extends Component {
  state = {
    viewportData: [],
  };

  static propTypes = {
    studies: PropTypes.array.isRequired
  };

  getDisplaySets(studies) {
    const displaySets = [];
    studies.forEach((study) => {
      study.displaySets.forEach(dSet => {
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
      viewportData: displaySets
    });
  }

  setViewportData = ({viewportIndex, item}) => {
    // TODO: Replace this with mapDispatchToProps call
    // if we decide to put viewport info into redux

    // Note: Use Slice because React does a shallow equality check. Mutating the array
    // would not trigger a re-render. We have to create a copy.
    const updatedViewportData = this.state.viewportData.slice(0);

    const displaySet = this.findDisplaySet(this.props.studies, item.studyInstanceUid, item.displaySetInstanceUid);

    updatedViewportData[viewportIndex] = Object.assign({}, displaySet);

    this.setState({
      viewportData: updatedViewportData
    });
  }

  render() {
    return (
      <div className="ViewerMain">
        <ConnectedLayoutManager
          studies={this.props.studies}
          viewportData={this.state.viewportData}
          setViewportData={this.setViewportData}
        />
      </div>
    );
  }

  componentWillUnmount() {
    // Remove beforeUnload event handler...
    //window.removeEventListener('beforeunload', unloadHandlers.beforeUnload);

    // Destroy the synchronizer used to update reference lines
    OHIF.viewer.updateImageSynchronizer.destroy();

    // TODO: Instruct all plugins to clean up themselves

    // @TypeSafeStudies
    // Clears OHIF.viewer.Studies collection
    //OHIF.viewer.Studies.removeAll();

    // @TypeSafeStudies
    // Clears OHIF.viewer.StudyMetadataList collection
    //OHIF.viewer.StudyMetadataList.removeAll();
  }
}

export default ViewerMain;
