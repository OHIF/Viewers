//
// Client side activity detection for the session timeout
// - depends on jquery
//
// Meteor settings:
// - staleSessionHeartbeatInterval: interval (in ms) at which activity heartbeats are sent up to the server
// - staleSessionActivityEvents: the jquery events which are considered indicator of activity e.g. in an on() call.
//
var heartbeatInterval = Meteor.settings && Meteor.settings.public && Meteor.settings.public.staleSessionHeartbeatInterval || (3*60*1000); // 3mins
var activityEvents = Meteor.settings && Meteor.settings.public && Meteor.settings.public.staleSessionActivityEvents || 'mousemove click keydown';
var inactivityTimeout = Meteor.settings && Meteor.settings.public && Meteor.settings.public.staleSessionInactivityTimeout || (30*60*1000); // 30mins
var countdownDialogTime = Meteor.settings && Meteor.settings.public && Meteor.settings.public.countdownDialogTime || (15*1000); // 30second
var showCountdownDialog = Meteor.settings && Meteor.settings.public && Meteor.settings.public.showCountdownDialog || true;

var activityDetected = false;
var activityDetectedTime = new Date();

Meteor.startup(function() {
    // Add countdown dialog to body
    $("body").append('<div id="staleSessionCountdownModal" title="Session will expire!"></div>');

    //Initialize the dialog
    $("#staleSessionCountdownModal").dialog({
        autoOpen: false,
        open: function(){
            $('.ui-widget-overlay').bind('click',function(){
                $('#staleSessionCountdownModal').dialog('close');
            });
        }
    });

    //
    // periodically send a heartbeat if activity has been detected within the interval
    //
    Meteor.setInterval(function() {
        if (Meteor.userId() && activityDetected) {
            Meteor.call('heartbeat');
            activityDetected = false;
        }
    }, heartbeatInterval);

    // Detect the time when countdown dialog will be shown
    if (showCountdownDialog) {
        Meteor.setInterval(function() {
            if (!activityDetected) {
                var lastHeartbeatTime = activityDetectedTime.getTime();
                var now = new Date().getTime();
                var overdueTimestamp = now - lastHeartbeatTime;
                var dialogTime = inactivityTimeout - countdownDialogTime;
                if(dialogTime <= overdueTimestamp && inactivityTimeout >= overdueTimestamp) {
                    var sec = Math.round((inactivityTimeout - overdueTimestamp) / 1000);
                    console.log(sec);
                    var dialogStr = "You will be log out in "+sec+" seconds.";
                    if (sec === 0) {
                        $("#staleSessionCountdownModal").dialog('close');
                    } else {
                        if(sec === 1) {
                            dialogStr = "You will be log out in "+sec+" second.";
                        }
                        $('#staleSessionCountdownModal').html(dialogStr);
                        $("#staleSessionCountdownModal").dialog('open');

                        // Remove border of close button
                        $(".ui-button:focus").css("outline", "none");
                    }

                } else {
                    $("#staleSessionCountdownModal").dialog('close');
                }
            }
        }, 1000);
    }

    //
    // detect activity and mark it as detected on any of the following events
    //
    $(document).on(activityEvents, function(event) {
        activityDetected = true;
        activityDetectedTime = new Date();
        $("#staleSessionCountdownModal").dialog('close');
    });
});
