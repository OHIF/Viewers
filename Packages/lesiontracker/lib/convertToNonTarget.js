convertToNonTarget = function(measurementData) {
    if (measurementData.isTarget === false) {
        return;
    }

    var measurement = Measurements.findOne(measurementData.id);

    var timepoint = Timepoints.findOne({
        timepointId: measurementData.timepointId
    });

    // Next, update the measurementData and add it to the new tool type
    var toolType = 'nonTarget';
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
        toolType: toolType
    };
    
    if (timepoint && timepoint.timepointType === 'baseline') {
        newMeasurement.response = 'Present';
    } else {
        newMeasurement.response = '';
    }

    newMeasurement.handles = {
        start: {
            x: (measurementData.handles.start.x + measurementData.handles.end.x) / 2,
            y: (measurementData.handles.start.y + measurementData.handles.end.y) / 2,
            highlight: true,
            active: false
        },
        end: {
            x: Math.min(measurementData.handles.start.x, measurementData.handles.end.x),
            y: Math.min(measurementData.handles.start.y, measurementData.handles.end.y),
            highlight: true,
            active: false
        },
        textBox: {
            x: measurementData.handles.textBox.x,
            y: measurementData.handles.textBox.y,
            active: false,
            movesIndependently: false,
            drawnIndependently: true,
            allowedOutsideImage: true,
            hasBoundingBox: true
        }
    };

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
