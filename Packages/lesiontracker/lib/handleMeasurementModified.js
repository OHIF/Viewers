handleMeasurementModified = function(e, eventData) {
    log.info('CornerstoneToolsMeasurementModified');
    var measurementData = eventData.measurementData;

    switch (eventData.toolType) {
        case 'nonTarget':
        case 'lesion':
            LesionManager.updateLesionData(measurementData);
            TrialResponseCriteria.validateDelayed(measurementData);
            break;
    }
};