
Template.timeoutCountdownDialog.helpers({
    leftTime: function(e) {
        return Session.get("countdownDialogLeftTime");
    },
    secondsText: function() {
        return Session.get("countdownDialogLeftTime") > 1? "seconds": "second";
    }
});