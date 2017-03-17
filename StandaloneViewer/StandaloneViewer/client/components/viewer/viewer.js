import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import { ReactiveDict } from 'meteor/reactive-dict';
import { OHIF } from 'meteor/ohif:core';
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
        const studyMetadataSource = new OHIF.studylist.classes.OHIFStudyMetadataSource();

        // Creates Protocol Engine object with required arguments
        const ProtocolEngine = new HP.ProtocolEngine(layoutManager, studyMetadataList, [], studyMetadataSource);

        // Sets up Hanging Protocol engine
        HP.setEngine(ProtocolEngine);

    });
};

Template.viewer.onCreated(() => {
    const instance = Template.instance();

    instance.data.state = new ReactiveDict();
    instance.data.state.set('leftSidebar', Session.get('leftSidebar'));
    instance.data.state.set('rightSidebar', Session.get('rightSidebar'));

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

    Session.set('activeViewport', OHIF.viewer.data.activeViewport || 0);

    // @TypeSafeStudies
    // Update the OHIF.viewer.Studies collection with the loaded studies
    OHIF.viewer.Studies.removeAll();

    OHIF.viewer.data.studyInstanceUids = [];
    instance.data.studies.forEach(study => {
        study.selected = true;
        const studyMetadata = new OHIF.metadata.StudyMetadata(study);
        study.displaySets = OHIF.viewerbase.sortingManager.getDisplaySets(studyMetadata);
        OHIF.viewer.Studies.insert(study);
        OHIF.viewer.data.studyInstanceUids.push(study.studyInstanceUid);
    });
});

Template.viewer.onRendered(function() {

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

});

Template.viewer.events({
    'click .js-toggle-studies'() {
        const instance = Template.instance();
        const current = instance.data.state.get('leftSidebar');
        instance.data.state.set('leftSidebar', !current);
    }
});
