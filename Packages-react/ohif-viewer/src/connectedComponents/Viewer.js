import React, { Component } from "react";
import PropTypes from "prop-types";
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import OHIF from 'ohif-core';
//import { CineDialog } from 'react-viewerbase';

import Header from '../components/Header'
import ConnectedFlexboxLayout from './ConnectedFlexboxLayout.js';
import ConnectedToolbarRow from "./ConnectedToolbarRow";
import ConnectedStudyLoadingMonitor from './ConnectedStudyLoadingMonitor.js';
import StudyPrefetcher from '../components/StudyPrefetcher.js';
import './Viewer.css';

const { StackManager } = OHIF.utils;

/**
 * Inits OHIF Hanging Protocol's onReady.
 * It waits for OHIF Hanging Protocol to be ready to instantiate the ProtocolEngine
 * Hanging Protocol will use OHIF LayoutManager to render viewports properly
 */
/*const initHangingProtocol = () => {
    // When Hanging Protocol is ready
    HP.ProtocolStore.onReady(() => {

        // Gets all StudyMetadata objects: necessary for Hanging Protocol to access study metadata
        const studyMetadataList = OHIF.viewer.StudyMetadataList.all();

        // Instantiate StudyMetadataSource: necessary for Hanging Protocol to get study metadata
        const studyMetadataSource = new OHIF.studies.classes.OHIFStudyMetadataSource();

        // Get prior studies map
        const studyPriorsMap = OHIF.studylist.functions.getStudyPriorsMap(studyMetadataList);

        // Creates Protocol Engine object with required arguments
        const ProtocolEngine = new HP.ProtocolEngine(layoutManager, studyMetadataList, studyPriorsMap, studyMetadataSource);

        // Sets up Hanging Protocol engine
        HP.setEngine(ProtocolEngine);
    });
};*/


OHIF.viewer.defaultTool = {
    left: 'wwwc',
    right: 'zoom',
    middle: 'pan'
};

OHIF.viewer.refLinesEnabled = true;

/*const viewportUtils = OHIF.viewerbase.viewportUtils;

OHIF.viewer.functionList = {
    toggleCineDialog: viewportUtils.toggleCineDialog,
    toggleCinePlay: viewportUtils.toggleCinePlay,
    clearTools: viewportUtils.clearTools,
    resetViewport: viewportUtils.resetViewport,
    invert: viewportUtils.invert
};*/

// Create the synchronizer used to update reference lines
OHIF.viewer.updateImageSynchronizer = new cornerstoneTools.Synchronizer('cornerstonenewimage', cornerstoneTools.updateImageSynchronizer);

// Metadata configuration
const metadataProvider = new OHIF.cornerstone.MetadataProvider();
cornerstone.metaData.addProvider(metadataProvider.provider.bind(metadataProvider));

StackManager.setMetadataProvider(metadataProvider);

class Viewer extends Component {
    static propTypes = {
        studies: PropTypes.array,
    };

    render() {
        return (<>
            <Header home={false}/>
            <div className='viewerDialogs'>
                {/*<CineDialog/>*/}
            </div>
            <div id="viewer" className='Viewer'>
                <ConnectedToolbarRow />
                <ConnectedStudyLoadingMonitor studies={this.props.studies} />
                <StudyPrefetcher studies={this.props.studies} />
                <ConnectedFlexboxLayout studies={this.props.studies} />
            </div>
        </>
        );
    }
}


export default Viewer;
