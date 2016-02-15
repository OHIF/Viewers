Session.set('defaultSignInMessage', 'Tumor tracking in your browser.');

Template.lesionTrackerLayout.events({
    'click #logoutButton': function() {
        Meteor.logout(function() {
            Router.go('/entrySignIn');
        });
    },
    'click #changePassword': function() {
        Router.go('/changePassword');
    }
});

Template.lesionTrackerLayout.helpers({
    fullName: function() {
        return Meteor.user().profile.fullName;
    }
});

Template.lesionTrackerLayout.onCreated(function() {
    // Show countdown dialog
    var handle;
    $(document).on('TriggerOpenTimeoutCountdownDialog', function(e, leftTime) {
        // TODO: Show modal dialog
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

        }
    });
});
