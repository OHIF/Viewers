/**
 * Activates a set of lesions when lesion table row is clicked
 *
 * @param measurementId The unique key for a specific Measurement
 */
activateLesion = function(measurementId, templateData) {

    // Set background color of selected row
    $("tr[data-measurementid=" + measurementId + "]").addClass("selectedRow").siblings().removeClass("selectedRow");

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
            // Update the element anyway, to remove any other highlights that are present
            deactivateAllToolData(element, 'lesion');
            deactivateAllToolData(element, 'nonTarget');
            cornerstone.updateImage(element);

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
            // Update the element anyway, to remove any other highlights that are present
            deactivateAllToolData(element, 'lesion');
            deactivateAllToolData(element, 'nonTarget');
            cornerstone.updateImage(element);
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
};