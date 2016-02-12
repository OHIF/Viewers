syncMeasurementAndToolData = function(measurement) {
    console.log('syncMeasurementAndToolData');

    // Check what toolType we should be adding this to, based on the isTarget value
    // of the stored Measurement
    var toolType = measurement.isTarget ? 'lesion' : 'nonTarget';

    // Loop through the timepoint data for this measurement
    Object.keys(measurement.timepoints).forEach(function(key) {
        var timepointData = measurement.timepoints[key];
        var imageId = timepointData.imageId;

        syncTimepointDataWithToolData(measurement, timepointData, imageId, toolType);
    });
};

function syncTimepointDataWithToolData(measurement, timepointData, imageId, toolType) {
    var toolState = cornerstoneTools.globalImageIdSpecificToolStateManager.toolState;

    if (!toolState[imageId]) {
        toolState[imageId] = {};
    }

    // This is probably not the best approach to prevent duplicates
    if (toolState[imageId][toolType] && toolState[imageId][toolType].data) {
        var measurementHasNoIdYet = false;
        toolState[imageId][toolType].data.forEach(function(measurement) {
            if (measurement.id !== 'notready') {
                return;
            }

            measurementHasNoIdYet = true;
            return false;
        });

        // Stop here if it appears that we are creating this measurement right now,
        // and would not like this function to add another copy of it to the toolData
        if (measurementHasNoIdYet === true) {
            return;
        }
    }

    if (toolState[imageId][toolType]) {
        var alreadyExists = false;
        var toolData = toolState[imageId][toolType].data;
        if (!toolData.length) {
            return;
        }

        toolData.forEach(function(tool) {
            if (tool.id !== measurement._id) {
                return;
            }

            alreadyExists = true;

            // Update the toolData lesionNumber from the Measurement
            tool.lesionNumber = measurement.lesionNumber;
            tool.isTarget = measurement.isTarget;
            
            tool.active = timepointData.active;
            tool.visible = timepointData.visible;
            tool.isDeleted = timepointData.isDeleted;
            tool.handles = timepointData.handles;
            return false;
        });

        if (alreadyExists === true) {
            return;
        }
    } else {
        toolState[imageId][toolType] = {
            data: []
        };
    }

    // Create measurementData structure based on the lesion data at this timepoint
    // We will add this into the toolData for this imageId
    var measurementData = timepointData;
    measurementData.isTarget = measurement.isTarget;
    measurementData.lesionNumber = measurement.lesionNumber;
    measurementData.measurementText = measurement.measurementText;
    measurementData.isDeleted = measurement.isDeleted;
    measurementData.location = measurement.location;
    measurementData.locationUID = measurement.locationUID;
    measurementData.patientId = measurement.patientId;
    measurementData.visible = measurement.visible;
    measurementData.active = measurement.active;
    measurementData.uid = measurement.uid;
    measurementData.id = measurement._id;

    toolState[imageId][toolType].data.push(measurementData);

    TrialResponseCriteria.validateSingleMeasurement(measurementData);
}
