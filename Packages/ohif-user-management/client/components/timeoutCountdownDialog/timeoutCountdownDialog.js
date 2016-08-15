Template.timeoutCountdownDialog.helpers({
    timeLeft: function() {
        var timeLeft = Session.get('countdownDialogLeftTime');
        var suffix = timeLeft > 1 ? 'seconds': 'second';
        return timeLeft + suffix;
    }
});

Template.timeoutCountdownDialog.onRendered(function() {
    // Show countdown dialog
    var timeoutCountdownInterval;
    $(document).on('TriggerOpenTimeoutCountdownDialog', function(e, leftTime) {
        // Show modal dialog
        timeoutCountdownInterval = setInterval(function() {
            // Set countdownDialogLeftTime session
            Session.set('countdownDialogLeftTime', --leftTime);

            var dialog = $('#timeoutCountdownDialog');

            // Show dialog
            dialog.css('display', 'block');
        }, 1000);

    });

    $(document).on('TriggerCloseTimeoutCountdownDialog', function() {
        var dialog = $('#timeoutCountdownDialog');

        // Close the dialog
        dialog.css('display', 'none');

        if (timeoutCountdownInterval) {
            clearInterval(timeoutCountdownInterval);

            // Remove reviewer info for the user
            Meteor.call('removeUserFromReviewers', Meteor.userId());
        }
    });
});
