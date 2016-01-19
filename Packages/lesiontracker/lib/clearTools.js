clearTools = function() {
    var patientId = Session.get('patientId');
    var toolTypes = [ 'lesion', 'nonTarget', 'length' ];
    var toolState = cornerstoneTools.globalImageIdSpecificToolStateManager.toolState;
    var toolStateKeys = Object.keys(toolState).slice(0);

    var viewportElements = $('.imageViewerViewport').not('.empty');
    var seriesInstanceUIds = []; // Holds seriesInstanceUId of imageViewerViewport elements
    viewportElements.each(function(index, element) {
        var enabledElement = cornerstone.getEnabledElement(element);
        var series = cornerstoneTools.metaData.get('series', enabledElement.image.imageId);
        seriesInstanceUIds.push(series.seriesInstanceUid);
    });

    // Set null array for toolState data found by imageId and toolType
    toolStateKeys.forEach(function(imageId) {
        toolTypes.forEach(function(toolType) {
            var toolTypeData = toolState[imageId][toolType];
            if (toolTypeData && toolTypeData.data.length > 0) {
                var series = cornerstoneTools.metaData.get('series', imageId);
                // If seriesInstanceUid is found in seriesInstanceUIds, set toolState data as null
                if (seriesInstanceUIds.indexOf(series.seriesInstanceUid) > -1) {
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
};
