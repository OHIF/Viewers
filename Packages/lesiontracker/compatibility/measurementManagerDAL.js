var measurementManagerDAL =  (function () {
    var trialPatientLocations = [];
    var timepoints = [];

    // timepointID =  tabId + activeViewportIndex
    /*timepoints = [
        {
            timepointID: "tp0",
            rois: [
                {
                    UID: "345",
                    number: 1,
                    measurement: "22.34",
                    locationUID: 12345
                },
                {
                    UID: "245",
                    number: 2,
                    measurement: "22.34",
                    locationUID: 1745
                }
            ]
        },
        {
            timepointID: "tp1",
            rois: [
                {
                    UID: "243",
                    number: 1,
                    measurement: "22.34",
                    locationUID: 12345
                }
            ]
        },
        {
            timepointID: "tp2",
            rois: [
                {
                    UID: "253",
                    number: 1,
                    measurement: "0.34",
                    locationUID: 12345
                }
            ]
        }
    ];
    */

    // Returns trialPatientLocations array
    function getPatientLocations () {
        return trialPatientLocations;
    }

    function getLocationName (locationUID) {
        for(var i = 0; i< trialPatientLocations.length; i++) {
            var locationObject = trialPatientLocations[i];
            if(locationObject.uid === locationUID) {
                return locationObject.location.location;
            }
        }

        return "";
    }

    function getTimepoints() {
        return timepoints;
    }

    // Adds new location to trialPatientLocations array
    function addPatientLocation (location) {
        var contentId = getContentId();
        var locationUID = uuid.v4();
        var locationObject = {contentId: contentId, uid: locationUID, location: location};
        trialPatientLocations.push(locationObject);

        return locationUID;
    }


    // Insert Measurements Collection
    function insertDataToMeasurementCollection (lesionData) {


    }

    function getContentId () {
        return Session.get("activeContentId");
    }

    // Adds new timepoint item to tiemepoints array
    function addLesionData (lesionData) {

        // TODO: if find lesionNumber, add
        // TODO: Unless create new object
        var contentId = getContentId();
        var timepointID = lesionData.timepointID;
        var tabMeasurements = Measurements.find({contentId: contentId}).fetch();
        var existingMeasurement;
        if(tabMeasurements != undefined && tabMeasurements.length > 0) {
            var tabLesionData = tabMeasurements.filter(function(item){return (item.lesionData.lesionNumber == lesionData.lesionNumber);} )[0];
            if(tabLesionData != undefined) {
                existingMeasurement = tabLesionData.lesionData;
            }
        }

        if (existingMeasurement != undefined) {

            var existingTimepoint = existingMeasurement.timepoints;
            existingTimepoint[timepointID] = {longestDiameter: lesionData.measurementText};

            Measurements.update(
                { contentId: contentId, "lesionData.lesionNumber": lesionData.lesionNumber},
                {
                    $set: {
                        "lesionData.timepoints": existingTimepoint
                    }
                }, {multi: true}
            );
            console.log(Measurements.find())

        } else {

            var timepointArr = {};
            timepointArr[timepointID] = {longestDiameter: lesionData.measurementText};
            var lesionDataCollectionObject = {
                lesionNumber: lesionData.lesionNumber,
                isTarget: true,
                location: getLocationName(lesionData.locationUID),
                timepoints: timepointArr
            };

            Measurements.insert({contentId: contentId, lesionData: lesionDataCollectionObject});
            console.log(Measurements.find());

        }

        // Populate timepoints array
        var roi = {
            uid: lesionData.uid,
            number: lesionData.lesionNumber,
            measurement: lesionData.measurementText,
            locationUID: lesionData.locationUID
        };
        if (timepoints.length) {
            timepoints.forEach(function(timepoint) {
                if(timepoint.timepointID === timepointID) {
                    timepoint.rois.push(roi);
                }
            });
        } else {
            timepoints.push({timepointID: timepointID, rois: [roi]});
        }

        insertDataToMeasurementCollection(lesionData);

    }

    // Returns new lesion number according to timepointID
    function getNewLesionNumber (timepointID) {
        // Check timepoint is in timepoints array
        for (var i=0; i< timepoints.length; i++) {
            var timepoint = timepoints[i];
            if(timepoint.timepointID === timepointID) {
                return timepoint.rois.length + 1;
            }
        }

        // Add new time point
        timepoints.push({timepointID: timepointID, rois: []});

        return 1;
    }

    // If lesion number is added for any timepoint, returns lesion locationUID
    function isLesionNumberAdded (lesionNumber) {

        for (var i=0; i< timepoints.length; i++) {
            var timepoint = timepoints[i];
            var rois = timepoint.rois;

            for(var j=0; j<rois.length; j++) {
                var roi = rois[j];
                if (roi.number === lesionNumber) {
                    return roi.locationUID;
                }
            }
        }

        return null;
    }

    // Adds lesion data to Measurements collection
    function addLesionToMeasurementsCollection (lesionData){
        Measurements.insert(lesionData);
    }

    return {
        addNewLocation: addPatientLocation,
        getLocations: getPatientLocations,
        addLesionData: addLesionData,
        getLesionNumber: getNewLesionNumber,
        isLesionNumberAdded: isLesionNumberAdded,
        getTimepoints: getTimepoints

    };
})();