syncMeasurementAndToolData = function(measurement) {
    log.info('syncMeasurementAndToolData');

    // Check what toolType we should be adding this to, based on the isTarget value
    // of the stored Measurement
    var toolType = measurement.toolType;

    // Loop through the timepoint data for this measurement
    Object.keys(measurement.timepoints).forEach(function(key) {
        var timepointData = measurement.timepoints[key];
        var imageId = timepointData.imageId;

        // Sync the Cornerstone ToolData with this Measurement's timepoint-specific data
        syncTimepointDataWithToolData(measurement, timepointData, imageId, toolType);
    });
};

function syncTimepointDataWithToolData(measurement, timepointData, imageId, toolType) {
    // Get the global imageId-specific toolState from Cornerstone Tools
    var toolState = cornerstoneTools.globalImageIdSpecificToolStateManager.toolState;

    // If no tool state exists for this imageId, create an empty object to store it
    if (!toolState[imageId]) {
        toolState[imageId] = {};
    }

    // Check if we already have toolData for this imageId and toolType
    if (toolState[imageId][toolType] &&
        toolState[imageId][toolType].data &&
        toolState[imageId][toolType].data.length) {

        // If we have toolData, we should search it for any toolData
        // related to the current Measurement
        var toolData = toolState[imageId][toolType].data;

        // Create a flag so we know if we have successfully updated
        // this Measurement's timepoint data in the toolData
        var alreadyExists = false;

        // Loop through the toolData to search for this Measurement's
        // timepoint data
        toolData.forEach(function(tool) {
            // Break the loop if this isn't the Measurement we are looking for
            if (tool.id !== measurement._id) {
                return;
            }

            // If we find the Measurement, set the flag to True
            alreadyExists = true;

            // Update the toolData from the Measurement data and
            // timepoint-specific data from this Measurement
            tool.lesionNumber = measurement.lesionNumber;
            tool.isTarget = measurement.isTarget;
            tool.active = timepointData.active;
            tool.visible = timepointData.visible;
            tool.isDeleted = timepointData.isDeleted;
            tool.handles = timepointData.handles;
            tool.toolType = measurement.toolType;
            return false;
        });

        // If we found the Measurement we intended to update, we can stop
        // this function here
        if (alreadyExists === true) {
            return;
        }
    } else {
        // If no toolData exists for this toolType, create an empty array to hold some
        toolState[imageId][toolType] = {
            data: []
        };
    }

    // If we have reached this point, it means we haven't found the Measurement we are
    // looking for in the current toolData. This means we need to add it.

    // First, create the measurementData structure based on the lesion data at this timepoint.
    var tool = timepointData;
    tool.lesionNumber = measurement.lesionNumber;
    tool.isTarget = measurement.isTarget;
    tool.location = measurement.location;
    tool.locationUID = measurement.locationUID;
    tool.patientId = measurement.patientId;
    tool.id = measurement._id;
    tool.toolType = measurement.toolType;

    // Add the measurementData into the toolData for this imageId
    toolState[imageId][toolType].data.push(tool);
}
