Template.lesionTableHeaderRow.helpers({
    numberOfLesions: function() {
        var instance = Template.instance();
        return instance.data.measurements.count();
    },
    maxNumLesions: function() {
        var instance = Template.instance();
        var lesionType = instance.id;

        // TODO: Check what we are annotating
        var timepointType = 'baseline';

        // Identify which Trial Conformance Criteria are currently being used
        // Note that there may be more than one.
        var criteriaTypes = TrialCriteriaTypes.find({
            selected: true
        }).map(function(criteria) {
            return criteria.id;
        });

        var currentConstraints = getTrialCriteriaConstraints(criteriaTypes);
        if (!currentConstraints) {
            // For testing
            return 10;
        }

        var criteria = currentConstraints[timepointType][lesionType];

        return criteria.group.totalNumberOfLesions;
    }
});

Template.lesionTableHeaderRow.events({
    'click .add': function() {
        console.log('Add was clicked');
        // TODO: Set active tool to new type
    }
});