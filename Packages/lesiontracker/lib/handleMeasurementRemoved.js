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

            clearMeasurementTimepointData(measurement._id, measurementData.timepointId);
            break;
    }
};
