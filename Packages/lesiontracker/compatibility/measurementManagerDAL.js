var measurementManagerDAL =  (function () {
    var trialPatientLocations = [];
    var timepoints = [];

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

    function getContentId () {
        return Session.get("activeContentId");
    }

    function getTimepointsOfTab (){
        var contentId = getContentId();
        var tabData = TabsTimepoints.find({contentId: contentId}).fetch();
        return tabData[0].timepoints;
    }

    // Add timepoint data to Measurements collection
    function addTimepointData(lesionData) {

        var contentId = getContentId();
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
            imageId: lesionData.imageId,
            locationUID: lesionData.locationUID,
            location: getLocationName(lesionData.locationUID),
            timepoints: timepointsArr
        };

        Measurements.insert({contentId: contentId, lesionData: lesionDataCollectionObject});
    }

    // Update timepoint data in Measurements collection
    function updateTimepointData (lesionData) {
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

        }
    }

    // Check timepointData is found in Measurements collection
    function timepointDataIsFound (lesionNumber) {
        var contentId = getContentId();
        var timepointData = Measurements.findOne({contentId: contentId, "lesionData.lesionNumber": lesionNumber});
        if (timepointData != undefined) {
            return true;
        } else {
            return false;
        }
    }

    // Adds new timepoint item to tiemepoints array
    function addLesionData (lesionData) {
        if(timepointDataIsFound(lesionData)) {
            // Update data
            updateTimepointData(lesionData);
        } else{
            // Insert data
            addTimepointData(lesionData);
        }

        // TODO: This code block will be removed
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

    }

    // Returns new lesion number according to timepointID
    function getNewLesionNumber (timepointID) {
        var contentId = getContentId();
        var lesionNumberCounter = 0;
        var timepointsData = Measurements.find({contentId: contentId}).fetch();
        if(timepointsData.length > 0) {
            for(var i=0; i< timepointsData.length; i++) {
                var timepointData = timepointsData[i];
                var timepoints = timepointData.lesionData.timepoints;
                for(var j=0; j< timepoints.length; j++) {
                    var timepoint = timepoints[j];
                    var key = Object.keys(timepoint);
                    if(key == timepointID) {
                        if (timepoint[key].longestDiameter === "") {
                            return timepointData.lesionData.lesionNumber;

                        } else {
                            lesionNumberCounter = lesionNumberCounter + 1;
                        }
                    }
                }
            }
            console.log(lesionNumberCounter + 1);

            return lesionNumberCounter + 1;
        }

        return 1;
    }

    // If lesion number is added for any timepoint, returns lesion locationUID
    function isLesionNumberAdded (lesionNumber) {
        if (timepointDataIsFound(lesionNumber)){
            var contentId = getContentId();
            var timepointData = Measurements.find({contentId: contentId, "lesionData.lesionNumber": lesionNumber}).fetch();
            return timepointData[0].lesionData.locationUID;

        }
        return null

    }

    return {
        addNewLocation: addPatientLocation,
        getLocations: getPatientLocations,
        addLesionData: addLesionData,
        getLesionNumber: getNewLesionNumber,
        isLesionNumberAdded: isLesionNumberAdded,
        getTimepoints: getTimepoints,
        updateTimepointData: updateTimepointData

    };
})();