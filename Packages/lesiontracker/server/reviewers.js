Meteor.methods({
    setReviewer: function (studyInstanceUid) {
        if (!studyInstanceUid) {
            return;
        }
        var study = Studies.findOne({
            studyInstanceUid: studyInstanceUid
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

        var reviewerTimepoint = Reviewers.findOne({timepointId: timepoint.timepointId});
        var user = Meteor.users.findOne(Meteor.userId());
        if (reviewerTimepoint) {
            if (reviewerTimepoint.reviewers) {

                // Check whether the user exists
                var isReviewerFound = reviewerTimepoint.reviewers.filter(function ( reviewer ) {
                    return reviewer.userId === user._id;
                })[0];

                // Return if user eixistes for related timepoint
                if (isReviewerFound) {
                    return;
                }
                var existedReviewers = reviewerTimepoint.reviewers;
                existedReviewers.push({userId: user._id, userName: user.profile.fullName});

                // Update reviewers array after pushing the user
                Reviewers.update(reviewerTimepoint._id, {$set: {reviewers: existedReviewers}});

            } else {
                Reviewers.update(reviewerTimepoint._id, {$set: {reviewers: [{userId: user._id, userName: user.profile.fullName}]}});
            }
        } else {
            Reviewers.insert({timepointId: timepoint.timepointId, reviewers: [{userId: user._id, userName: user.profile.fullName}]});
        }

        // Log
        var hipaaEvent = {
            eventType: 'modify',
            userId: Meteor.userId(),
            userName: Meteor.user().profile.fullName,
            collectionName: "Measurements",
            recordId: study.studyInstanceUid,
            patientId: study.patientId,
            patientName: study.patientName
        };
        HipaaLogger.logEvent(hipaaEvent);
    },

    removeReviewer: function (timepointId) {
        if (!timepointId) {
            return;
        }
        var reviewerTimepoint = Reviewers.findOne({timepointId: timepointId});
        if (!reviewerTimepoint || !reviewerTimepoint.reviewers) {
            return;
        }

        // Initalize a new array without the current user
        var reviewers = reviewerTimepoint.reviewers.filter(function ( reviewer ) {
            return reviewer.userId !== Meteor.userId();
        });
        Reviewers.update(reviewerTimepoint._id, {$set: {reviewers: reviewers}});
    },

    removeUserFromReviewers: function(userId) {
        if (!userId) {
            return;
        }
        Reviewers.find().map(function (timepoint) {
            Reviewers.update({_id: timepoint._id}, {"$pull": {"reviewers": {"userId": userId}}});
        });
    },

    getPriorLoginDate: function() {
        return Meteor.users.findOne({
            _id: Meteor.userId()
        }, {
            fields: {
                priorLoginDate: 1
            }
        }).priorLoginDate;
    }
});

