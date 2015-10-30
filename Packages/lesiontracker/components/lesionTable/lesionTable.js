Measurements = new Meteor.Collection(null);
TabsTimepoints = new Meteor.Collection(null);

Template.lesionTable.helpers({
    'measurement': function() {
<<<<<<< HEAD
        var contentId = Session.get("activeContentId");
        return Measurements.find({contentId: contentId});
    },
    'tabTimepoints': function() {
        var contentId = Session.get("activeContentId");
        return TabsTimepoints.find({contentId: contentId});
=======
        var contentId = this.contentId;
        console.log(Measurements.find({contentId: contentId}));
        return Measurements.find({contentId: contentId});
    },
    'timepointNames': function() {
        var contentId = this.contentId;
        return Template.instance().timepointNamesDictionary.get(contentId);
>>>>>>> Updates to improve reactivity, session storage, logging
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
    
    for(var i=0; i< totalViewports;  i++) {
        var timepointID = contentId.toString() + i.toString();
        var timepointName = "Baseline";
        if (i > 0) {
            timepointName = "Follow Up "+i;
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

Template.lesionTable.onCreated(function() {
    this.timepointNamesDictionary = new ReactiveDict();
});
