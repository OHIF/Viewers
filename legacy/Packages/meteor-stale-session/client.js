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

var dialogTimeout = Meteor.settings && Meteor.settings.public && Meteor.settings.public.dialogTimeout || (30*1000); // 30secs
var showCountdownDialog =  Meteor.settings && Meteor.settings.public && Meteor.settings.public.showCountdownDialog || false;
var countdownHeartbeatInterval = (heartbeatInterval < dialogTimeout)? heartbeatInterval : dialogTimeout;

var activityDetected = false;
var lastActivityDetectedTime = new Date();
var dialogIsOpen = false;

Meteor.startup(function() {

    //
    // periodically send a heartbeat if activity has been detected within the interval
    //
    if (showCountdownDialog) {
        Meteor.setInterval(function() {
            if (Meteor.userId()) {
                if (activityDetected) {
                    Meteor.call('heartbeat', function(error, heartbeatTime) {
                        lastActivityDetectedTime = heartbeatTime;
                        activityDetected = false;
                        // Event to close dialog
                        $.event.trigger('TriggerCloseTimeoutCountdownDialog');
                        dialogIsOpen = false;
                    });

                } else {
                    var overdueTimestamp = new Date().getTime() - lastActivityDetectedTime;
                    // Ignore min differences
                    overdueTimestamp = overdueTimestamp - (overdueTimestamp % 1000);
                    console.log(overdueTimestamp);
                    var startTime = inactivityTimeout - dialogTimeout;
                    var nextIntervalTime = overdueTimestamp + countdownHeartbeatInterval;
                    if (overdueTimestamp <= inactivityTimeout && nextIntervalTime <= inactivityTimeout && nextIntervalTime >= startTime) {
                        if (Math.abs(startTime - overdueTimestamp) <= Math.abs(nextIntervalTime - startTime) && !dialogIsOpen) {
                            // Open dialog
                            var leftTime = Math.round((inactivityTimeout - overdueTimestamp) / 1000);
                            $.event.trigger('TriggerOpenTimeoutCountdownDialog', leftTime);
                            dialogIsOpen = true;
                        }

                    } else {
                        // Event to close dialog
                        $.event.trigger('TriggerCloseTimeoutCountdownDialog');
                        dialogIsOpen = false;
                    }
                }

            } else {
                // Event to close dialog
                $.event.trigger('TriggerCloseTimeoutCountdownDialog');
                dialogIsOpen = false;
            }
        }, countdownHeartbeatInterval);

    } else{

        Meteor.setInterval(function() {
            if (Meteor.userId() && activityDetected) {
                Meteor.call('heartbeat');
                activityDetected = false;
            }
        }, heartbeatInterval);
    }

    //
    // detect activity and mark it as detected on any of the following events
    //
    $(document).on(activityEvents, function() {
        activityDetected = true;
        // Event to close dialog
        $.event.trigger('TriggerCloseTimeoutCountdownDialog');
        dialogIsOpen = false;
    });
});
