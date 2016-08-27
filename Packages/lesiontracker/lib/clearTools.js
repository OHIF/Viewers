clearTools = function() {
    var patientId = Session.get('patientId');
    var toolTypes = [ 'bidirectional', 'nonTarget', 'length', 'ellipticalRoi', 'crTool', 'unTool', 'exTool' ];
    var toolState = cornerstoneTools.globalImageIdSpecificToolStateManager.toolState;
    var toolStateKeys = Object.keys(toolState).slice(0);

    var viewportElements = $('.imageViewerViewport').not('.empty');
    var seriesInstanceUids = []; // Holds seriesInstanceUid of imageViewerViewport elements
    viewportElements.each(function(index, element) {
        var enabledElement = cornerstone.getEnabledElement(element);
        var study = cornerstoneTools.metaData.get('study', enabledElement.image.imageId);
        if (!study) {
            return;
        }
        // Set reviewer for this timepoint
        if (study.studyInstanceUid) {
            Meteor.call('setReviewer',study.studyInstanceUid);
        }
        var series = cornerstoneTools.metaData.get('series', enabledElement.image.imageId);
        if (!series) {
            return;
        }
        
        seriesInstanceUids.push(series.seriesInstanceUid);
    });

    // Set null array for toolState data found by imageId and toolType
    toolStateKeys.forEach(function(imageId) {
        toolTypes.forEach(function(toolType) {
            var toolTypeData = toolState[imageId][toolType];
            if (toolTypeData && toolTypeData.data.length > 0) {
                var series = cornerstoneTools.metaData.get('series', imageId);
                if (!series) {
                    return;
                }

                // If seriesInstanceUid is found in seriesInstanceUids, set toolState data as null
                if (seriesInstanceUids.indexOf(series.seriesInstanceUid) > -1) {
                    toolState[imageId][toolType] = {
                        data: []
                    };
                }
            }
        });
    });

    // Update imageViewerViewport elements to remove lesions on current image
    viewportElements.each(function(index, element) {
        cornerstone.updateImage(element);
    });

    // Remove patient's measurements
    Meteor.call('removeMeasurementsByPatientId', patientId);
    Meteor.call('removeImageMeasurementsByPatientId', patientId);

    // Clear all validation errors
    ValidationErrors.remove({});
};
