
Meteor.methods({
    "removeMeasurementsByPatientId": function(patientId) {
        Measurements.remove(
            {patientId: patientId}
        );
    }

});

