import { Component } from 'react';
import React from 'react';
import PropTypes from 'prop-types';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import { OHIF } from 'ohif-core';
import ConnectedCornerstoneViewport from './ConnectedCornerstoneViewport.js';
import ConnectedLayoutManager from './ConnectedLayoutManager.js';
import StackManager from '../lib/StackManager.js';
import './ViewerMain.css';

//const { StudyLoadingListener, StudyPrefetcher, ResizeViewportManager } = OHIF.classes;


//window.ResizeViewportManager = window.ResizeViewportManager || new ResizeViewportManager();

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
    const stack = StackManager.findOrCreateStack(study, displaySet);
    stack.currentImageIdIndex = 0;

    return stack;
}

class ViewerMain extends Component {
    constructor(props) {
        super(props);

        this.state = {
            displaySets: [],
            viewportData: [],
        };

        this.getCornerstoneViewport = this.getCornerstoneViewport.bind(this);
    }

    componentDidMount() {
        // Attach the Window resize listener
        // Don't use jQuery here. "window.onresize" will always be null
        // If its necessary, check all the code for window.onresize getter
        // and change it to jQuery._data(window, 'events')['resize'].
        // Otherwise this function will be probably overrided.
        // See cineDialog instance.setResizeHandler function
        //window.addEventListener('resize', window.ResizeViewportManager.getResizeHandler());

        // Add beforeUnload event handler to check for unsaved changes
        //window.addEventListener('beforeunload', unloadHandlers.beforeUnload);

        const { studies } = this.props;
        //this.studyPrefetcher = StudyPrefetcher.getInstance();
        //this.studyPrefetcher.setStudies(studies);
        //this.studyLoadingListener = StudyLoadingListener.getInstance();
        //this.studyLoadingListener.clear();
        //this.studyLoadingListener.addStudies(studies);

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

    getCornerstoneViewport(data, index) {
        const stack = getCornerstoneStack(this.props.studies, data)
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
    };

    setViewportData = ({viewportIndex, item}) => {
        // TODO: Replace this with mapDispatchToProps call
        // if we decide to put viewport info into redux

        const updatedViewportData = this.state.viewportData;
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
        // TODO: Connect LayoutManager to redux
        return (
            <div className="ViewerMain">
                <ConnectedLayoutManager viewportData={this.state.viewportData} setViewportData={this.setViewportData}/>
            </div>
        );
    }

    componentWillUnmount() {
        // Remove the Window resize listener
        //window.removeEventListener('resize', window.ResizeViewportManager.getResizeHandler());

        // Remove beforeUnload event handler...
        //window.removeEventListener('beforeunload', unloadHandlers.beforeUnload);

        // Destroy the synchronizer used to update reference lines
        OHIF.viewer.updateImageSynchronizer.destroy();

        // Stop prefetching when we close the viewer
        //this.studyPrefetcher.destroy();

        // Destroy stack loading listeners when we close the viewer
        //this.studyLoadingListener.clear();

        // Clear references to all stacks in the StackManager
        //OHIF.viewerbase.stackManager.clearStacks();

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
