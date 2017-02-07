import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { ReactiveDict } from 'meteor/reactive-dict';
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';

import { OHIF } from 'meteor/ohif:core';
import 'meteor/ohif:cornerstone';
import 'meteor/ohif:viewerbase';
import 'meteor/ohif:metadata';

Meteor.startup(() => {
    Session.set('ViewerMainReady', false);
    Session.set('TimepointsReady', false);
    Session.set('MeasurementsReady', false);

    OHIF.viewer.stackImagePositionOffsetSynchronizer = new OHIF.viewerbase.StackImagePositionOffsetSynchronizer();

    // Create the synchronizer used to update reference lines
    OHIF.viewer.updateImageSynchronizer = new cornerstoneTools.Synchronizer('CornerstoneNewImage', cornerstoneTools.updateImageSynchronizer);

    OHIF.viewer.metadataProvider = OHIF.cornerstone.metadataProvider;

    // Metadata configuration
    const metadataProvider = OHIF.viewer.metadataProvider;
    cornerstoneTools.metaData.addProvider(metadataProvider.provider.bind(metadataProvider));
});

Template.viewer.onCreated(() => {
    const toolManager = OHIF.viewerbase.toolManager;
    ViewerData = window.ViewerData || ViewerData;

    const instance = Template.instance();

    ValidationErrors.remove({});

    instance.data.state = new ReactiveDict();
    instance.data.state.set('leftSidebar', Session.get('leftSidebar'));
    instance.data.state.set('rightSidebar', Session.get('rightSidebar'));

    const contentId = instance.data.contentId;
    const viewportUtils = OHIF.viewerbase.viewportUtils;

    OHIF.viewer.functionList = $.extend(OHIF.viewer.functionList, {
        toggleLesionTrackerTools: OHIF.lesiontracker.toggleLesionTrackerTools,
        bidirectional: () => {
            // Used for hotkeys
            toolManager.setActiveTool('bidirectional');
        },
        nonTarget: () => {
            // Used for hotkeys
            toolManager.setActiveTool('nonTarget');
        },
        // Viewport functions
        toggleCineDialog: viewportUtils.toggleCineDialog,
        clearTools: viewportUtils.clearTools,
        resetViewport: viewportUtils.resetViewport,
        invert: viewportUtils.invert,
        flipV: viewportUtils.flipV,
        flipH: viewportUtils.flipH,
        rotateL: viewportUtils.rotateL,
        rotateR: viewportUtils.rotateR,
        linkStackScroll: viewportUtils.linkStackScroll
    });

    if (ViewerData[contentId].loadedSeriesData) {
        OHIF.log.info('Reloading previous loadedSeriesData');
        OHIF.viewer.loadedSeriesData = ViewerData[contentId].loadedSeriesData;

    } else {
        OHIF.log.info('Setting default ViewerData');
        OHIF.viewer.loadedSeriesData = {};
        ViewerData[contentId].loadedSeriesData = {};
        Session.set('ViewerData', ViewerData);
    }

    Session.set('activeViewport', ViewerData[contentId].activeViewport || false);

    // Set lesion tool buttons as disabled if pixel spacing is not available for active element
    instance.autorun(OHIF.lesiontracker.pixelSpacingAutorunCheck);

    // @TypeSafeStudies
    // Update the OHIF.viewer.Studies collection with the loaded studies
    OHIF.viewer.Studies.removeAll();

    instance.data.studies.forEach(study => {
        study.selected = true;
        OHIF.viewer.Studies.insert(study);
    });

    instance.data.timepointApi = new OHIF.measurements.TimepointApi(instance.data.currentTimepointId);

    // TODO: Find a better way to pass this to the ViewportOverlay
    OHIF.viewer.timepointApi = instance.data.timepointApi;

    const patientId = instance.data.studies[0].patientId;

    // LT-382: Preventing HP to keep identifying studies in timepoints that might be removed
    instance.data.studies.forEach(study => (delete study.timepointType));

    // TODO: Consider combining the retrieval calls into one?
    const timepointsPromise = instance.data.timepointApi.retrieveTimepoints(patientId);
    timepointsPromise.then(() => {
        const timepoints = instance.data.timepointApi.all();

        //  Set timepointType in studies to be used in hanging protocol engine
        timepoints.forEach(timepoint => {
            timepoint.studyInstanceUids.forEach(studyInstanceUid => {
                const study = _.find(instance.data.studies, element => {
                    return element.studyInstanceUid === studyInstanceUid;
                });
                if (!study) {
                    return;
                }

                study.timepointType = timepoint.timepointType;
            });
        });

        Session.set('TimepointsReady', true);

        const timepointIds = timepoints.map(t => t.timepointId);
        instance.data.measurementApi = new OHIF.measurements.MeasurementApi(instance.data.timepointApi);
        instance.data.conformanceCriteria = new OHIF.measurements.ConformanceCriteria(instance.data.measurementApi, instance.data.timepointApi);

        const measurementsPromise = instance.data.measurementApi.retrieveMeasurements(patientId, timepointIds);
        measurementsPromise.then(() => {
            Session.set('MeasurementsReady', true);

            instance.data.measurementApi.syncMeasurementsAndToolData();
        });
    });

    // Provide the necessary data to the Measurement API and Timepoint API
    const prior = instance.data.timepointApi.prior();
    if (prior) {
        instance.data.measurementApi.priorTimepointId = prior.timepointId;
    }

    if (instance.data.currentTimepointId) {
        //  Enable Lesion Tracker Tools if the opened study is associated
        OHIF.lesiontracker.toggleLesionTrackerToolsButtons(true);
    } else {
        //  Disable Lesion Tracker Tools if the opened study is not associated
        OHIF.lesiontracker.toggleLesionTrackerToolsButtons(false);
    }

    let firstMeasurementActivated = false;
    instance.autorun(() => {
        if (!Session.get('TimepointsReady') ||
            !Session.get('MeasurementsReady') ||
            !Session.get('ViewerMainReady') ||
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
        const measurementApi = instance.data.measurementApi;
        const timepointApi = instance.data.timepointApi;

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
});

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
        const studyMetadataSource = new NucleusStudyMetadataSource();

        // Creates Protocol Engine object with required arguments
        const ProtocolEngine = new HP.ProtocolEngine(layoutManager, studyMetadataList, [], studyMetadataSource);

        // Sets up Hanging Protocol engine
        HP.setEngine(ProtocolEngine);
    });
};

