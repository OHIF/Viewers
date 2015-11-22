/**
 * Returns timepoint object based on timepoint id of the enabled element
 *
 * @param timepoints
 * @param enabledElement
 * @returns {*|{}} Timepoint object based on timepoint id of the enabled element (or an empty Object)
 */
function getTimepointObject(imageId) {
    var study = cornerstoneTools.metaData.get('study', imageId);

    var timepoint = Timepoints.findOne({timepointName: study.studyDate});
    return timepoint;
}

/**
 * Switch to the image of the correct image index
 * Activate the selected measurement on the switched image (color to be green)
 * Deactivate all other measurements on the switched image (color to be white)
 */
function activateMeasurements(element, measurementId) {
    // TODO=Switch this to use the new CornerstoneToolMeasurementModified event,
    // Once it has 'modified on activation' set up

    var enabledElement = cornerstone.getEnabledElement(element);
    var imageId = enabledElement.image.imageId;
    var timepointData = getTimepointObject(imageId);
    var measurementData = Measurements.findOne(measurementId);

    var measurementAtTimepoint = measurementData.timepoints[timepointData.timepointID];
    if (!measurementAtTimepoint) {
        return;
    }

    // Defines event data
    var eventData = {
        enabledElement: enabledElement,
        lesionData: {
            id: measurementId,
            isTarget: measurementData.isTarget,
            lesionNumber: measurementData.lesionNumber,
            imageId: imageId,
            seriesInstanceUid: measurementAtTimepoint.seriesInstanceUid,
            studyInstanceUid: measurementAtTimepoint.studyInstanceUid
        },
        type: "active"
    };

    // If isTarget = false, this measurement is nonTarget measurement
    // Activate related nonTarget measurement
    // Deactivate all target measurements to activate only nonTarget measurement
    if (!isTarget) {
        $(element).trigger("NonTargetToolSelected", eventData);

        // Deactivate lesion tool measurements
        eventData.type = "inactive";

        $(element).trigger("LesionToolSelected", eventData);

    } else {
        // Trigger event for target measurements
        $(element).trigger("LesionToolSelected", eventData);

        // Deactivate nonTarget tool measurements
        eventData.type = "inactive";

        // Trigger event for nonTarget measurements
        // Inactivate all nonTarget measurements if any measurement is active
        $(element).trigger("NonTargetToolSelected", eventData);
    }
}

/**
 * Activates a set of lesions when lesion table row is clicked
 *
 * @param measurementId The unique key for a specific Measurement
 */
function activateLesion(measurementId) {
    // Find Measurement data for this lesion
    var measurementData = Measurements.findOne(measurementId);

    // If there is no measurement with this ID, stop here
    if (!measurementData) {
        log.warn('No Measurements entry associated to an ID in a lesion table row');
        return;
    }

    // Get the timepoint data from this Measurement
    var timepoints = measurementData.timepoints;

    // Loop through the viewports and display each timepoint
    $(".imageViewerViewport").each(function(viewportIndex, element) {
        // Stop if we run out of timepoints before viewports
        if (viewportIndex >= Object.keys(timepoints).length) {
            return false;
        }

        // Find the image that is currently in this viewport
        var enabledElement = cornerstone.getEnabledElement(element);
        if (!enabledElement || !enabledElement.image) {
            return;
        }

        // Find measurements related to the Nth timepoint
        // TODO=Re-evaluate this approach to populating viewports with timepoints
        // What is the desired behaviour here?
        var key = Object.keys(measurementData.timepoints)[viewportIndex];
        var measurementAtTimepoint = measurementData.timepoints[key];

        // If there is no measurement data to display, stop here
        if (!measurementAtTimepoint) {
            return;
        }

        // Check which study and series are required to display the measurement at this timepoint
        var requiredSeriesData = {
            seriesInstanceUid: measurementAtTimepoint.seriesInstanceUid,
            studyInstanceUid: measurementAtTimepoint.studyInstanceUid
        };

        // Check if the study / series we need is already the one in the viewport
        var currentSeriesData = OHIF.viewer.loadedSeriesData[viewportIndex];
        if (currentSeriesData.seriesInstanceUid === measurementAtTimepoint.seriesInstanceUid &&
            currentSeriesData.studyInstanceUid === measurementAtTimepoint.studyInstanceUid) {
            // If it is, activate the measurements in this viewport and stop here
            activateMeasurements(element, measurementId);
            return;
        }

        // Otherwise, re-render the viewport with the required study/series, then
        // add an onRendered callback to activate the measurements
        rerenderViewportWithNewSeries(element, requiredSeriesData, function(element) {
            activateMeasurements(element, measurementId);
        });
    });
}

Template.lesionTable.helpers({
    'measurement': function() {
        return Measurements.find({}, {sort: {number: 1}});
    },
    'timepoints': function() {
        return Timepoints.find({}, {sort: {timepointName: 1}});
    }
});

Template.lesionTable.events({
    'click table#tblLesion tbody tr': function(e) {
        // Retrieve the lesion id from the DOM data for this row
        var measurementId = $(e.currentTarget).data('measurementid');
        activateLesion(measurementId);
    }
});