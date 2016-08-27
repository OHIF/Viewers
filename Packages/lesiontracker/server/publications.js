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

Meteor.publish('additionalFindings', function() {
    return AdditionalFindings.find();
});

Meteor.publish('singlePatientAdditionalFindings', function(patientId) {
    return AdditionalFindings.find({
        patientId: patientId
    });
});

Meteor.publish('reviewers', function() {
    return Reviewers.find();
});

Meteor.publish('servers', () => {
    return Servers.find();
});

// Temporary fix to drop all Collections on server restart
// http://stackoverflow.com/questions/23891631/meteor-how-can-i-drop-all-mongo-collections-and-clear-all-data-on-startup
Meteor.startup(function() {
    for (var property in global) {
        var object = global[property];
        if (object instanceof Meteor.Collection) {
            object.remove({});
        }
    }
});
