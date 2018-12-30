import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Tracker } from 'meteor/tracker';
import { OHIF } from 'meteor/ohif:core';

import 'meteor/ohif:cornerstone';
import 'meteor/ohif:viewerbase';
import 'meteor/ohif:metadata';

const instance = null;

/**
 * Sets sidebar configuration and active tool based on viewer template instance
 * @param  {Object} instance Template instance for viewer template
 */
const setActiveToolAndSidebar = () => {
    const { studies, currentTimepointId, measurementApi, timepointIds } = instance.data;

    // Default actions for Associated Studies
    if (currentTimepointId) {
        // Follow-up studies: same as the first measurement in the table
        // Baseline studies: target-tool
        if (studies[0]) {
            let activeTool;
            // In follow-ups, get the baseline timepointId
            const timepointId = timepointIds.find(id => id !== currentTimepointId);

            // Follow-up studies
            if (studies[0].timepointType === 'followup' && timepointId) {
                const measurementTools = OHIF.measurements.MeasurementApi.getConfiguration().measurementTools;

                // Create list of measurement tools
                const measurementTypes = measurementTools.map(
                    tool => {
                        const { id, cornerstoneToolType } = tool;
                        return {
                            id,
                            cornerstoneToolType
                        };
                    }
                );

                // Iterate over each measurement tool to find the first baseline
                // measurement. If so, stops the loop and prevent fetching from all
                // collections
                measurementTypes.every(({ id, cornerstoneToolType }) => {
                    // Get measurement
                    if (measurementApi[id]) {
                        const measurement = measurementApi[id].findOne({ timepointId });

                        // Found a measurement, save tool and stop loop
                        if (measurement) {
                            const isArray = Array.isArray(cornerstoneToolType);
                            activeTool = isArray ? cornerstoneToolType[0] : cornerstoneToolType;

                            return false;
                        }
                    }

                    return true;
                });
            }

            // If not set, for associated studies default is target-tool
            OHIF.viewerbase.toolManager.setActiveTool(activeTool || 'bidirectional');
        }

        // Toggle Measurement Table
        if (instance.state) {
            instance.state.set('rightSidebar', 'measurements');
        }
    }
    // Hide as default for single study
    else {
        if (instance.state) {
            instance.state.set('rightSidebar', null);
        }
    }
};

/**
 * Inits OHIF Hanging Protocol's onReady.
 * It waits for OHIF Hanging Protocol to be ready to instantiate the ProtocolEngine
 * Hanging Protocol will use OHIF LayoutManager to render viewports properly
 */
const initHangingProtocol = () => {
    // When Hanging Protocol is ready
    HP.ProtocolStore.onReady(() => {

        setActiveToolAndSidebar();

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

        Session.set('ViewerReady', true);

        Session.set('activeViewport', 0);
    });
};

Meteor.startup(() => {
    Session.setDefault('activeViewport', false);
    Session.setDefault('leftSidebar', false);
    Session.setDefault('rightSidebar', false);
    Session.set('TimepointsReady', false);
    Session.set('MeasurementsReady', false);

    OHIF.viewer.displaySeriesQuickSwitch = false;

    OHIF.viewer.defaultTool = 'wwwc';
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
        invert: viewportUtils.invert,
        seed: () => {
            OHIF.viewerbase.toolManager.setActiveTool('seed');
        },
        render3D: viewportUtils.render3D
    };

    OHIF.viewer.stackImagePositionOffsetSynchronizer = new OHIF.viewerbase.StackImagePositionOffsetSynchronizer();

    // Create the synchronizer used to update reference lines
    OHIF.viewer.updateImageSynchronizer = new cornerstoneTools.Synchronizer('CornerstoneNewImage', cornerstoneTools.updateImageSynchronizer);

    OHIF.viewer.metadataProvider = OHIF.cornerstone.metadataProvider;

    // Metadata configuration
    const metadataProvider = OHIF.viewer.metadataProvider;
    cornerstone.metaData.addProvider(metadataProvider.provider.bind(metadataProvider));
});

