import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:core';

var SplunkLogger = require("splunk-logging").Logger;
var os = require('os');


var Logger = {};

Meteor.startup(function (){
    debugger;
    var config = Meteor.settings && Meteor.settings.splunkSettings || null;

    Logger = new SplunkLogger(config);

    Logger.error = function(err, context) {
        // Handle errors here
        console.log("error", err, "context", context);
    };

    Logger.eventFormatter = (message, severity) => {
        return {
            message: "application=ohif " + message,
            severity: severity
        };
    };

    Logger.sendLog = (msg, severity) => {
        var payload = {
            message: msg,
            metadata: {
                sourcetype: "app",
                index: "app",
                host: os.hostname()
            },
            severity: severity
        };

        Logger.send(payload, function (err, resp, body) {
            // If successful, body will be { text: 'Success', code: 0 }
            console.log("Response from Splunk", body);
        });
    };

    var _trace = OHIF.log.trace;
    var _debug = OHIF.log.debug;
    var _info = OHIF.log.info;
    var _warn = OHIF.log.warn;
    var _error = OHIF.log.error;

    OHIF.log.trace = (msg) =>  {
        debugger;
        _trace(msg);
        Logger.sendLog(msg, 'trace');
    };

    OHIF.log.debug = (msg) =>  {
        debugger;
        _debug(msg);
        Logger.sendLog(msg, 'debug');
    };

    OHIF.log.info = (msg) =>  {
        debugger;
        _info(msg);
        Logger.sendLog(msg, 'info');
    };

    OHIF.log.warn = (msg) =>  {
        debugger;
        _warn(msg);
        Logger.sendLog(msg, 'warn');
    };

    OHIF.log.error = (msg) =>  {
        debugger;
        _error(msg);
        Logger.sendLog(msg, 'error');
    };
});
