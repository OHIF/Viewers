Session.set('defaultSignInMessage', 'Tumor tracking in your browser.');

Template.lesionTrackerLayout.events({
    'click #logoutButton': function() {
        Meteor.logout(function() {
            Router.go('/entrySignIn');
        });
    },
    'click #worklist': function(e, template) {
        template.showWorklistMenu.set(false);
    },
    'click #audit': function(e, template) {
        template.showWorklistMenu.set(true);
    }
});

Template.lesionTrackerLayout.helpers({
    fullName: function() {
        return Meteor.user().profile.fullName;
    },

    showWorklistMenu: function() {
        return  Template.instance().showWorklistMenu.get();
    }
});

Template.lesionTrackerLayout.onCreated(function() {
    // showViewer to go to viewer from audit
    this.showWorklistMenu = new ReactiveVar(false);

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
