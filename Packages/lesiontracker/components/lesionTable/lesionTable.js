Measurements = new Meteor.Collection(null);
TabsTimepoints = new Meteor.Collection(null);

Template.lesionTable.helpers({
    'measurement': function() {
        var contentId = this.contentId;
        return Measurements.find({contentId: contentId});
    },
    'tabTimepoints': function() {
        var contentId = this.contentId;
        return TabsTimepoints.find({contentId: contentId});
    },
    'lesionData': function() {
        var array = [];
        var lesions = this.lesionData;
        Object.keys(lesions).forEach(function(key) {
            array.push(lesions[key]);
        });
        return array;
    }
});

Template.lesionTable.onRendered(function() {

    var contentId = this.data.contentId;
    var viewportColumns = ViewerData[contentId].viewportColumns;
    var viewportRows = ViewerData[contentId].viewportRows;

    var totalViewports = viewportColumns * viewportRows;
    
    var timepointsArray = [];
    for(var i=0; i< totalViewports;  i++) {
        var timepointID = contentId.toString() + i.toString();
        var timepointName = "Baseline";
        if (i > 0) {
            timepointName = "Current"; //"Follow Up "+i;
        }
        var timepointObject = {timepointID: timepointID, timepointName: timepointName};
        timepointsArray.push(timepointObject);

    }

    // Prevent duplicate data when onRendered is called
    var tabTimepoint = TabsTimepoints.find({contentId: contentId}).fetch();
    if (tabTimepoint !== undefined && tabTimepoint.length > 0) {
        // Update timepoints
        TabsTimepoints.update(
            { contentId: contentId},
            {
                $set: {
                    timepoints: timepointsArray
                }
            }, {multi: true}
        );
    } else {

        // Insert new timepoints array
        TabsTimepoints.insert({contentId: contentId, timepoints: timepointsArray});
    }

});

Template.lesionTable.events({
    'click table#tblLesion tbody tr': function(e, template) {

        // lesionNumber of measurement = id of row
        var lesionNumber = parseInt($(e.currentTarget).attr("id"));
        // TODO: Get all imageViewport elements in content
        var contentId = Session.get("activeContentId");
        var measurementData = Measurements.find({contentId:contentId,"lesionData.lesionNumber":lesionNumber}).fetch();
        var lesionData = measurementData[0].lesionData;
        console.log(lesionData);
        var imageViewportElements = $("#"+contentId).find(".imageViewerViewport");
        for( var i=0; i< imageViewportElements.length; i++) {
            var imageViewportElement = imageViewportElements[i];
            var eventObject = {
                enabledElement: cornerstone.getEnabledElement(imageViewportElement),
                lesionData: {lesionNumber: lesionNumber, imageId: lesionData.imageId},
                type: "active"
            };
            $(imageViewportElement).trigger("LesionToolModified", eventObject);

        }

    }
});

