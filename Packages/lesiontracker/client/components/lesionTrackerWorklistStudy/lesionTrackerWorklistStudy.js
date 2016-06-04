// Use Aldeed's meteor-template-extension package to replace the
// default WorklistStudy template.
// See https://github.com/aldeed/meteor-template-extension
var defaultTemplate = 'worklistStudy';
Template.lesionTrackerWorklistStudy.replaces(defaultTemplate);

// Add the TimepointName helper to the default template. The
// HTML of this template is replaced with that of lesionTrackerWorklistStudy
Template[defaultTemplate].helpers({
    timepointName: function() {
        var data = this;
        var study = Studies.findOne({
            studyInstanceUid: data.studyInstanceUid
        });

        if (!study) {
            return;
        }

        var timepoint = Timepoints.findOne({
            timepointId: study.timepointId
        });

        if (!timepoint) {
            return;
        }

        return getTimepointName(timepoint);
    },
    reviewerTip: function() {
        var data = this;
        var study = Studies.findOne({
            studyInstanceUid: data.studyInstanceUid
        });

        if (!study) {
            return;
        }

        var timepoint = Timepoints.findOne({
            timepointId: study.timepointId
        });

        if (!timepoint) {
            return;
        }

        var timepointReviewers = Reviewers.findOne({
            timepointId: timepoint.timepointId
        });
        
        if (!timepointReviewers) {
            return;
        }

        return getReviewerTipText(timepointReviewers.reviewers);
    }
});

function getReviewerTipText(reviewers) {
    if (!reviewers || reviewers.length === 0) {
        return;
    }

    var newReviewers = reviewers.filter(function(reviewer) {
        return reviewer.userId !== Meteor.userId();
    });

    if (newReviewers.length === 0) {
        return;
    }

    var tipText = 'The study is being reviewed by ';
    newReviewers.forEach(function(reviewer, index) {
        if (reviewer.userId === Meteor.userId()) {
            return;
        }

        if (index > 0) {
            tipText += ',';
        }

        tipText += reviewer.userName;

    });

    return tipText;
}

// Observe changes on WorklistTabs
// remove the current user from Reviewers if tab is removed
WorklistTabs.find().observe({
    removed: function(tab) {
        var contentId = tab.contentid;
        var timepointIds = ViewerData[contentId].timepointIds;
        if (timepointIds && timepointIds.length > 0) {
            timepointIds.forEach(function(timepointId) {
                // Remove the current user from Reviewers
                Meteor.call('removeReviewer', timepointId);
            });
        }
    }
});
