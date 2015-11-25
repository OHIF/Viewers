var measurementManagerDAL = (function() {
    PatientLocations = new Meteor.Collection(null);

    function getLocationName(id) {
        var locationObject = PatientLocations.findOne(id);
        return locationObject.location || "";
    }

    // Add timepoint data to Measurements collection
    function addTimepointData(lesionData) {
        var timepoints = Timepoints.find().fetch();

        var timepointsObject = {};

        for (var i = 0; i < timepoints.length; i++) {
            var timepointId = timepoints[i].timepointID;
            var lesionTimepointId = lesionData.timepointID;

            var timepointObject;
            if (timepointId === lesionTimepointId) {
                // Add real measurement
                timepointObject = {
                    longestDiameter: lesionData.measurementText,
                    imageId: lesionData.imageId,
                    seriesInstanceUid: lesionData.seriesInstanceUid,
                    studyInstanceUid: lesionData.studyInstanceUid,
                    handles: lesionData.handles
                };
            } else {
                // Add null measurement
                timepointObject = {
                    longestDiameter: "",
                    imageId: "",
                    seriesInstanceUid: "",
                    studyInstanceUid: "",
                    handles: undefined
                };
            }
            timepointsObject[timepointId] = timepointObject;
        }

        var lesionDataObject = lesionData;

        lesionDataObject.patientId = timepoints[0].patientId;
        lesionDataObject.location = getLocationName(lesionData.locationUID);
        lesionDataObject.timepoints = timepointsObject;

        // Is there a use for this?
        lesionDataObject.number =  Measurements.find().count() + 1;

        // TODO=Fix this workaround to prevent the observe hook from adding another set of toolData
        lesionDataObject.toolDataInsertedManually = true;

        Measurements.insert(lesionDataObject);
    }

    // Update timepoint data in Measurements collection
    function updateTimepointData(lesionData) {
        // Find the specific lesion to be updated
        var measurement = Measurements.findOne({
            lesionNumber: lesionData.lesionNumber,
            isTarget: lesionData.isTarget
        });

        // If no such lesion exists, stop here
        if (!measurement) {
            return;
        }

        // Update this specific lesion at the given timepoint
        var timepointID = lesionData.timepointID;

        // Update timepoints from lesion data
        var timepoints = measurement.timepoints;
        if (timepoints[timepointID] === undefined) {
           timepoints[timepointID] = {};
        }

        timepoints[timepointID].longestDiameter = lesionData.measurementText;
        timepoints[timepointID].imageId = lesionData.imageId;
        timepoints[timepointID].seriesInstanceUid = lesionData.seriesInstanceUid;
        timepoints[timepointID].studyInstanceUid = lesionData.studyInstanceUid;
        timepoints[timepointID].handles = lesionData.handles;


        Measurements.update(measurement._id, {
            $set: {
                timepoints: timepoints
            }
        });
    }

    // Check timepointData is found in Measurements collection
    function hasTimepointData(lesionData) {
        var timepointData = Measurements.findOne({
            lesionNumber: lesionData.lesionNumber,
            isTarget: lesionData.isTarget
        });

        if (timepointData) {
            return true;
        }
        return false;
    }

    // Adds new timepoint item to timepoints array
    function addLesionData(lesionData) {
        if (hasTimepointData(lesionData)) {
            // Update data
            updateTimepointData(lesionData);
        } else {
            // Insert data
            addTimepointData(lesionData);
        }
    }

    // Returns new lesion number according to timepointID
    function getNewLesionNumber(timepointID, isTarget) {
        // Get all current lesion measurements
        var measurements = Measurements.find({isTarget: isTarget},{sort: {lesionNumber: 1}}).fetch();

        // If no measurements exist yet, start at 1
        if (!measurements.length) {
            return 1;
        }

        // If measurements exist, find the last lesion number
        // from the given timepoint
        var lesionNumberCounter = 0;
        for (var i = 0; i < measurements.length; i++) {
            var measurement = measurements[i];
            var timepoints = measurement.timepoints;

            if (!timepoints[timepointID]) {
                // Find lesion number for this timepointID
                return measurement.lesionNumber
            }

            if (timepoints[timepointID].longestDiameter === '') {
                return measurement.lesionNumber;
            } else {
                lesionNumberCounter = lesionNumberCounter + 1;
            }
        }
        return lesionNumberCounter + 1;
    }

    // If lesion number is added for any timepoint, returns lesion locationUID
    function lesionNumberExists(lesionData) {
        if (!hasTimepointData(lesionData)) {
            return;
        }

        var measurement = Measurements.findOne({
            lesionNumber: lesionData.lesionNumber,
            isTarget: lesionData.isTarget
        });

        return measurement.locationUID;
    }

    return {
        addLesionData: addLesionData,
        getNewLesionNumber: getNewLesionNumber,
        lesionNumberExists: lesionNumberExists,
        updateTimepointData: updateTimepointData,
        getLocationName: getLocationName
    };
})();