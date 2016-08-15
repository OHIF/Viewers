/**
 * Switch to the image of the correct image index
 * Activate the selected measurement on the switched image (color to be green)
 * Deactivate all other measurements on the switched image (color to be white)
 */
activateMeasurements = function(element, measurementId, templateData, viewportIndex) {
    // TODO=Switch this to use the new CornerstoneToolMeasurementModified event,
    // Once it has 'modified on activation' set up

    var enabledElement = cornerstone.getEnabledElement(element);
    var imageId = enabledElement.image.imageId;
    var timepointData = getTimepointObject(imageId);
    var measurementData = Measurements.findOne(measurementId);

    if (!timepointData) {
        return;
    }

    var measurementAtTimepoint = measurementData.timepoints[timepointData.timepointId];
    if (!measurementAtTimepoint) {
        return;
    }

    // If type is active, load image and activate lesion
    // If type is inactive, update lesions of enabledElement as inactive
    //TODO: !stackData.currentImageIdIndex returns incorrect value
    // Get loadedSeriesData currentImageIdIndex from ViewerData
    var contentId = templateData.contentId;
    var viewerData = ViewerData[contentId];
    var elementCurrentImageIdIndex = viewerData.loadedSeriesData[viewportIndex].currentImageIdIndex;

    var stackToolDataSource = cornerstoneTools.getToolState(element, 'stack');
    var stackData = stackToolDataSource.data[0];
    var imageIds = stackData.imageIds;
    var imageIdIndex = imageIds.indexOf(measurementAtTimepoint.imageId);

    if (imageIdIndex < 0) {
        return;
    }

    if (imageIdIndex === elementCurrentImageIdIndex) {
        activateTool(element, measurementData, timepointData.timepointId);
    } else {
        cornerstone.loadAndCacheImage(imageIds[imageIdIndex]).then(function(image) {
            cornerstone.displayImage(element, image);
            activateTool(element, measurementData, timepointData.timepointId);
        });
    }
};

/**
 * Activates a specific tool data instance and deactivates all other
 * target and non-target measurement data
 *
 * @param element
 * @param measurementData
 * @param timepointId
 */
function activateTool(element, measurementData, timepointId) {
    deactivateAllToolData(element, 'bidirectional');
    deactivateAllToolData(element, 'nonTarget');

    // Deactivate CRUNEX Tools
    deactivateAllToolData(element, 'crTool');
    deactivateAllToolData(element, 'unTool');
    deactivateAllToolData(element, 'exTool');

    var toolType = measurementData.toolType;
    var toolData = cornerstoneTools.getToolState(element, toolType);
    if (!toolData) {
        return;
    }

    var measurementAtTimepoint = measurementData.timepoints[timepointId];

    for (var i = 0; i < toolData.data.length; i++) {
        data = toolData.data[i];

        // When click a row of table measurements, measurement will be active and color will be green
        // TODO= Remove this with the measurementId once it is in the tool data
        if (data.seriesInstanceUid === measurementAtTimepoint.seriesInstanceUid &&
            data.studyInstanceUid === measurementAtTimepoint.studyInstanceUid &&
            data.lesionNumber === measurementData.lesionNumber &&
            data.isTarget == measurementData.isTarget) {

            data.active = true;
            break;
        }
    }

    cornerstone.updateImage(element);
}
