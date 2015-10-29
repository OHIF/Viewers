Measurements = new Meteor.Collection(null);
TimepointNames = new Meteor.Collection(null);

Template.lesionTable.helpers({
    'measurement': function() {
        var contentId = Session.get("activeContentId");
        console.log(Measurements.find({contentId: contentId}));
        return Measurements.find({contentId: contentId});
    },
    'timepointNames': function() {
        var contentId = Session.get("activeContentId");
        return Template.instance().timepointNamesDictionary.get(contentId);
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

    // TODO: Create seperate method
    var cols = Template.instance().data.viewportColumns.curValue;
    var rows = Template.instance().data.viewportRows.curValue;

    var totalViewports = cols * rows;

    var contentId = Session.get('activeContentId');
    for(var i=0; i< totalViewports;  i++) {
        var timepointNamesArray =  [];
        if(Template.instance().timepointNamesDictionary.get(contentId) != undefined) {
            timepointNamesArray = Template.instance().timepointNamesDictionary.get(contentId);
        }
        var timepointID = contentId.toString()+ i.toString();
        var timepointName = "Baseline";
        if(i > 0) {
            timepointName = "Follow Up "+i;
        }
        var timepointObject = {id: timepointID, name: timepointName};
        timepointNamesArray.push(timepointObject);
        Template.instance().timepointNamesDictionary.set(contentId, timepointNamesArray);
    }

});

Template.lesionTable.onCreated(function() {
    this.timepointNamesDictionary = new ReactiveDict();
});
