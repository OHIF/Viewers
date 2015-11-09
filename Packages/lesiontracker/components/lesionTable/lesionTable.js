Measurements = new Meteor.Collection(null);
Timepoints = new Meteor.Collection(null);

// When nonTarget lesion is added to image, insert data to lesion table
function nonTargetToolAdded(e, eventData, lesionData) {
    lesionData.timepointID = $(e.currentTarget).data('timepointID');

    var locationUID = measurementManagerDAL.isLesionNumberAdded(lesionData);
    if (locationUID) {
        // location is selected and disable select location in dialog
        lesionData.locationUID = locationUID;
        var locationName = measurementManagerDAL.getLocationName(locationUID);
        var locationIndex;
        $("#selectNonTargetLesionLocation option").each(function()
        {
            if ($(this).text() === locationName) {
                locationIndex = $(this).index();
                return;
            }
        });
        $("#selectNonTargetLesionLocation option").eq(locationIndex).attr("selected", "selected");
       // $("#selectNonTargetLesionLocation").attr("disabled", "disabled");

    }

    // Save lesionData in Session to use after location and response are selected
    Session.set("nonTargetLesionData", lesionData);

    var dialogPointsOnPage = eventData.currentPoints.page;
    $("#modal-dialog-container-nonTargetLesion").css({
        "top": dialogPointsOnPage.y,
        "left": dialogPointsOnPage.x
    });

    $("#nonTargetLesionLocationDialog").modal("show");

}

// Activate selected lesions when lesion table row is clicked
function updateLesions(e) {
    // lesionNumber of measurement = id of row
    var lesionNumber = parseInt($(e.currentTarget).attr("id"), 10);
    var isTarget = $(e.currentTarget).find('td').eq(2).html().trim() === 'N'?false:true;

    // Find data for specific lesion
    var measurementData = Measurements.find({
        lesionNumber: lesionNumber,
        isTarget: isTarget
    }).fetch()[0];

    var timepoints = measurementData.timepoints;

    $(".imageViewerViewport").each(function(index, element) {
        // Get the timepointID related to the image viewer viewport
        // from the DOM itself. This will be changed later when a
        // real association between viewports and timepoints is created.
        var timepointID = $(element).data('timepointID');
        var timepointObject = timepoints[timepointID];

        // Defines event data
        var eventData = {
            enabledElement: cornerstone.getEnabledElement(element),
            lesionData: {
                isTarget: isTarget,
                lesionNumber: lesionNumber,
                imageId: timepointObject.imageId
            },
            type: "active"
        };

        if (timepointObject.longestDiameter === "") {
            eventData.type = "inactive";
        }

        if(!isTarget) {
            $(element).trigger("nonTargetToolModified", eventData);
        }
        $(element).trigger("LesionToolModified", eventData);

    });
}

Template.lesionTable.onRendered(function() {
    // For the moment we will associate the timepoint
    // with the viewport element by storing the timepointID
    // inside the element's DOM data. This is temporary.
    $(".imageViewerViewport").each(function(index, element) {
        var timepointID = uuid.v4();

        var timepointName = "Baseline";
        if (index > 0) {
            timepointName = "Current"; //"Follow Up "+i;
        }


        // FUTURE = On load series data into viewport, create a new timepoint
        // unless it already exists
        Timepoints.insert({
            timepointID: timepointID,
            timepointName: timepointName
        });

        $(element).data('timepointID', timepointID);

        // Listen NonTargetToolAdded Event
        $(element).on("NonTargetToolAdded", nonTargetToolAdded);
    });
});


Template.lesionTable.helpers({
    'measurement': function() {
        return Measurements.find();
    },
    'timepoints': function() {
        return Timepoints.find();
    }
});

Template.lesionTable.events({
    'click table#tblLesion tbody tr': function(e) {
        updateLesions(e);
    }
});