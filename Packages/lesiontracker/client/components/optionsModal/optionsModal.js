TrialCriteriaTypes = new Meteor.Collection(null);

TrialCriteriaTypes.insert({
    id: 'RECIST',
    name: 'RECIST 1.1',
    descriptionTemplate: 'recistDescription',
    selected: true
});

TrialCriteriaTypes.insert({
    id: 'irRC',
    name: 'irRC',
    descriptionTemplate: 'irRCDescription',
    selected: false
});

Template.optionsModal.helpers({
    trialCriteriaTypes: function() {
        return TrialCriteriaTypes.find();
    }
});

Template.optionsModal.events({
    /**
     * When the trial criteria radio buttons are changed, change the
     * trial assessment criteria for the Lesion Tracker
     *
     * @param e The 'change' event on the selected radio button
     */
    'change input.trialCriteria': function(e) {
        var isChecked = e.currentTarget.checked;

        // Set "Selected" to false for the entire collection
        // TODO: Remove this when we allow multiple criteria
        TrialCriteriaTypes.update({}, {
            $set: {
                selected: false
            }
        }, {
            multi: true
        });

        // Set the current Criteria in the collection to selected
        TrialCriteriaTypes.update(this._id, {
            $set: {
                selected: isChecked
            }
        });
    },
    /**
     * When the Clear Study/Timepoint Associations button is clicked, we
     * send a call to the server to erase all entries in the Timepoints Collection.
     */
    'click a.clearAllStudyTimepointAssociations': function() {
        Meteor.call('clearAllTimepoints', function(error) {
            if (error) {
                log.warn(error);
            }
        });
    }
});
