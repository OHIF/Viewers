Measurements = new Meteor.Collection(null);
TabsTimepoints = new Meteor.Collection(null);

Template.lesionTable.helpers({
    'measurement': function() {
        var contentId = Session.get("activeContentId");
        return Measurements.find({contentId: contentId});
    },
    'tabTimepoints': function() {
        var contentId = Session.get("activeContentId");
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

    var cols = Template.instance().data.viewportColumns.curValue;
    var rows = Template.instance().data.viewportRows.curValue;

    var totalViewports = cols * rows;

    var contentId = Session.get('activeContentId');
    var timepointsArray = [];
    for(var i=0; i< totalViewports;  i++) {

        var timepointID = contentId.toString()+ i.toString();
        var timepointName = "Baseline";
        if(i > 0) {
            timepointName = "Follow Up "+i;
        }
        var timepointObject = {timepointID: timepointID, timepointName: timepointName};
        timepointsArray.push(timepointObject);

    }

    // Prevent duplicate data when onRendered is called
    var tabTimepoint = TabsTimepoints.find({contentId: contentId}).fetch();
    if (tabTimepoint != undefined && tabTimepoint.length > 0) {
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
