// Use Aldeed's meteor-template-extension package to replace the
// default StudyListStudy template.
// See https://github.com/aldeed/meteor-template-extension
const defaultTemplate = 'studylistStudy';
Template.longitudinalStudyListStudy.replaces(defaultTemplate);

// Add the TimepointName helper to the default template. The
// HTML of this template is replaced with that of longitudinalStudyListStudy
Template[defaultTemplate].helpers({
    timepointName: function() {
        const instance = Template.instance();
        const timepointApi = StudyList.timepointApi;
        if (!timepointApi) {
            return;
        }

        const timepoint = timepointApi.study(instance.data.studyInstanceUid)[0];
        if (!timepoint) {
            return;
        }

        return timepointApi.name(timepoint);
    },
    reviewerTip: function() {
        const instance = Template.instance();
        const timepointApi = StudyList.timepointApi;
        if (!timepointApi) {
            return;
        }

        const timepoint = timepointApi.study(instance.data.studyInstanceUid);
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
    if (!reviewers || !reviewers.length) {
        return;
    }

    var newReviewers = reviewers.filter(function(reviewer) {
        return reviewer.userId !== Meteor.userId();
    });

    if (!newReviewers.length) {
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
