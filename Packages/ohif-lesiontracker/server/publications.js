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
