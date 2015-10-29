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

    function getTimepointsOfTab (){
        var contentId = getContentId();
        var tabData = TabsTimepoints.find({contentId: contentId}).fetch();
        return tabData[0].timepoints;
    }

    // Adds new timepoint item to tiemepoints array
    function addLesionData (lesionData) {

        var contentId = getContentId();
        var timepointID = lesionData.timepointID;
        var tabMeasurements = Measurements.find({contentId: contentId, "lesionData.lesionNumber": lesionData.lesionNumber}).fetch();
        var tabMeasurementsData = tabMeasurements[0];
        if (tabMeasurements != undefined && tabMeasurements.length > 0) {

            // Update timepoint
            var timepointArr = tabMeasurementsData.lesionData.timepoints;
            for(var i=0; i< timepointArr.length; i++) {
                var timepoint = timepointArr[i];
                if(timepoint[timepointID] != undefined) {
                    timepoint[timepointID].longestDiameter = lesionData.measurementText;
                }
            }
            Measurements.update(
                { contentId: contentId, "lesionData.lesionNumber": lesionData.lesionNumber},
                {
                    $set: {
                        "lesionData.timepoints": timepointArr
                    }
                }, {multi: true}
            );

        } else {

            // Add new measurement data
            var timepointsOfTab = getTimepointsOfTab();
            var timepointsArr = [];
            for(var i=0; i< timepointsOfTab.length; i++) {
                var timepointId = timepointsOfTab[i].timepointID;
                var lesionTimepointId = lesionData.timepointID;

                if (timepointId === lesionTimepointId) {
                    // Add real mesurement
                    var timepointObject =  {};
                    timepointObject[timepointId] = {longestDiameter: lesionData.measurementText};
                    timepointsArr.push(timepointObject);
                } else {
                    // Add null measurement
                    var timepointObject =  {};
                    timepointObject[timepointId] = {longestDiameter: ""};
                    timepointsArr.push(timepointObject);

                }
            }

            var lesionDataCollectionObject = {
                lesionNumber: lesionData.lesionNumber,
                isTarget: true,
                location: getLocationName(lesionData.locationUID),
                timepoints: timepointsArr
            };

            Measurements.insert({contentId: contentId, lesionData: lesionDataCollectionObject});
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