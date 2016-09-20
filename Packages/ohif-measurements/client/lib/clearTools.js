import { OHIF } from 'meteor/ohif:core';

export const clearTools = () => {
    const config = OHIF.measurements.MeasurementApi.getConfiguration();
    const toolTypes = config.measurementTools.map(tool => {
        return tool.cornerstoneToolType;
    });

    const $viewportElements = $('.imageViewerViewport').not('.empty');

    let seriesInstanceUids = []; // Holds seriesInstanceUid of imageViewerViewport elements
    $viewportElements.each((index, element) => {
        const enabledElement = cornerstone.getEnabledElement(element);
        const study = cornerstoneTools.metaData.get('study', enabledElement.image.imageId);
        if (!study) {
            return;
        }

        const series = cornerstoneTools.metaData.get('series', enabledElement.image.imageId);
        if (!series) {
            return;
        }

        seriesInstanceUids.push(series.seriesInstanceUid);
    });

    // Set null array for toolState data found by imageId and toolType
    const toolState = cornerstoneTools.globalImageIdSpecificToolStateManager.toolState;
    const toolStateKeys = Object.keys(toolState).slice(0);
    toolStateKeys.forEach(imageId => {
        toolTypes.forEach(toolType => {
            const toolTypeData = toolState[imageId][toolType];
            if (!toolTypeData || !toolTypeData.data.length) {
                return;
            }

            const series = cornerstoneTools.metaData.get('series', imageId);
            if (!series) {
                return;
            }

            if (seriesInstanceUids.indexOf(series.seriesInstanceUid) === -1) {
                return;
            }

            // If seriesInstanceUid is found in seriesInstanceUids, set toolState data as null
            toolState[imageId][toolType] = {
                data: []
            };
        });
    });

    // Update imageViewerViewport elements to remove lesions on current image
    $viewportElements.each((index, element) => {
        cornerstone.updateImage(element);
    });

    // Clear all validation errors
    ValidationErrors.remove({});
};
