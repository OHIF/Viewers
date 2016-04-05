Session.set('defaultSignInMessage', 'Tumor tracking in your browser.');
Template.lesionTrackerLayout.onCreated(function() {
    // Show countdown dialog
    var handle;
    $(document).on('TriggerOpenTimeoutCountdownDialog', function(e, leftTime) {
        // Show modal dialog
        handle = setInterval(function() {
            leftTime--;
            // Set countdownDialogLeftTime session
            Session.set('countdownDialogLeftTime', leftTime);

            // Show dialog
            var dialog = $('#timeoutCountdownDialog');
            if (dialog.css('display') === 'none') {
                dialog.css('display', 'block');
            }
        }, 1000);

    });

    $(document).on('TriggerCloseTimeoutCountdownDialog', function(e) {
        var dialog = $('#timeoutCountdownDialog');
        dialog.css('display', 'none');
        if (handle) {
            clearInterval(handle);
            // Close the dialog
            dialog.css('display', 'none');
            
            // Remove reviewers info for the user
            Meteor.call('removeUserFromReviewers', Meteor.userId());
        }
    });
});

Template.lesionTrackerLayout.onRendered(function() {
    var oldUserId = undefined;
    var userName;
    var lastLoginModalInterval;

    Tracker.autorun(function() {
        // Hook login/logout
        var newUserId = Meteor.userId();
        if (oldUserId === null && newUserId) {
            Session.set('showLastLoginModal', true);
            userName = Meteor.user().profile.fullName;
            // Log
            HipaaLogger.logEvent({
                eventType: 'init',
                userId: Meteor.userId(),
                userName: userName
            });
        } else if (newUserId === null && oldUserId) {
            // Set showLastLoginModal as null
            Session.set('showLastLoginModal', null);
            // Destroy interval for last login modal
            Meteor.clearInterval(lastLoginModalInterval);
            console.log('The user logged out');

            // Log
            // TODO: eventype is not defined for logout in hipaa-audit-log
            /*HipaaLogger.logEvent({
                eventType: 'logout',
                userId: oldUserId,
                userName: userName
            });*/

            // Remove the user from Reviewers
            Meteor.call('removeUserFromReviewers', oldUserId);
        }
        oldUserId = Meteor.userId();

        // Trigger last login date popup
        if (Session.get('showLastLoginModal')) {
            Modal.show('lastLoginModal');
            lastLoginModalInterval = Meteor.setInterval( function() {
                Modal.hide('lastLoginModal');
                Session.set("showLastLoginModal", null);
            }, 3000);
            return true;
        }
    });
});


