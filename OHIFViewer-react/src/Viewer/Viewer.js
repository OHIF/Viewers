import React, { Component } from "react";
import PropTypes from "prop-types";
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import OHIF from 'ohif-core';
import { CineDialog } from 'react-viewerbase';

import Header from '../Header'
import FlexboxLayout from '../FlexboxLayout/FlexboxLayout.js';
import './Viewer.css';

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

        // Caches Layout Manager: Hanging Protocol uses it for layout management according to current protocol
        const layoutManager = OHIF.viewerbase.layoutManager;

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
OHIF.viewer.cine = {
    framesPerSecond: 24,
    loop: true
};

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

OHIF.viewer.metadataProvider = new OHIF.cornerstone.MetadataProvider();

// Metadata configuration
const metadataProvider = OHIF.viewer.metadataProvider;
cornerstone.metaData.addProvider(metadataProvider.provider.bind(metadataProvider));

class Viewer extends Component {
    constructor(props) {
        super(props);

        this.state = {
            leftSidebar: 'studies',
            rightSidebar: 'measurements',
            studies: this.props.studies
        };
    }

    render() {
        return (<>
            <Header />
            <div className='viewerDialogs'>
                {/*<CineDialog/>*/}
            </div>
            <div id="viewer" className='Viewer'>
                {/*<ToolbarSection/>*/}
                <FlexboxLayout studies={this.state.studies} />
            </div>
        </>
        );
    }
}

Viewer.propTypes = {
    studies: PropTypes.array
};

export default Viewer;
