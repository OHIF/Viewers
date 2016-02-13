handleMeasurementModified = function(e, eventData) {
    var measurementData = eventData.measurementData;

    switch (eventData.toolType) {
        case 'nonTarget':
        case 'lesion':
            log.info('CornerstoneToolsMeasurementModified');
            LesionManager.updateLesionData(measurementData);
            TrialResponseCriteria.validateDelayed(measurementData);
            break;
        case 'ellipticalRoi':
        case 'length':
            var enabledElement = cornerstone.getEnabledElement(eventData.element);
            var imageId = enabledElement.image.imageId;

            // Get the studyInstanceUid and series metaData
            var study = cornerstoneTools.metaData.get('study', imageId);
            var series = cornerstoneTools.metaData.get('series', imageId);

            // Add the relevant metaData to this ImageMeasurement's toolData
            measurementData.clientId = ClientId;
            measurementData.imageId = imageId;
            measurementData.measurementType = eventData.toolType;
            measurementData.patientId = study.patientId;
            measurementData.studyInstanceUid = study.studyInstanceUid;
            measurementData.seriesInstanceUid = series.seriesInstanceUid;
            var toUpdate = $.extend({}, measurementData);

            // Remove the Mongo _id otherwise it will complain when we try to 'mod' it.
            delete toUpdate._id;

            // Update the ImageMeasurement in the database
            ImageMeasurements.update(measurementData._id, {
                $set: toUpdate
            });
            break;
    }
};