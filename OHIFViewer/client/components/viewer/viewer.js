import React, { Component } from "react";
import PropTypes from "prop-types";

import { OHIF } from 'meteor/ohif:core';
import { MeasurementTable } from 'meteor/ohif:measurement-table';

import { CineDialog } from 'react-viewerbase';
import FlexboxLayout from '../flexboxLayout/flexboxLayout.js';

import 'meteor/ohif:cornerstone';
import 'meteor/ohif:viewerbase';


/**
 * Inits OHIF Hanging Protocol's onReady.
 * It waits for OHIF Hanging Protocol to be ready to instantiate the ProtocolEngine
 * Hanging Protocol will use OHIF LayoutManager to render viewports properly
 */
const initHangingProtocol = () => {
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
};


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

const viewportUtils = OHIF.viewerbase.viewportUtils;

OHIF.viewer.functionList = {
    toggleCineDialog: viewportUtils.toggleCineDialog,
    toggleCinePlay: viewportUtils.toggleCinePlay,
    clearTools: viewportUtils.clearTools,
    resetViewport: viewportUtils.resetViewport,
    invert: viewportUtils.invert
};

// Create the synchronizer used to update reference lines
OHIF.viewer.updateImageSynchronizer = new cornerstoneTools.Synchronizer('cornerstonenewimage', cornerstoneTools.updateImageSynchronizer);

OHIF.viewer.metadataProvider = new OHIF.cornerstone.MetadataProvider();

// Metadata configuration
const metadataProvider = OHIF.viewer.metadataProvider;
cornerstone.metaData.addProvider(metadataProvider.provider.bind(metadataProvider));

// Instantiate viewer plugins
OHIF.viewer.measurementTable = new MeasurementTable();

class Viewer extends Component {
    constructor(props) {
        super(props);

        // Define the OHIF.viewer.data global object
        OHIF.viewer.data = OHIF.viewer.data || {};

        // @TypeSafeStudies
        // Clears OHIF.viewer.Studies collection
        OHIF.viewer.Studies.removeAll();

        // @TypeSafeStudies
        // Clears OHIF.viewer.StudyMetadataList collection
        OHIF.viewer.StudyMetadataList.removeAll();

        OHIF.viewer.data.studyInstanceUids = [];

        const studies = this.props.studies;
        studies.forEach(study => {
            const studyMetadata = new OHIF.metadata.StudyMetadata(study, study.studyInstanceUid);
            let displaySets = study.displaySets;

            if (!study.displaySets) {
                displaySets = OHIF.viewerbase.sortingManager.getDisplaySets(studyMetadata);
                study.displaySets = displaySets;
            }

            studyMetadata.setDisplaySets(displaySets);

            study.selected = true;
            OHIF.viewer.Studies.insert(study);
            OHIF.viewer.StudyMetadataList.insert(studyMetadata);
            OHIF.viewer.data.studyInstanceUids.push(study.studyInstanceUid);

            // Updates WADO-RS metaDataManager
            OHIF.viewerbase.updateMetaDataManager(study);
        });

        this.state = {
            leftSidebar: 'studies',
            rightSidebar: 'measurements',
            studies
        };
    }

    render() {
        return (<>
                <div className='viewerDialogs'>
                    <CineDialog/>
                </div>
                <div id="viewer" className='Viewer'>
                    {/*<ToolbarSection/>*/}
                    <FlexboxLayout studies={this.state.studies}/>
                </div>
            </>
        );
    }
}

Viewer.propTypes = {
    studies: PropTypes.array
};

export default Viewer;
