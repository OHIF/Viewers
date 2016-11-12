import { OHIF } from 'meteor/ohif:core';

/**
 * Activates a specific tool data instance and deactivates all other
 * target and non-target measurement data
 *
 * @param element
 * @param measurementData
 */
function activateTool(measurementData) {
    const toolType = measurementData.toolType;
    const imageId = measurementData.imageId;
    const toolState = cornerstoneTools.globalImageIdSpecificToolStateManager.toolState;
    const toolData = toolState[imageId][toolType];
    if (!toolData || !toolData.data || !toolData.data.length) {
        return;
    }

    // When a measurement is selected, it will be activated in Cornerstone's
    // tool data
    const tool = toolData.data.find(data => data._id === measurementData._id);
    tool.active = true;
};


/**
 * Switch to the image of the correct image index
 * Activate the selected measurement on the switched image (color to be green)
 * Deactivate all other measurements on the switched image (color to be white)
 */
OHIF.measurements.activateMeasurements = (element, measurementData) => {
    console.log('activateMeasurements');

    // Activate the tool in the tool data
    activateTool(measurementData);

    const enabledElement = cornerstone.getEnabledElement(element);
    const currentImageId = enabledElement.image.imageId;
    const toolData = cornerstoneTools.getToolState(element, 'stack');
    const imageIdIndex = toolData.data[0].imageIds.indexOf(measurementData.imageId);

    // If we aren't currently displaying the image that this tool is on,
    // scroll to it now.
    if (currentImageId !== measurementData.imageId) {
        cornerstoneTools.scrollToIndex(element, imageIdIndex);
    }

    // TODO: Find another way to do this?
    // This might update one element twice, but at least it makes sure all viewports are
    // updated and the highlight is removed from inactive tools in all visible viewports
    const $viewports = $('.imageViewerViewport');
    $viewports.each((index, element) => {
        cornerstone.updateImage(element)
    });
};