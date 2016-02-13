handleMeasurementModified = function(e, eventData) {
    var measurementData = eventData.measurementData;

    switch (eventData.toolType) {
        case 'nonTarget':
        case 'lesion':
            log.info('CornerstoneToolsMeasurementModified');
            LesionManager.updateLesionData(measurementData);
            TrialResponseCriteria.validateDelayed(measurementData);
            break;
    }
};