Session.set('defaultSignInMessage', 'Tumor tracking in your browser.');

Template.lesionTrackerLayout.helpers({
    fullName: function() {
        return Meteor.user().profile.fullName;
    },

    showWorklistMenu: function() {
        return  Template.instance().showWorklistMenu.get();
    },

    currentUser: function() {
        var verifyEmail = Meteor.settings && Meteor.settings.public && Meteor.settings.public.verifyEmail || false;

        if (!Meteor.user() || !Meteor.userId()) {
            return false;
        }

        if (!verifyEmail) {
            return true;
        }

        if (Meteor.user().emails[0].verified) {
            return true;
        }

        return false;
    }
});

Template.lesionTrackerLayout.onCreated(function() {
    // showViewer to go to viewer from audit
    this.showWorklistMenu = new ReactiveVar(true);
    // Get url and check worklist
    var currentPath = Router.current().route.path(this);
    if (currentPath === '/' || currentPath === '/worklist') {
        this.showWorklistMenu.set(false);
    }

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

        }
    });
});
