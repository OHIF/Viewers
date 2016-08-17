handleMeasurementRemoved = function(e, eventData) {
    var measurementData = eventData.measurementData;

    switch (eventData.toolType) {
        case 'nonTarget':
        case 'bidirectional':
        case 'crTool':
        case 'unTool':
        case 'exTool':
            log.info('CornerstoneToolsMeasurementRemoved');

            var measurement = Measurements.findOne(measurementData.id, {
                reactive: false
            });

            if (!measurement) {
                return;
            }
            // Set reviewer for this timepoint
            if (measurementData.studyInstanceUid) {
                Meteor.call('setReviewer', measurementData.studyInstanceUid);
            }

            clearMeasurementTimepointData(measurement._id, measurementData.timepointId);
            break;
    }
};
