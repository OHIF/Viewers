import { OHIF } from 'meteor/ohif:core';
import { TimepointApi } from 'meteor/lesiontracker/client/api/timepoint';
import { MeasurementApi } from 'meteor/lesiontracker/client/api/measurement';

OHIF.viewer = OHIF.viewer || {};
OHIF.viewer.loadIndicatorDelay = 3000;
OHIF.viewer.defaultTool = 'wwwc';
OHIF.viewer.refLinesEnabled = true;
OHIF.viewer.isPlaying = {};
OHIF.viewer.cine = {
    framesPerSecond: 24,
    loop: true
};

Session.setDefault('activeViewport', false);
Session.setDefault('leftSidebar', null);
Session.setDefault('rightSidebar', null);

Template.viewer.onCreated(() => {
    const instance = Template.instance();

    ValidationErrors.remove({});

    instance.data.state = new ReactiveDict();
    instance.data.state.set('leftSidebar', Session.get('leftSidebar'));
    instance.data.state.set('rightSidebar', Session.get('rightSidebar'));

    instance.subscribe('hangingprotocols');
    
    Session.set('currentTimepointId', instance.data.currentTimepointId);

    const contentId = instance.data.contentId;

    OHIF.viewer.functionList = $.extend(OHIF.viewer.functionList, {
        toggleLesionTrackerTools: toggleLesionTrackerTools,
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
        log.info('Reloading previous loadedSeriesData');
        OHIF.viewer.loadedSeriesData = ViewerData[contentId].loadedSeriesData;

    } else {
        log.info('Setting default ViewerData');
        OHIF.viewer.loadedSeriesData = {};
        ViewerData[contentId].loadedSeriesData = {};
        Session.set('ViewerData', ViewerData);
    }

    Session.set('activeViewport', ViewerData[contentId].activeViewport || false);

    // Set lesion tool buttons as disabled if pixel spacing is not available for active element
    instance.autorun(pixelSpacingAutorunCheck);

    // Update the ViewerStudies collection with the loaded studies
    ViewerStudies.remove({});

    instance.data.studies.forEach(study => {
        study.selected = true;
        study.displaySets = createStacks(study);
        ViewerStudies.insert(study);
    });

    const patientId = instance.data.studies[0].patientId;
    Session.set('patientId', patientId);

    instance.autorun(() => {
        const dataContext = Template.currentData();
        instance.subscribe('singlePatientAssociatedStudies', dataContext.studies[0].patientId);
        instance.subscribe('singlePatientTimepoints', dataContext.studies[0].patientId);
        instance.subscribe('singlePatientMeasurements', dataContext.studies[0].patientId);
        instance.subscribe('singlePatientImageMeasurements', dataContext.studies[0].patientId);
        instance.subscribe('singlePatientAdditionalFindings', dataContext.studies[0].patientId);
        
        if (instance.subscriptionsReady()) {
            // Set buttons as enabled/disabled when Timepoints collection is ready
            timepointAutoCheck(dataContext);

            // Wait until the Timepoint subscription is ready to initialize the TimepointApi
            instance.data.timepointApi = new TimepointApi();
            instance.data.timepointApi.currentTimepointId = instance.data.currentTimepointId;

            // Provide the necessary data to the Measurement API
            MeasurementApi.currentTimepointId = instance.data.currentTimepointId;
            const prior = instance.data.timepointApi.prior();
            if (prior) {
                MeasurementApi.priorTimepointId = prior.timepointId;
            }

            TrialResponseCriteria.validateAllDelayed();

            ViewerStudies.find().observe({
                added: study => {
                    // Find the relevant timepoint given the newly added study
                    const timepoint = Timepoints.findOne({
                        studyInstanceUids: {
                            $in: [study.studyInstanceUid]
                        }
                    });

                    if (!timepoint) {
                        log.warn('Study added to Viewer has not been associated!');
                        return;
                    }

                    // Update the added document with its related timepointId
                    ViewerStudies.update(study._id, {
                        $set: {
                            timepointId: timepoint.timepointId
                        }
                    });
                }
            });

            ImageMeasurements.find().observe({
                added: data => {
                    if (data.clientId === ClientId) {
                        return;
                    }

                    syncImageMeasurementAndToolData(data);

                    // Update each displayed viewport
                    updateAllViewports();
                },
                changed: data => {
                    if (data.clientId === ClientId) {
                        return;
                    }

                    syncImageMeasurementAndToolData(data);

                    // Update each displayed viewport
                    updateAllViewports();
                },
                removed: data => {
                    if (data.clientId === ClientId) {
                        return;
                    }

                    removeToolDataWithMeasurementId(data.imageId, data.toolType, data.id);

                    // Update each displayed viewport
                    updateAllViewports();
                }
            });

            Measurements.find().observe({
                added: data => {
                    if (data.clientId === ClientId) {
                        TrialResponseCriteria.validateAllDelayed();
                        return;
                    }

                    log.info('Measurement added');

                    // This is used to re-add tools from the database into the
                    // Cornerstone ToolData structure
                    syncMeasurementAndToolData(data);

                    // Update each displayed viewport
                    updateAllViewports();
                },
                changed: data => {
                    if (data.clientId === ClientId) {
                        TrialResponseCriteria.validateAllDelayed();
                        return;
                    }

                    log.info('Measurement changed');

                    // This is used to update changed tools from the database
                    // in the Cornerstone ToolData structure
                    syncMeasurementAndToolData(data);

                    // Update each displayed viewport
                    updateAllViewports();

                    TrialResponseCriteria.validateAllDelayed();
                },
                removed: data => {
                    log.info('Measurement removed');

                    // Check that this Measurement actually contains timepoint data
                    if (!data || !data.timepoints) {
                        return;
                    }

                    // Get the Measurement ID and relevant tool so we can remove
                    // tool data for this Measurement
                    const measurementId = data._id;
                    const toolType = data.toolType;

                    // Remove the measurement from all the imageIds on which it exists
                    // as toolData
                    Object.keys(data.timepoints).forEach(timepointId => {
                        // Clear the toolData for this timepoint
                        const imageId = data.timepoints[timepointId].imageId;
                        removeToolDataWithMeasurementId(imageId, toolType, measurementId);

                        // Set reviewer for this timepoint
                        if (data.timepoints[timepointId].studyInstanceUid) {
                            Meteor.call('setReviewer', data.timepoints[timepointId].studyInstanceUid);
                        }
                    });

                    // Sync database data with toolData for all the measurements
                    // that have just been updated

                    // Note that here we need to use greater than and equals to
                    // find the Measurements, whereas on the server it's
                    // only "greater than", since inside this callback the
                    // Measurements have already been decremented.
                    const measurements = Measurements.find({
                        patientId: data.patientId,
                        lesionNumberAbsolute: {
                            $gte: data.lesionNumberAbsolute
                        }
                    });

                    measurements.forEach(measurement => {
                        syncMeasurementAndToolData(measurement);
                    });

                    // Update each displayed viewport
                    updateAllViewports();

                    ValidationErrors.remove({
                        measurementId: data._id
                    });

                    TrialResponseCriteria.validateAll();
                }
            });
        }
    });
});

Template.viewer.events({
    'CornerstoneToolsMeasurementAdded .imageViewerViewport'(event, instance, eventData) {
        handleMeasurementAdded(event, eventData);
    },
    'CornerstoneToolsMeasurementModified .imageViewerViewport'(event, instance, eventData) {
        handleMeasurementModified(event, eventData);
    },
    'CornerstoneToolsMeasurementRemoved .imageViewerViewport'(event, instance, eventData) {
        handleMeasurementRemoved(event, eventData);
    }
});
