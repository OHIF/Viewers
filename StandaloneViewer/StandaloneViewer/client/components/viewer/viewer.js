import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import { ReactiveDict } from 'meteor/reactive-dict';
import { OHIF } from 'meteor/ohif:core';
import { MeasurementTable } from 'meteor/ohif:measurement-table';

import 'meteor/ohif:viewerbase';
import 'meteor/ohif:metadata';

const viewportUtils = OHIF.viewerbase.viewportUtils;

OHIF.viewer.functionList = {
    toggleCineDialog: viewportUtils.toggleCineDialog,
    toggleCinePlay: viewportUtils.toggleCinePlay,
    clearTools: viewportUtils.clearTools,
    resetViewport: viewportUtils.resetViewport,
    invert: viewportUtils.invert
};

Session.setDefault('activeViewport', false);
Session.setDefault('leftSidebar', false);
Session.setDefault('rightSidebar', false);

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

        // Creates Protocol Engine object with required arguments
        const ProtocolEngine = new HP.ProtocolEngine(layoutManager, studyMetadataList, [], studyMetadataSource);

        // Sets up Hanging Protocol engine
        HP.setEngine(ProtocolEngine);

    });
};

Template.viewer.onCreated(() => {

    OHIF.viewer.measurementTable = new MeasurementTable();

    const instance = Template.instance();

    instance.state = new ReactiveDict();

    instance.state.set('leftSidebar', Session.get('leftSidebar'));
    instance.state.set('rightSidebar', Session.get('rightSidebar'));

    if (OHIF.viewer.data && OHIF.viewer.data.loadedSeriesData) {
        OHIF.log.info('Reloading previous loadedSeriesData');
        OHIF.viewer.loadedSeriesData = OHIF.viewer.data.loadedSeriesData;
    } else {
        OHIF.log.info('Setting default viewer data');
        OHIF.viewer.loadedSeriesData = {};
        OHIF.viewer.data = {};
        OHIF.viewer.data.loadedSeriesData = OHIF.viewer.loadedSeriesData;

        // Update the viewer data object
        OHIF.viewer.data.viewportColumns = 1;
        OHIF.viewer.data.viewportRows = 1;
        OHIF.viewer.data.activeViewport = 0;
    }

    // Store the viewer data in session for further user
    Session.setPersistent('ViewerData', OHIF.viewer.data);

    Session.set('activeViewport', OHIF.viewer.data.activeViewport || 0);

    // @TypeSafeStudies
    // Update the OHIF.viewer.Studies collection with the loaded studies
    OHIF.viewer.Studies.removeAll();

    // @TypeSafeStudies
    // Clears OHIF.viewer.StudyMetadataList collection
    OHIF.viewer.StudyMetadataList.removeAll();

    OHIF.viewer.data.studyInstanceUids = [];
    instance.data.studies.forEach(study => {
        const studyMetadata = new OHIF.metadata.StudyMetadata(study, study.studyInstanceUid);
        let displaySets = study.displaySets;

        if(!study.displaySets) {
            displaySets = OHIF.viewerbase.sortingManager.getDisplaySets(studyMetadata);
            study.displaySets = displaySets;
        }

        studyMetadata.setDisplaySets(displaySets);

        study.selected = true;
        OHIF.viewer.Studies.insert(study);
        OHIF.viewer.StudyMetadataList.insert(studyMetadata);
        OHIF.viewer.data.studyInstanceUids.push(study.studyInstanceUid);
    });

    // Call Viewer plugins onCreated functions
    if(typeof OHIF.viewer.measurementTable.onCreated === 'function') {
        OHIF.viewer.measurementTable.onCreated(instance);
    }
});

Template.viewer.onRendered(function() {
    const instance = Template.instance();
    this.autorun(function() {
        // To make sure ohif viewerMain is rendered before initializing Hanging Protocols
        const isOHIFViewerMainRendered = Session.get('OHIFViewerMainRendered');

        // To avoid first run
        if (isOHIFViewerMainRendered) {
            // To run only when ViewerMainRendered dependency has changed.
            // because initHangingProtocol can have other reactive components
            Tracker.nonreactive(initHangingProtocol);
        }
    });

    // Call Viewer plugins onRendered functions
    if(typeof OHIF.viewer.measurementTable.onRendered === 'function') {
        OHIF.viewer.measurementTable.onRendered(instance);
    }
});

Template.viewer.events( Object.assign({
    // Viewer Events
    },
    MeasurementTable.measurementEvents
));

Template.viewer.helpers({
    state() {
        return Template.instance().state;
    }
});
