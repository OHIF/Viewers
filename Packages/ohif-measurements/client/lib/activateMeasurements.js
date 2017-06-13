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
    const toolState = cornerstoneTools.globalImageIdSpecificToolStateManager.saveToolState();

    const toolData = toolState[imageId][toolType];
    if (!toolData || !toolData.data || !toolData.data.length) {
        return;
    }

    // When a measurement is selected, it will be activated in Cornerstone's
    // tool data
    const tool = toolData.data.find(data => data._id === measurementData._id);
    if (tool) {
        tool.active = true;
    }

    cornerstoneTools.globalImageIdSpecificToolStateManager.restoreToolState(toolState);
};


/**
 * Switch to the image of the correct image index
 * Activate the selected measurement on the switched image (color to be green)
 * Deactivate all other measurements on the switched image (color to be white)
 */
OHIF.measurements.activateMeasurements = (element, measurementData) => {
    console.log('activateMeasurements');

    // If Cornerstone Viewport information was stored while the measurement was created,
    // we should re-apply this data when activating the measurement.
    const viewport = cornerstone.getViewport(element);

    // TODO: Make this an option somewhere? For now we only want to apply windowWidth and
    // windowCenter
    const viewportPropertiesToUpdate = ['voi'];

    // Check to make sure we actually stored viewport data before trying to apply it
    if (measurementData.viewport) {

        // For each property which is not undefined, update it's value from the stored
        // measurement data
        viewportPropertiesToUpdate.forEach(prop => {
            const storedPropertyValue = measurementData.viewport[prop];
            if (storedPropertyValue === undefined) {
                return;
            }

            viewport[prop] = storedPropertyValue;
        });

        // Apply the updated viewport parameters to the element
        cornerstone.setViewport(element, viewport);
    }

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
        if (!$(element).find('canvas')) {
            return;
        }

        // TODO: Implement isEnabledElement in Cornerstone
        // or maybe just remove the 'error' this throws?
        let ee;
        try {
            ee = cornerstone.getEnabledElement(element)    
        } catch(error) {
            OHIF.log.warn(error);
            return;
        }

        if (!ee.image) {
            return;
        }

        cornerstone.updateImage(element)
    });
};