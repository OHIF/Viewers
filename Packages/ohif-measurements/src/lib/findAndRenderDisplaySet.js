import { OHIF } from 'meteor/ohif:core';

OHIF.measurements.findAndRenderDisplaySet = (displaySets, viewportIndex, studyInstanceUid, seriesInstanceUid, sopInstanceUid, renderedCallback) => {
    // Find the proper stack to display
    const stacksFromSeries = displaySets.filter(stack => stack.seriesInstanceUid === seriesInstanceUid);
    const stack = stacksFromSeries.find(stack => {
        const imageIndex = stack.images.findIndex(image => image.getSOPInstanceUID() === sopInstanceUid);
        return imageIndex > -1;
    });

    // TODO: make this work for multi-frame instances
    const specificImageIndex = stack.images.findIndex(image => image.getSOPInstanceUID() === sopInstanceUid);

    const displaySetData = {
        studyInstanceUid: studyInstanceUid,
        seriesInstanceUid: seriesInstanceUid,
        displaySetInstanceUid: stack.displaySetInstanceUid,
        currentImageIdIndex: specificImageIndex
    };

    // Add a renderedCallback to activate the measurements once it's
    if (renderedCallback) {
        displaySetData.renderedCallback = renderedCallback;
    }

    OHIF.viewerbase.layoutManager.rerenderViewportWithNewDisplaySet(viewportIndex, displaySetData);
};
