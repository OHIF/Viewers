Template.lesionTableHeaderRow.helpers({
    numberOfLesions: function() {
        var instance = Template.instance();
        return instance.data.measurements.count();
    }
});

Template.lesionTableHeaderRow.events({
    'click .add': function() {
        console.log('Add was clicked');
        // TODO: Set active tool to new type
    }
});