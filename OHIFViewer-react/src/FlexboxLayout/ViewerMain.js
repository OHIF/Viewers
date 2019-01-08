import { Component } from 'react';
import React from 'react';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import cornerstoneMath from "cornerstone-math";
import { OHIF } from 'ohif-core';
import ConnectedCornerstoneViewport from './ConnectedCornerstoneViewport.js';
import ConnectedLayoutManager from './ConnectedLayoutManager.js';
import './ViewerMain.css';

// Attempt to fix weird undefined dep issue
cornerstoneTools.external.cornerstoneMath = cornerstoneMath;

const { StudyLoadingListener, StudyPrefetcher } = OHIF.classes;
const { StackManager } = OHIF.utils;

function getCornerstoneStack(studies, viewportData) {
    const {
        displaySetInstanceUid,
        studyInstanceUid,
    } = viewportData;

    // Create shortcut to displaySet
    const study = studies.find(study => study.studyInstanceUid === studyInstanceUid);

    const displaySet = study.displaySets.find((set) => {
        return set.displaySetInstanceUid === displaySetInstanceUid;
    });

    // Get stack from Stack Manager
    return StackManager.findOrCreateStack(study, displaySet);
}

class ViewerMain extends Component {
    state = {
        displaySets: [],
        viewportData: [],
    };

    componentDidMount() {
        // Add beforeUnload event handler to check for unsaved changes
        //window.addEventListener('beforeunload', unloadHandlers.beforeUnload);

        const { studies } = this.props;
        this.studyPrefetcher = StudyPrefetcher.getInstance(cornerstone, cornerstoneTools);
        this.studyPrefetcher.setStudies(studies);
        this.studyLoadingListener = StudyLoadingListener.getInstance(cornerstone);
        this.studyLoadingListener.clear();
        this.studyLoadingListener.addStudies(studies);

        // Get all the display sets for the viewer studies
        const displaySets = [];
        studies.forEach((study) => {
            study.displaySets.forEach(dSet => dSet.images.length && displaySets.push(dSet));
        });

        // TODO: re-add plugins back in
        // TODO: We shouldn't just hang display sets by default
        const viewportData = displaySets.map((dSet, index) => {
            return this.getCornerstoneViewport(dSet, index);
        });

        this.setState({
            displaySets,
            viewportData
        });
    }

    getCornerstoneViewport = (data, index) => {
        // Clone the stack here so we don't mutate it later
        const stack = Object.assign({}, getCornerstoneStack(this.props.studies, data));
        stack.currentImageIdIndex = 0;
        const viewportData = {
            stack,
            ...data,
            viewportIndex: index
        };

        return (<ConnectedCornerstoneViewport
            key={index}
            viewportData={viewportData}
            cornerstone={cornerstone}
            cornerstoneTools={cornerstoneTools}
        />);
    }

    setViewportData = ({viewportIndex, item}) => {
        // TODO: Replace this with mapDispatchToProps call
        // if we decide to put viewport info into redux

        // Note: Use Slice because React does a shallow equality check. Mutating the array
        // would not trigger a re-render. We have to create a copy.
        const updatedViewportData = this.state.viewportData.slice(0);
        const data = {
            studyInstanceUid: item.studyInstanceUid,
            displaySetInstanceUid: item.displaySetInstanceUid
        };

        updatedViewportData[viewportIndex] = this.getCornerstoneViewport(data, viewportIndex);

        this.setState({
            viewportData: updatedViewportData
        });
    }

    render() {
        return (
            <div className="ViewerMain">
                <ConnectedLayoutManager viewportData={this.state.viewportData} setViewportData={this.setViewportData}/>
            </div>
        );
    }

    componentWillUnmount() {
        // Remove beforeUnload event handler...
        //window.removeEventListener('beforeunload', unloadHandlers.beforeUnload);

        // Destroy the synchronizer used to update reference lines
        OHIF.viewer.updateImageSynchronizer.destroy();

        // Stop prefetching when we close the viewer
        this.studyPrefetcher.destroy();

        // Destroy stack loading listeners when we close the viewer
        this.studyLoadingListener.clear();

        // Clear references to all stacks in the StackManager
        StackManager.clearStacks();

        // @TypeSafeStudies
        // Clears OHIF.viewer.Studies collection
        //OHIF.viewer.Studies.removeAll();

        // @TypeSafeStudies
        // Clears OHIF.viewer.StudyMetadataList collection
        //OHIF.viewer.StudyMetadataList.removeAll();
    }
}

ViewerMain.propTypes = {
    studies: PropTypes.array.isRequired
};

export default ViewerMain;
