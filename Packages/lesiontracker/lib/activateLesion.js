import { OHIF } from 'meteor/ohif:core';

/**
 * Activates a set of lesions when lesion table row is clicked
 *
 * @param measurementId The unique key for a specific Measurement
 */
activateLesion = function(measurementId, templateData) {

    // Set background color of selected row
    $('tr[data-measurementid=' + measurementId + ']').addClass('selectedRow').siblings().removeClass('selectedRow');

    var measurementData = Measurements.findOne(measurementId);

    // If there is no measurement with this ID, stop here
    if (!measurementData) {
        log.warn('No Measurements entry associated to an ID in a lesion table row');
        return;
    }

    // Create an empty array to store the ordered timepoint data for this
    // measurement
    var orderedTimepointEntries = [];

    // Retrieve the Cursor for this patient's Timepoints in ascending order by studyDate
    var sortedTimepoints = Timepoints.find({}, {
        sort: {
            latestDate: 1
        }
    });

    // Loop through each timepoint and populate the orderTimepointEntries array with
    // The measurement data at each timepoint. The most recent measurements will be first in
    // the array.
    sortedTimepoints.forEach(function(timepoint) {
        var measurementDataAtTimepoint = measurementData.timepoints[timepoint.timepointId];
        if (!measurementDataAtTimepoint) {
            return;
        }

        orderedTimepointEntries.push(measurementDataAtTimepoint);
    });

    // If there is no timepoint data to display for this Measurement, stop here
    if (!orderedTimepointEntries.length) {
        return;
    }

    // Retrieve the list of available viewports
    var viewports = $('.imageViewerViewport').not('.empty');

    // Remove earlier timepoint data entries
    if (orderedTimepointEntries.length > viewports.length) {
        var difference = orderedTimepointEntries.length - viewports.length;
        orderedTimepointEntries.splice(0, difference);
    }

    // Loop through the viewports and display each timepoint
    viewports.each(function(viewportIndex, element) {
        // Stop if we run out of timepoints before viewports
        if (viewportIndex >= orderedTimepointEntries.length) {
            // Update the element anyway, to remove any other highlights that are present
            deactivateAllToolData(element, 'bidirectional');
            deactivateAllToolData(element, 'nonTarget');
            deactivateAllToolData(element, 'crTool');
            deactivateAllToolData(element, 'unTool');
            deactivateAllToolData(element, 'exTool');

            return false;
        }

        // Find measurements related to the Nth timepoint
        // TODO=Re-evaluate this approach to populating viewports with timepoints
        // What is the desired behaviour here?
        var measurementAtTimepoint = orderedTimepointEntries[viewportIndex];

        // Find the image that is currently in this viewport
        var enabledElement = cornerstone.getEnabledElement(element);
        if (!enabledElement || !enabledElement.image) {
            return;
        }

        // If there is no measurement data to display, stop here
        if (!measurementAtTimepoint) {
            // Update the element anyway, to remove any other highlights that are present
            deactivateAllToolData(element, 'bidirectional');
            deactivateAllToolData(element, 'nonTarget');
            deactivateAllToolData(element, 'crTool');
            deactivateAllToolData(element, 'unTool');
            deactivateAllToolData(element, 'exTool');
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
        layoutManager.rerenderViewportWithNewDisplaySet(element, requiredSeriesData, function(element) {
            activateMeasurements(element, measurementId, templateData, viewportIndex);
        });
    });
};
