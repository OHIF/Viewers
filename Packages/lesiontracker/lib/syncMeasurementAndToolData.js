syncMeasurementAndToolData = function(data) {
    // Check what toolType we should be adding this to, based on the isTarget value
    // of the stored Measurement
    var toolType = data.isTarget ? 'lesion' : 'nonTarget';
    var toolState = cornerstoneTools.globalImageIdSpecificToolStateManager.toolState;

    // Loop through the timepoint data for this measurement
    Object.keys(data.timepoints).forEach(function(key) {
        var storedData = data.timepoints[key];
        var imageId = storedData.imageId;

        if (!toolState[imageId]) {
            toolState[imageId] = {};
        }

        // This is probably not the best approach to prevent duplicates
        if (toolState[imageId][toolType] && toolState[imageId][toolType].data) {
            var measurementHasNoIdYet = false;
            toolState[imageId][toolType].data.forEach(function(measurement) {
                if (measurement.id === 'notready') {
                    measurementHasNoIdYet = true;
                    return false;
                }
            });

            // Stop here if it appears that we are creating this measurement right now,
            // and would not like this function to add another copy of it to the toolData
            if (measurementHasNoIdYet === true) {
                return;
            }
        }

        if (!toolState[imageId][toolType]) {
            toolState[imageId][toolType] = {
                data: []
            };
        } else {
            var alreadyExists = false;
            if (toolState[imageId][toolType].data.length) {
                toolState[imageId][toolType].data.forEach(function(measurement) {
                    if (measurement.id === data._id) {
                        alreadyExists = true;

                        // Update the toolData lesionNumber from the Measurement
                        measurement.lesionNumber = data.lesionNumber;
                        return false;
                    }
                });
            }

            if (alreadyExists === true) {
                return;
            }
        }

        // Create measurementData structure based on the lesion data at this timepoint
        // We will add this into the toolData for this imageId
        var measurementData = storedData;
        measurementData.isTarget = data.isTarget;
        measurementData.lesionNumber = data.lesionNumber;
        measurementData.measurementText = data.measurementText;
        measurementData.isDeleted = data.isDeleted;
        measurementData.location = data.location;
        measurementData.locationUID = data.locationUID;
        measurementData.patientId = data.patientId;
        measurementData.visible = data.visible;
        measurementData.active = data.active;
        measurementData.uid = data.uid;
        measurementData.id = data._id;

        toolState[imageId][toolType].data.push(measurementData);

        TrialResponseCriteria.validateSingleMeasurement(measurementData);
    });
};
