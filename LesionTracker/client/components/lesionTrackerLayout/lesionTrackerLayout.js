Template.layoutLesionTracker.events({
    'click #logoutButton': function() {
        Meteor.logout(function(){
            Router.go('/entrySignIn');
        });
    },
    'click #changePassword': function() {
        Router.go('/changePassword');
    }
});

Template.layoutLesionTracker.helpers({
    'fullName': function() {
        return Meteor.user().profile.fullName;
    }
});

Template.layoutLesionTracker.onCreated(function() {
    // Show countdown dialog
    var handle;
    $(document).on('TriggerOpenTimeoutCountdownDialog', function (e, leftTime) {
        // TODO: Show modal dialog
        handle = setInterval(function() {
            leftTime --;
            // Set countdownDialogLeftTime session
            Session.set("countdownDialogLeftTime", leftTime);
            // Show dialog
            if ($("#timeoutCountdownDialog").css("display") == "none") {
                $("#timeoutCountdownDialog").css("display", "block");
            }
        }, 1000);

    });

    $(document).on('TriggerCloseTimeoutCountdownDialog', function (e) {
        $("#timeoutCountdownDialog").css("display", "none");
        if (handle) {
            clearInterval(handle);
            // Close the dialog
            $("#timeoutCountdownDialog").css("display", "none");

        }
    });
});