/**
 * Sets sidebar configuration and active tool based on viewer template instance
 * @param  {Object} instance Template instance for viewer template
 */
const setActiveToolAndSidebar = instance => {
    const { studies, currentTimepointId, measurementApi, timepointIds } = instance.data;

    // Default actions for Associated Studies
    if(currentTimepointId) {
        // Follow-up studies: same as the first measurement in the table
        // Baseline studies: target-tool
        if(studies[0]) {
            let activeTool;
            // In follow-ups, get the baseline timepointId
            const timepointId = timepointIds.find(id => id !== currentTimepointId);

            // Follow-up studies
            if(studies[0].timepointType === 'followup' && timepointId) {
                const measurementTools = OHIF.measurements.MeasurementApi.getConfiguration().measurementTools;

                // Create list of measurement tools
                const measurementTypes = measurementTools.map( 
                    tool => {
                        const { id, cornerstoneToolType } = tool;
                        return {
                            id,
                            cornerstoneToolType
                        }
                    }
                );

                // Iterate over each measurement tool to find the first baseline
                // measurement. If so, stops the loop and prevent fetching from all
                // collections
                measurementTypes.every(({id, cornerstoneToolType}) => {
                    // Get measurement
                    if(measurementApi[id]) {
                        const measurement = measurementApi[id].findOne({ timepointId });

                        // Found a measurement, save tool and stop loop
                        if(measurement) {
                            activeTool = cornerstoneToolType;

                            return false;
                        }
                    }
                    return true;
                });
            }

            // If not set, for associated studies default is target-tool
            toolManager.setActiveTool(activeTool || 'bidirectional');
        }

        // Toggle Measurement Table 
        if(instance.data.state) {
            instance.data.state.set('rightSidebar', 'measurements');
        }
    }
    // Hide as default for single study
    else {
        if(instance.data.state) {
            instance.data.state.set('rightSidebar', null);
        }
    }
};

Template.viewer.onRendered(() => {
    HP.ProtocolStore.onReady(() => {
        const instance = Template.instance();
        
        setActiveToolAndSidebar(instance);

        // updateViewports method from current layout manager will be automatically called by the protocol engine;
        const studyMetadataList = OHIF.viewer.StudyMetadataList.all();
        const layoutManager = OHIF.viewerbase.layoutManager;
        
        const studyMetadataSource = new OHIFStudyMetadataSource;
        ProtocolEngine = new HP.ProtocolEngine(layoutManager, studyMetadataList, [], studyMetadataSource);
        HP.setEngine(ProtocolEngine);
    });

    this.autorun(() => {
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

Template.viewer.helpers({
    dataSourcesReady() {
        // TODO: Find a better way to do this
        const ready = Session.get('TimepointsReady') && Session.get('MeasurementsReady');
        OHIF.log.info('dataSourcesReady? : ' + ready);
        return ready;
    }
});

Template.viewer.events({
    'CornerstoneToolsMeasurementAdded .imageViewerViewport'(event, instance, eventData) {
        OHIF.measurements.MeasurementHandlers.onAdded(event, instance, eventData);
    },

    'CornerstoneToolsMeasurementModified .imageViewerViewport'(event, instance, eventData) {
        OHIF.measurements.MeasurementHandlers.onModified(event, instance, eventData);
    },

    'CornerstoneToolsMeasurementRemoved .imageViewerViewport'(event, instance, eventData) {
        OHIF.measurements.MeasurementHandlers.onRemoved(event, instance, eventData);
    }
});

Template.viewer.onDestroyed(() => {
    Session.set('ViewerMainReady', false);
    Session.set('TimepointsReady', false);
    Session.set('MeasurementsReady', false);

    OHIF.viewer.stackImagePositionOffsetSynchronizer.deactivate();
});
