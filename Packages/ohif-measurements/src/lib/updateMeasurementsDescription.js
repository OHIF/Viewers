import { OHIF } from 'meteor/ohif:core';

/**
 * Updates the measurements' description for a measurement number across all timepoints
 *
 * @param measurementData base measurement data that must contain toolType and measurementNumber
 * @param description measurement description that will be used
 */
OHIF.measurements.updateMeasurementsDescription = (measurementData, description) => {
    const { toolType, measurementNumber } = measurementData;
    measurementData.description = description;
    const filter = { measurementNumber };
    const operator = { $set: { description } };
    const options = { multi: true };
    const { toolGroup } = OHIF.measurements.getToolConfiguration(toolType);
    toolGroup.childTools.forEach(childTool => {
        const collection = OHIF.viewer.measurementApi.tools[childTool.id];
        collection.update(filter, operator, options);
    });

    // Notify that viewer suffered changes
    OHIF.measurements.triggerTimepointUnsavedChanges('relabel');
};
