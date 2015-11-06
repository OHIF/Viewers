Measurements = new Meteor.Collection(null);
Timepoints = new Meteor.Collection(null);

// Activate selected lesions when lesion table row is clicked
function updateLesions(e) {
    // lesionNumber of measurement = id of row
    var lesionNumber = parseInt($(e.currentTarget).attr("id"), 10);

    // Find data for specific lesion
    var measurementData = Measurements.find({
        lesionNumber: lesionNumber
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
                lesionNumber: lesionNumber,
                imageId: timepointObject.imageId
            },
            type: "active"
        };

        if (timepointObject.longestDiameter === "") {
            eventData.type = "inactive";
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