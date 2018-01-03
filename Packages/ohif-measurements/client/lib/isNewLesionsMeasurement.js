import { OHIF } from 'meteor/ohif:core';
import { _ } from 'meteor/underscore';

/**
 * Check if the given measurement is a new lesion
 *
 * @param measurementData Measurement that will be checked
 * @returns {Boolean} Boolean value telling if the given measurement is a new lesion or not
 */
OHIF.measurements.isNewLesionsMeasurement = measurementData => {
    if (!measurementData) return;

    const { timepointApi, measurementApi } = OHIF.viewer;
    const { timepointId, toolType } = measurementData;
    const toolConfig = OHIF.measurements.getToolConfiguration(toolType);

    // Stop here if the needed information is not set
    if (!measurementApi || !timepointApi || !timepointId || !toolConfig) return;

    const { toolGroupId } = toolConfig;
    const current = timepointApi.timepoints.findOne({ timepointId });
    const baseline = timepointApi.baseline();

    // Stop here if there's no current or baseline timepoints, or if the current is the baseline
    if (!current || !baseline || current.timepointType === 'baseline') return false;

    // Retrieve all the data for the given tool group (e.g. 'targets')
    const atBaseline = measurementApi.fetch(toolGroupId, { timepointId: baseline.timepointId });

    // Obtain a list of the Measurement Numbers from the measurements which have baseline data
    const numbers = atBaseline.map(m => m.measurementNumber);

    // Return true if the measurement number from follow-up is not present at baseline
    return !_.contains(numbers, measurementData.measurementNumber);
};
