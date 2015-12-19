removeToolDataWithMeasurementId = function(imageId, toolType, measurementId) {
    var toolState = cornerstoneTools.globalImageIdSpecificToolStateManager.toolState;
    
    // Find any related toolData
    if (!toolState[imageId] || !toolState[imageId][toolType]) {
        return;
    }
    
    var toolData = toolState[imageId][toolType].data;
    if (!toolData.length) {
        return;
    }

    // Search toolData for entries linked to the specified Measurement
    var toRemove = [];
    toolData.forEach(function(measurement, index) {
        if (measurement.id === measurementId) {
            toRemove.push(index);
            return false;
        }
    });

    // If any toolData entries need to be removed, splice them from
    // the toolData array
    toRemove.forEach(function(index) {
        toolData.splice(index, 1);
    });
};