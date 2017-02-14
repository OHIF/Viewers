import { Meteor } from 'meteor/meteor';

Meteor.publish('timepoints', function() {
    return Timepoints.find();
});

Meteor.publish('singlePatientTimepoints', function(patientId) {
    return Timepoints.find({
        patientId: patientId
    });
});

Meteor.publish('studies', function() {
    return Studies.find();
});

Meteor.publish('singlePatientAssociatedStudies', function(patientId) {
    return Studies.find({
        patientId: patientId
    });
});

Meteor.publish('singlePatientMeasurements', function(patientId) {
    return Measurements.find({
        patientId: patientId
    });
});

Meteor.publish('singlePatientImageMeasurements', function(patientId) {
    return ImageMeasurements.find({
        patientId: patientId
    });
});

Meteor.publish('reviewers', function() {
    return Reviewers.find();
});

// Temporary fix to drop all Collections on server restart
// http://stackoverflow.com/questions/23891631/meteor-how-can-i-drop-all-mongo-collections-and-clear-all-data-on-startup
Meteor.startup(function() {
    if (!Meteor.settings.dropCollections) {
        return;
    }

    for (var property in global) {
        var object = global[property];
        if (object instanceof Meteor.Collection) {
            if (!(/^server|currentServer$/).test(object._name)) {
                console.warn(`Dropping: ${object._debugName || object._name}`);
                object.remove({});
            }
        }
    }
});
