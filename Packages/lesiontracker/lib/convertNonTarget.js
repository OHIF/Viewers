var responseTypes = {
    crTool: 'CR',
    exTool: 'EX',
    unTool: 'UN'
};

convertNonTarget = function(measurementData, newTooltype) {
    if (measurementData.toolType !== 'nonTarget') {
        return;
    }

    var measurement = Measurements.findOne(measurementData.id);

    var timepoint = Timepoints.findOne({
        timepointId: measurementData.timepointId
    });

    if (timepoint && timepoint.timepointType !== 'followup') {
        log.warn('Not a followup');
        return;
    }

    // Next, update the measurementData and add it to the new tool type
    var newMeasurement = {
        id: 'notready',
        lesionNumber: LesionManager.getNewLesionNumber(measurementData.timepointId, false),
        visible: true,
        active: true,
        imageId: measurementData.imageId,
        seriesInstanceUid: measurementData.seriesInstanceUid,
        studyInstanceUid: measurementData.studyInstanceUid,
        patientId: measurementData.patientId,
        isTarget: false,
        toolType: newTooltype
    };

    newMeasurement.handles = measurementData.handles;

    if (responseTypes[newTooltype]) {
        newMeasurement.response = responseTypes[newTooltype];
    }

    // Adds lesion data to timepoints array
    LesionManager.updateLesionData(newMeasurement);

    // Set the new Measurement to have the same location as the old one
    if (measurement.location && measurement.locationId) {
        var existingMeasurement = Measurements.findOne({
            lesionNumber: newMeasurement.lesionNumber,
            isTarget: newMeasurement.isTarget
        });

        if (!existingMeasurement) {
            return;
        }

        Measurements.update(existingMeasurement._id, {
            $set: {
                location: measurement.location,
                locationId: measurement.locationId
            }
        });
    }

    if (measurement) {
        // Remove the timepointData from this Measurement and update it
        // in the database, if it is already in the database
        clearMeasurementTimepointData(measurement._id, measurementData.timepointId);
    }
};
