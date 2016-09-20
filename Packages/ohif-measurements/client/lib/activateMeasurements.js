import { OHIF } from 'meteor/ohif:core';

/**
 * Switch to the image of the correct image index
 * Activate the selected measurement on the switched image (color to be green)
 * Deactivate all other measurements on the switched image (color to be white)
 */
OHIF.measurements.activateMeasurements = (element, measurementId, templateData, viewportIndex) => {
    // TODO=Switch this to use the new CornerstoneToolMeasurementModified event,
    // Once it has 'modified on activation' set up

    const enabledElement = cornerstone.getEnabledElement(element);
    const imageId = enabledElement.image.imageId;
    const timepointData = getTimepointObject(imageId);
    const measurementData = Measurements.findOne(measurementId);

    if (!timepointData) {
        return;
    }

    const measurementAtTimepoint = measurementData.timepoints[timepointData.timepointId];
    if (!measurementAtTimepoint) {
        return;
    }

    // If type is active, load image and activate lesion
    // If type is inactive, update lesions of enabledElement as inactive
    //TODO: !stackData.currentImageIdIndex returns incorrect value
    // Get loadedSeriesData currentImageIdIndex from ViewerData
    const viewerData = ViewerData[templateData.contentId];
    const loadedSeriesData = viewerData.loadedSeriesData[viewportIndex];
    const elementCurrentImageIdIndex = loadedSeriesData.currentImageIdIndex;

    const stackToolDataSource = cornerstoneTools.getToolState(element, 'stack');
    const stackData = stackToolDataSource.data[0];
    const imageIds = stackData.imageIds;
    const imageIdIndex = imageIds.indexOf(measurementAtTimepoint.imageId);

    if (imageIdIndex < 0) {
        return;
    }

    if (imageIdIndex === elementCurrentImageIdIndex) {
        OHIF.measurements.activateTool(element, measurementData, timepointData.timepointId);
    } else {
        cornerstone.loadAndCacheImage(measurementAtTimepoint.imageId).then(image => {
            cornerstone.displayImage(element, image);
            OHIF.measurements.activateTool(element, measurementData, timepointData.timepointId);
        });
    }
};
