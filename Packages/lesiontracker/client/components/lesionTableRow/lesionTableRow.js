Template.lesionTableRow.helpers({
    'timepoints': function() {
        return Timepoints.find({}, {sort: {timepointName: 1}});
    }
});
