import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { ReactiveDict } from 'meteor/reactive-dict';
import { OHIF } from 'meteor/ohif:core';
import { _ } from 'meteor/underscore';

Session.set('ViewerMainReady', false);
Session.set('TimepointsReady', false);
Session.set('MeasurementsReady', false);

Template.viewer.onCreated(() => {
    ViewerData = window.ViewerData || ViewerData;

    const instance = Template.instance();

    ValidationErrors.remove({});

    instance.data.state = new ReactiveDict();
    instance.data.state.set('leftSidebar', Session.get('leftSidebar'));
    instance.data.state.set('rightSidebar', Session.get('rightSidebar'));

    const contentId = instance.data.contentId;

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
        toggleCineDialog,
        clearTools,
        resetViewport,
        invert,
        flipV,
        flipH,
        rotateL,
        rotateR,
        link
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

    // Update the ViewerStudies collection with the loaded studies
    ViewerStudies.remove({});

    instance.data.studies.forEach(study => {
        study.selected = true;
        study.displaySets = createStacks(study);
        ViewerStudies.insert(study);
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
});
