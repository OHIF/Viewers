Session.setDefault('TrialResponseAssessmentCriteria', 'RECIST');

Template.optionsModal.events({
    /**
     * When the trial criteria radio buttons are changed, change the
     * trial assessment criteria for the Lesion Tracker
     *
     * @param e The 'change' event on the selected radio button
     */
    'change input.trialCriteria': function(e) {
        // Get the Trial Criteria type that the selected radio button represents
        var radioButton = $(e.currentTarget);
        var criteriaType = radioButton.val();

        // Set this as the current Trial Response Assessment Criteria
        // TODO: Update when we have more trial-level support
        // (Currently this information is stored in Session, later this will change)
        Session.set('TrialResponseAssessmentCriteria', criteriaType);

        log.info('Trial Criteria changed to: ' + criteriaType);
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
