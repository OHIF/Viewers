/**
 * Activates a set of lesions when lesion table row is clicked
 *
 * @param measurementId The unique key for a specific Measurement
 */
function activateLesion(measurementId, templateData) {
    // Find Measurement data for this lesion
    var measurementData = Measurements.findOne(measurementId);

    // If there is no measurement with this ID, stop here
    if (!measurementData) {
        log.warn('No Measurements entry associated to an ID in a lesion table row');
        return;
    }

    // Get the timepoint data from this Measurement
    var timepoints = measurementData.timepoints;

    // Get all non-dummy timepoint entries in the Measurement
    // TODO=Re-evaluate this approach to populating viewports with timepoints
    // What is the desired behaviour here?
    var timepointsWithEntries = [];
    Object.keys(timepoints).forEach(function(key) {
        var timepoint = timepoints[key];

        if (timepoint.imageId === "" ||
           timepoint.studyInstanceUid === "" ||
           timepoint.seriesInstanceUid === "") {
           return;
        }

        timepointsWithEntries.push(timepoint);
    });

    // If there are no non-dummy timepoint entries, stop here
    if (!timepointsWithEntries.length) {
        return;
    }

    // Loop through the viewports and display each timepoint
    $(".imageViewerViewport").each(function(viewportIndex, element) {
        // Stop if we run out of timepoints before viewports
        if (viewportIndex >= timepointsWithEntries.length) {
            return false;
        }

        // Find measurements related to the Nth timepoint
        // TODO=Re-evaluate this approach to populating viewports with timepoints
        // What is the desired behaviour here?
        var measurementAtTimepoint = timepointsWithEntries[viewportIndex];

        // Find the image that is currently in this viewport
        var enabledElement = cornerstone.getEnabledElement(element);
        if (!enabledElement || !enabledElement.image) {
            return;
        }

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
            activateMeasurements(element, measurementId, templateData, viewportIndex);
            return;
        }

        // Otherwise, re-render the viewport with the required study/series, then
        // add an onRendered callback to activate the measurements
        rerenderViewportWithNewSeries(element, requiredSeriesData, function(element) {
            activateMeasurements(element, measurementId, templateData, viewportIndex);
        });
    });
}

/**
 * Returns timepoint object based on timepoint id of the enabled element
 *
 * @param timepoints
 * @param enabledElement
 * @returns {*|{}} Timepoint object based on timepoint id of the enabled element (or an empty Object)
 */
function getTimepointObject(imageId) {
    var study = cornerstoneTools.metaData.get('study', imageId);
    return Timepoints.findOne({timepointName: study.studyDate});
}

/**
 * Switch to the image of the correct image index
 * Activate the selected measurement on the switched image (color to be green)
 * Deactivate all other measurements on the switched image (color to be white)
 */
function activateMeasurements(element, measurementId, templateData, viewportIndex) {
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

    // If type is active, load image and activate lesion
    // If type is inactive, update lesions of enabledElement as inactive
    //TODO: !stackData.currentImageIdIndex returns incorrect value
    // Get loadedSeriesData currentImageIdIndex from ViewerData
    var contentId = templateData.contentId;
    var viewerData = ViewerData[contentId];
    var elementCurrentImageIdIndex = viewerData.loadedSeriesData[viewportIndex].currentImageIdIndex;

    var stackToolDataSource = cornerstoneTools.getToolState(element, 'stack');
    var stackData = stackToolDataSource.data[0];
    var imageIds = stackData.imageIds;
    var imageIdIndex = imageIds.indexOf(measurementAtTimepoint.imageId);

    if (imageIdIndex < 0) {
        return;
    }

    if (imageIdIndex === elementCurrentImageIdIndex){
        activateTool(element, measurementData, timepointData.timepointID);
    } else {
        cornerstone.loadAndCacheImage(imageIds[imageIdIndex]).then(function(image) {
            cornerstone.displayImage(element, image);
            activateTool(element, measurementData, timepointData.timepointID);
        });
    }
}

/**
 * Activates a specific tool data instance and deactivates all other
 * target and non-target measurement data
 *
 * @param element
 * @param measurementData
 * @param timepointID
 */
function activateTool(element, measurementData, timepointID) {
    deactivateAllToolData(element, 'lesion');
    deactivateAllToolData(element, 'nonTarget');

    var toolType = measurementData.isTarget ? 'lesion' : 'nonTarget';
    var toolData = cornerstoneTools.getToolState(element, toolType);
    if (!toolData) {
        return;
    }

    var measurementAtTimepoint = measurementData.timepoints[timepointID];

    for (var i = 0; i < toolData.data.length; i++) {
        data = toolData.data[i];

        // When click a row of table measurements, measurement will be active and color will be green
        // TODO= Remove this with the measurementId once it is in the tool data
        if (data.seriesInstanceUid === measurementAtTimepoint.seriesInstanceUid &&
            data.studyInstanceUid === measurementAtTimepoint.studyInstanceUid &&
            data.lesionNumber === measurementData.lesionNumber &&
            data.isTarget == measurementData.isTarget) {

            data.active = true;
            break;
        }
    }

    cornerstone.updateImage(element);
}

/**
 * Sets all tool data entries value for 'active' to false
 * This is used to remove the active color on entire sets of tools
 *
 * @param element The Cornerstone element that is being used
 * @param toolType The tooltype of the tools that will be deactivated
 */
function deactivateAllToolData(element, toolType) {
    var toolData = cornerstoneTools.getToolState(element, toolType);
    if (!toolData) {
        return;
    }

    for (var i = 0; i < toolData.data.length; i++) {
        var data = toolData.data[i];
        data.active = false;
    }
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
    'click table#tblLesion tbody tr': function(e, template) {
        // Retrieve the lesion id from the DOM data for this row
        var measurementId = $(e.currentTarget).data('measurementid');
        activateLesion(measurementId,template.data);
    }
});