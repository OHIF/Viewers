measurementValuesByType = {
    bidirectional: [
        'shortestDiameter',
        'longestDiameter'
    ],
    nonTarget: ['response'],
    crTool: ['response'],
    exTool: ['response'],
    unTool: ['response'],
    length: ['length'],
    ellipticalRoi: [
        'area',
        'mean',
        'stdev'
    ]

};

/**
 * Update the Timepoint object for a specific Measurement.
 * If no measurement exists yet, one will be created.
 *
 * Input is toolData from the lesion or nonTarget tool
 *
 * @param lesionData
 */
function updateLesionData(lesionData) {
    var study = Studies.findOne({
        studyInstanceUid: lesionData.studyInstanceUid
    });

    if (!study) {
        log.warn('Study is not associated with a timepoint');
        return;
    }

    var timepoint = Timepoints.findOne({
        timepointId: study.timepointId
    });

    if (!timepoint) {
        log.warn('Timepoint in an image is not present in the Timepoints Collection?');
        return;
    }

    // Find the specific lesion to be updated
    var existingMeasurement;
    if (lesionData.id && lesionData.id !== 'notready') {
        existingMeasurement = Measurements.findOne(lesionData.id);
    } else {
        existingMeasurement = Measurements.findOne({
            lesionNumber: lesionData.lesionNumber,
            isTarget: lesionData.isTarget
        });
    }

    // Create a structure for the timepointData based
    // on this Lesion's toolData
    var timepointData = {
        seriesInstanceUid: lesionData.seriesInstanceUid,
        studyInstanceUid: lesionData.studyInstanceUid,
        sopInstanceUid: lesionData.sopInstanceUid,
        handles: lesionData.handles,
        imageId: lesionData.imageId
    };

    if (!lesionData.toolType) {
        // For debugging, might want to switch to measurement types later
        lesionData.toolType = lesionData.isTarget ? 'bidirectional' : 'nonTarget';
    }

    // Populate this timepoint's data with whichever values
    // are stored for this Measurement type
    var values = measurementValuesByType[lesionData.toolType];
    values.forEach(function(valueName) {
        timepointData[valueName] = lesionData[valueName];
    });

    // If no such lesion exists, we need to add one
    if (!existingMeasurement) {
        // Create a data structure for the Measurement
        // based on the current tool data
        var measurement = {
            lesionNumber: lesionData.lesionNumber,
            isTarget: lesionData.isTarget,
            patientId: lesionData.patientId,
            id: lesionData.id,
            toolType: lesionData.toolType
        };
        if (lesionData.toolType) {
            measurement.toolType = lesionData.toolType;
        }

        // Retrieve the location name given the locationUID
        if (lesionData.locationUID !== undefined) {
            var locationObj = LesionLocations.findOne({
                locationUID: lesionData.locationUID
            });

            measurement.location = locationObj.location;
            measurement.isNodal = locationObj.isNodal;
        }

        // Add toolData parameters to the Measurement at this Timepoint
        measurement.timepoints = {};
        measurement.timepoints[timepoint.timepointId] = timepointData;

        // Set a flag to prevent duplication of toolData
        measurement.clientId = ClientId;

        // Increment and store the absolute Lesion Number for this Measurement
        measurement.lesionNumberAbsolute = Measurements.find().count() + 1;

        // Insert this into the Measurements Collection
        // Save the ID into the toolData (not sure if this works?)
        log.info('LesionManager inserting Measurement');
        measurement.id = Measurements.insert(measurement);
    } else {
        lesionData.id = existingMeasurement._id;
        lesionData.isNodal = existingMeasurement.isNodal;

        if (_.isEqual(existingMeasurement.timepoints[timepoint.timepointId], timepointData)) {
            return;
        }

        // Update timepoints from lesion data
        existingMeasurement.timepoints[timepoint.timepointId] = timepointData;

        log.info('LesionManager updating Measurement');
        Measurements.update(existingMeasurement._id, {
            $set: {
                timepoints: existingMeasurement.timepoints,
                clientId: ClientId
            }
        });
    }
}

/**
 * Returns new lesion number according to timepointId
 * @param timepointId
 * @param isTarget
 * @returns {*}
 */
function getNewLesionNumber(timepointId, isTarget) {
    // Get all current lesion measurements
    var numMeasurements = Measurements.find({
        isTarget: isTarget
    }).count();

    // If no measurements exist yet, start at 1
    if (!numMeasurements) {
        return 1;
    }

    // Find related measurements (i.e. target or non-target)
    var measurements = Measurements.find({
        isTarget: isTarget
    }, {
        sort: {
            lesionNumber: 1
        }
    }).fetch();

    // If measurements exist, find the last lesion number
    // from the given timepoint
    var lesionNumberCounter = 1;

    // Search through every Measurement to see which ones
    // already have data for this Timepoint, if we find one that
    // doesn't have data, we will stop there and use that as the
    // current Measurement
    measurements.every(function(measurement) {
        // If this measurement has no data for this Timepoint,
        // use this as the current Measurement
        if (!measurement.timepoints[timepointId]) {
            lesionNumberCounter = measurement.lesionNumber;
            return false;
        }

        lesionNumberCounter++;
        return true;
    });
    return lesionNumberCounter;
}

/**
 * If the current Lesion Number already exists
 * for any other timepoint, returns lesion locationUID
 * @param lesionData
 * @returns {*}
 */
function lesionNumberExists(lesionData) {
    var measurement = Measurements.findOne({
        lesionNumber: lesionData.lesionNumber,
        isTarget: lesionData.isTarget
    });

    if (!measurement) {
        return;
    }

    return measurement.locationId;
}

LesionManager = {
    updateLesionData: updateLesionData,
    getNewLesionNumber: getNewLesionNumber,
    lesionNumberExists: lesionNumberExists
};
