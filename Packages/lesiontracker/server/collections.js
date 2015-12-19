Meteor.publish('timepoints', function(patientId) {
    console.log('Publish timepoints');
    console.log('patientId ' + patientId);
    return Timepoints.find({
        patientId: patientId
    });
});

Meteor.publish('measurements', function(patientId) {
    console.log('Publish measurements');
    console.log('patientId ' + patientId);
    return Measurements.find({
        patientId: patientId
    });
});


// Temporary fix to drop all Collections on server restart
// http://stackoverflow.com/questions/23891631/meteor-how-can-i-drop-all-mongo-collections-and-clear-all-data-on-startup
Meteor.startup(function() {
    var globalObject = Meteor.isClient ? window : global;
    for (var property in globalObject) {
        var object = globalObject[property];
        if (object instanceof Meteor.Collection) {
            object.remove({});
        }
    }
});