handleMeasurementRemoved = function(e, eventData) {
    log.info('CornerstoneToolsMeasurementRemoved');
    var measurementData = eventData.measurementData;

    switch (eventData.toolType) {
        case 'nonTarget':
        case 'lesion':
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
