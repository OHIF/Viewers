import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { OHIF } from 'meteor/ohif:core';

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
        clearTools: clearTools,
        bidirectional: () => {
            // Used for hotkeys
            toolManager.setActiveTool('bidirectional');
        },
        nonTarget: () => {
            // Used for hotkeys
            toolManager.setActiveTool('nonTarget');
        }
    });

    // The hotkey can also be an array (e.g. ["NUMPAD0", "0"])
    OHIF.viewer.defaultHotkeys = OHIF.viewer.defaultHotkeys || {};
    OHIF.viewer.defaultHotkeys.toggleLesionTrackerTools = 'O';
    OHIF.viewer.defaultHotkeys.bidirectional = 'T'; // Target
    OHIF.viewer.defaultHotkeys.nonTarget = 'N'; // Non-target

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

    if (instance.data.currentTimepointId) {
        instance.data.timepointApi = new OHIF.measurements.TimepointApi(instance.data.currentTimepointId);
        const timepointsPromise = instance.data.timepointApi.retrieveTimepoints();
        timepointsPromise.then(() => {
            Session.set('TimepointsReady', true);
        });

        instance.data.measurementApi = new OHIF.measurements.MeasurementApi(instance.data.currentTimepointId);
        const measurementsPromise = instance.data.measurementApi.retrieveMeasurements();
        measurementsPromise.then(() => {
            Session.set('MeasurementsReady', true);

            instance.data.measurementApi.syncMeasurementsAndToolData();
        });

        // Provide the necessary data to the Measurement API and Timepoint API
        const prior = instance.data.timepointApi.prior();
        if (prior) {
            instance.data.measurementApi.priorTimepointId = prior.timepointId;
        }
    } else {
        console.warn('No current timepoint specified');
        instance.data.measurementApi = new OHIF.measurements.MeasurementApi();
    }
});

Template.viewer.helpers({
    dataSourcesReady() {
        // TODO: Find a better way to do this
        return Session.get('TimepointsReady') && Session.get('MeasurementsReady');
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
    },
    CornerstoneToolsMouseClick(event, instance, data) {
        const element = instance.$('.imageViewerViewport')[0];

        const toolState = cornerstoneTools.getToolState(element, 'bidirectional');

        // Stop here if no tool state was found
        if (!toolState) {
            return;
        }

        const selectLabelCallback = (options, value, description) => {
            console.warn('>>>>options, value, description', options, value, description);
        };

        setTimeout(() => {
            for (let i = 0; i < toolState.data.length; i++) {
                const toolData = toolState.data[i];
                if (toolData.active) {
                    OHIF.measurements.toggleLabelButton({
                        instance,
                        toolData,
                        element,
                        measurementApi: instance.data.measurementApi,
                        position: data.currentPoints.page,
                        callback: selectLabelCallback
                    });
                    break;
                }
            }
        });
    }
});
