import { $ } from 'meteor/jquery';

import { OHIF } from 'meteor/ohif:core';

/**
 * Activates a set of lesions when lesion table row is clicked
 *
 * @param measurementId The unique key for a specific Measurement
 */
OHIF.measurements.activateLesion = (measurementId, templateData) => {
    // Set background color of selected row
    $(`tr[data-measurementid=${measurementId}]`).addClass('selectedRow')
        .siblings().removeClass('selectedRow');

    // Get the data for current measurement
    const measurementData = Measurements.findOne(measurementId);

    // If there is no measurement with this ID, stop here
    if (!measurementData) {
        OHIF.OHIF.log.warn('No Measurements entry associated to an ID in a lesion table row');
        return;
    }

    // Create an empty array to store the ordered timepoint data for this measurement
    const orderedTimepointEntries = [];

    // Retrieve the Cursor for this patient's Timepoints in ascending order by studyDate
    const sortedTimepoints = Timepoints.find({}, {
        sort: {
            latestDate: 1
        }
    });

    // Loop through each timepoint and populate the orderTimepointEntries array with the
    // measurement data at each timepoint. The most recent measurements will be first in the array.
    sortedTimepoints.forEach(timepoint => {
        const measurementDataAtTimepoint = measurementData.timepoints[timepoint.timepointId];
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
    const $viewports = $('.imageViewerViewport').not('.empty');

    // Remove earlier timepoint data entries
    if (orderedTimepointEntries.length > $viewports.length) {
        const difference = orderedTimepointEntries.length - $viewports.length;
        orderedTimepointEntries.splice(0, difference);
    }

    // Loop through the viewports and display each timepoint
    $viewports.each((viewportIndex, element) => {
        // Stop if we run out of timepoints before viewports
        if (viewportIndex >= orderedTimepointEntries.length) {
            // Update the element anyway, to remove any other highlights that are present
            OHIF.measurements.deactivateAllToolData(element, 'bidirectional');
            OHIF.measurements.deactivateAllToolData(element, 'nonTarget');
            OHIF.measurements.deactivateAllToolData(element, 'crTool');
            OHIF.measurements.deactivateAllToolData(element, 'unTool');
            OHIF.measurements.deactivateAllToolData(element, 'exTool');

            return false;
        }

        // Find measurements related to the Nth timepoint
        // TODO=Re-evaluate this approach to populating viewports with timepoints
        // What is the desired behaviour here?
        const measurementAtTimepoint = orderedTimepointEntries[viewportIndex];

        // Find the image that is currently in this viewport
        const enabledElement = cornerstone.getEnabledElement(element);
        if (!enabledElement || !enabledElement.image) {
            return;
        }

        // If there is no measurement data to display, stop here
        if (!measurementAtTimepoint) {
            // Update the element anyway, to remove any other highlights that are present
            OHIF.measurements.deactivateAllToolData(element, 'bidirectional');
            OHIF.measurements.deactivateAllToolData(element, 'nonTarget');
            OHIF.measurements.deactivateAllToolData(element, 'crTool');
            OHIF.measurements.deactivateAllToolData(element, 'unTool');
            OHIF.measurements.deactivateAllToolData(element, 'exTool');
            cornerstone.updateImage(element);
            return;
        }

        // Check which study and series are required to display the measurement at this timepoint
        const requiredSeriesData = {
            seriesInstanceUid: measurementAtTimepoint.seriesInstanceUid,
            studyInstanceUid: measurementAtTimepoint.studyInstanceUid
        };

        // Check if the study / series we need is already the one in the viewport
        const currentSeriesData = OHIF.viewer.loadedSeriesData[viewportIndex];
        const activateMeasurements = OHIF.measurements.activateMeasurements;
        if (currentSeriesData.seriesInstanceUid === measurementAtTimepoint.seriesInstanceUid &&
            currentSeriesData.studyInstanceUid === measurementAtTimepoint.studyInstanceUid) {
            // If it is, activate the measurements in this viewport and stop here
            activateMeasurements(element, measurementId, templateData, viewportIndex);
            return;
        }

        // Otherwise, re-render the viewport with the required study/series, then
        // add an onRendered callback to activate the measurements
        window.layoutManager.rerenderViewportWithNewDisplaySet(element, requiredSeriesData, element => {
            activateMeasurements(element, measurementId, templateData, viewportIndex);
        });
    });
};
