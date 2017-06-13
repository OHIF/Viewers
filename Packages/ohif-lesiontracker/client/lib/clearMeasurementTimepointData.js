import { OHIF } from 'meteor/ohif:core';

const removeToolDataWithMeasurementId = (imageId, toolType, measurementId) => {
    OHIF.log.info('removeToolDataWithMeasurementId');
    const toolState = cornerstoneTools.globalImageIdSpecificToolStateManager.saveToolState();

    // Find any related toolData
    if (!toolState[imageId] || !toolState[imageId][toolType]) {
        return;
    }

    const toolData = toolState[imageId][toolType].data;
    if (!toolData.length) {
        return;
    }

    // Search toolData for entries linked to the specified Measurement
    const toRemove = [];
    toolData.forEach(function(measurement, index) {
        if (measurement.id === measurementId ||
            measurement._id === measurementId) {
            toRemove.push(index);
            return false;
        }
    });

    OHIF.log.info('Removing Indices: ');
    OHIF.log.info(toRemove);

    // If any toolData entries need to be removed, splice them from
    // the toolData array
    toRemove.forEach(function(index) {
        toolData.splice(index, 1);
    });

    cornerstoneTools.globalImageIdSpecificToolStateManager.restoreToolState(toolState);
};

OHIF.lesiontracker.clearMeasurementTimepointData = (measurementId, timepointId) => {
    const data = Measurements.findOne(measurementId);

    // Clear the Measurement data for this timepoint
    const imageId = data.timepoints[timepointId].imageId;
    const toolType = data.toolType;
    removeToolDataWithMeasurementId(imageId, toolType, measurementId);

    // Update any viewports that are currently displaying this imageId
    const enabledElements = cornerstone.getEnabledElementsByImageId(imageId);
    enabledElements.forEach(enabledElement => cornerstone.updateImage(enabledElement.element));
};
