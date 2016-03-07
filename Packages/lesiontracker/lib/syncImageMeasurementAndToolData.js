syncImageMeasurementAndToolData = function(measurement) {
    // TODO: Refactor this to merge it with syncMeasurementAndToolData somehow
    log.info('syncImageMeasurementAndToolData');

    var toolState = cornerstoneTools.globalImageIdSpecificToolStateManager.toolState;

    var imageId = measurement.imageId;
    var toolType = measurement.toolType;

    // If no tool state exists for this imageId, create an empty object to store it
    if (!toolState[imageId]) {
        toolState[imageId] = {};
    }

    // Check if we already have toolData for this imageId and toolType
    if (toolState[imageId][toolType] &&
        toolState[imageId][toolType].data &&
        toolState[imageId][toolType].data.length) {
        // If we have toolData, we should search it for any toolData
        // related to the current ImageMeasurement
        var toolData = toolState[imageId][toolType].data;

        // Create a flag so we know if we have successfully updated
        // this ImageMeasurement's timepoint data in the toolData
        var alreadyExists = false;

        // Loop through the toolData to search for this ImageMeasurement
        toolData.forEach(function(tool) {
            // Break the loop if this isn't the ImageMeasurement we are looking for
            if (tool._id !== measurement._id) {
                return;
            }

            // If we find the ImageMeasurement, set the flag to True
            alreadyExists = true;

            // Update the toolData from the ImageMeasurement data
            $.extend(tool, measurement);
            return false;
        });

        // If we found the ImageMeasurement we intended to update, we can stop
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

    // If we have reached this point, it means we haven't found the ImageMeasurement we are
    // looking for in the current toolData. This means we need to add it.

    // Add the ImageMeasurementData into the toolData for this imageId
    toolState[imageId][toolType].data.push(measurement);
};