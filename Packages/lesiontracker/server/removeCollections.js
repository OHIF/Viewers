Meteor.methods({
    removeMeasurement: function(id) {
        var lesionData = Measurements.findOne(id);

        // Update all Measurements to decrement the lesion numbers for those
        // that were created after the current lesion by 1

        // TODO: Update this when we have more criteria than patientId
        // Decrement the absolute lesion number of all lesions with
        // absolute lesion numbers greater than the current lesion by 1
        Measurements.update({
            patientId: lesionData.patientId,
            lesionNumberAbsolute: {
                $gt: lesionData.lesionNumberAbsolute
            }
        }, {
            $inc: {
                lesionNumberAbsolute: -1
            }
        }, {
            multi: true
        });

        // Decrement the lesion number of all related (i.e. target or non-target)
        // lesions with lesion numbers greater than the current lesion by 1
        Measurements.update({
            patientId: lesionData.patientId,
            lesionNumber: {
                $gt: lesionData.lesionNumber
            },
            isTarget: lesionData.isTarget
        }, {
            $inc: {
                lesionNumber: -1
            }
        }, {
            multi: true
        });

        Measurements.remove(id);
    },
    removeMeasurementsByPatientId: function(patientId) {
        Measurements.remove({
            patientId: patientId
        });
    },
    removeImageMeasurementsByPatientId: function(patientId) {
        ImageMeasurements.remove({
            patientId: patientId
        });
    },
    clearAllTimepoints: function() {
        Timepoints.remove({});
    },
    removeTimepoint: function(id) {
        Timepoints.remove(id);
    },
    removeAssociatedStudy: function(id) {
        Studies.remove(id);
    }
});