Template.viewer.onCreated(() => {
    Session.set('ViewerReady', false);

    instance = Template.instance();

    // Define the OHIF.viewer.data global object
    OHIF.viewer.data = OHIF.viewer.data || Session.get('ViewerData') || {};

    const { TimepointApi, MeasurementApi, ConformanceCriteria } = OHIF.measurements;

    const currentTimepointId = OHIF.viewer.data.currentTimepointId;
    const timepointApi = new TimepointApi(currentTimepointId);
    const measurementApi = new MeasurementApi(timepointApi);
    const conformanceCriteria = new ConformanceCriteria(measurementApi, timepointApi);
    const apis = {
        timepointApi,
        measurementApi,
        conformanceCriteria
    };

    Object.assign(OHIF.viewer, apis);
    Object.assign(instance.data, apis);

    instance.state = new ReactiveDict();
    instance.state.set('leftSidebar', Session.get('leftSidebar'));
    instance.state.set('rightSidebar', Session.get('rightSidebar'));

    if (OHIF.viewer.data && OHIF.viewer.data.loadedSeriesData) {
        OHIF.log.info('Reloading previous loadedSeriesData');
        OHIF.viewer.loadedSeriesData = OHIF.viewer.data.loadedSeriesData;
    } else {
        OHIF.log.info('Setting default viewer data');
        OHIF.viewer.loadedSeriesData = {};
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
    // Clears OHIF.viewer.Studies collection
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

    const patientId = instance.data.studies[0].patientId;

    // LT-382: Preventing HP to keep identifying studies in timepoints that might be removed
    instance.data.studies.forEach(study => (delete study.timepointType));

    // TODO: Consider combining the retrieval calls into one?
    const timepointsPromise = timepointApi.retrieveTimepoints({ patientId });
    timepointsPromise.then(() => {
        const timepoints = timepointApi.all();

        //  Set timepointType in studies to be used in hanging protocol engine
        timepoints.forEach(timepoint => {
            timepoint.studyInstanceUids.forEach(studyInstanceUid => {
                const study = _.find(instance.data.studies, element => {
                    return element.studyInstanceUid === studyInstanceUid;
                });
                if (!study) {
                    return;
                }

                // @TODO: Maybe this should be a setCustomAttribute?
                study.timepointType = timepoint.timepointType;
            });
        });

        Session.set('TimepointsReady', true);

        const timepointIds = timepoints.map(t => t.timepointId);

        const measurementsPromise = measurementApi.retrieveMeasurements(patientId, timepointIds);
        measurementsPromise.then(() => {
            Session.set('MeasurementsReady', true);

            measurementApi.syncMeasurementsAndToolData();
        });
    });

    // Provide the necessary data to the Measurement API and Timepoint API
    const prior = timepointApi.prior();
    if (prior) {
        measurementApi.priorTimepointId = prior.timepointId;
    }

    // //  Enable/Disable Lesion Tracker Tools if the opened study is associated or not
     OHIF.viewer.toggleLesionTrackerToolsButtons(!!currentTimepointId);

    let firstMeasurementActivated = false;
    instance.autorun(() => {
        if (!Session.get('TimepointsReady') ||
            !Session.get('MeasurementsReady') ||
            !Session.get('ViewerReady') ||
            firstMeasurementActivated) {
            return;
        }

        // Find and activate the first measurement by Lesion Number
        // NOTE: This is inefficient, we should be using a hanging protocol
        // to hang the first measurement's imageId immediately, rather
        // than changing images after initial loading...
        const config = OHIF.measurements.MeasurementApi.getConfiguration();
        const tools = config.measurementTools[0].childTools;
        const firstTool = tools[Object.keys(tools)[0]];
        const measurementTypeId = firstTool.id;

        const collection = measurementApi.tools[measurementTypeId];
        const sorting = {
            sort: {
                measurementNumber: -1
            }
        };

        const data = collection.find({}, sorting).fetch();

        const current = timepointApi.current();
        if (!current) {
            return;
        }

        let timepoints = [current];
        const prior = timepointApi.prior();
        if (prior) {
            timepoints.push(prior);
        }

        // TODO: Clean this up, it's probably an inefficient way to get what we need
        const groupObject = _.groupBy(data, m => m.measurementNumber);

        // Reformat the data
        const rows = Object.keys(groupObject).map(key => ({
            measurementTypeId: measurementTypeId,
            measurementNumber: key,
            entries: groupObject[key]
        }));

        const rowItem = rows[0];

        // Activate the first lesion
        if (rowItem) {
            OHIF.measurements.jumpToRowItem(rowItem, timepoints);
        }

        firstMeasurementActivated = true;
    });

    instance.measurementModifiedHandler = _.throttle((event, instance) => {
        OHIF.measurements.MeasurementHandlers.onModified(event, instance);
    }, 300);
});

Template.viewer.onRendered(function() {

    this.autorun(function() {
        // To make sure ohif viewerMain is rendered before initializing Hanging Protocols
        const isOHIFViewerMainRendered = Session.get('OHIFViewerMainRendered');

        // To avoid first run
        if (isOHIFViewerMainRendered) {
            // To run only when OHIFViewerMainRendered dependency has changed.
            // because initHangingProtocol can have other reactive components
            Tracker.nonreactive(initHangingProtocol);
        }
    });

});

Template.viewer.events({
    'cornerstonetoolsmeasurementadded .imageViewerViewport'(event, instance) {
        const originalEvent = event.originalEvent;
        OHIF.measurements.MeasurementHandlers.onAdded(originalEvent, instance);
    },

    'cornerstonetoolsmeasurementmodified .imageViewerViewport'(event, instance) {
        const originalEvent = event.originalEvent;
        instance.measurementModifiedHandler(originalEvent, instance);
    },

    'cornerstonemeasurementremoved .imageViewerViewport'(event, instance) {
        const originalEvent = event.originalEvent;
        OHIF.measurements.MeasurementHandlers.onRemoved(originalEvent, instance);
    },

    'click .js-toggle-studies'() {
        const instance = Template.instance();
        const current = instance.state.get('leftSidebar');
        instance.state.set('leftSidebar', !current);
    },

    'click .js-toggle-protocol-editor'() {
        const instance = Template.instance();
        const current = instance.state.get('rightSidebar');
        instance.data.state.set('rightSidebar', !current);
    },
});

Template.viewer.helpers({
    dataSourcesReady() {
        // TODO: Find a better way to do this
        const ready = Session.get('TimepointsReady') && Session.get('MeasurementsReady');
        OHIF.log.info('dataSourcesReady? : ' + ready);
        return ready;
    },

    state() {
        return Template.instance().state;
    }
});

Template.viewer.onDestroyed(() => {
    Session.set('ViewerMainReady', false);
    Session.set('TimepointsReady', false);
    Session.set('MeasurementsReady', false);

    OHIF.viewer.stackImagePositionOffsetSynchronizer.deactivate();
});
