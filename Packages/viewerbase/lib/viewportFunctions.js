import { OHIF } from 'meteor/ohif:core';

getActiveViewportElement = function() {
    var viewportIndex = Session.get("activeViewport") || 0;
    return $('.imageViewerViewport').get(viewportIndex);
};

zoomIn = function() {
    const element = getActiveViewportElement();
    let viewport = cornerstone.getViewport(element);
    const scaleIncrement = 0.15;
    const maximumScale = 10;
    viewport.scale = Math.min(viewport.scale + increment, maximumScale);
    cornerstone.setViewport(element, viewport);
};

zoomOut = function() {
    const element = getActiveViewportElement();
    let viewport = cornerstone.getViewport(element);
    const scaleIncrement = 0.15;
    const minimumScale = 0.05;
    viewport.scale = Math.max(viewport.scale - increment, minimumScale);
    cornerstone.setViewport(element, viewport);
};

zoomToFit = function() {
    const element = getActiveViewportElement();
    cornerstone.fitToWindow(element);
};

rotateL = function() {
    const element = getActiveViewportElement();
    let viewport = cornerstone.getViewport(element);
    viewport.rotation -= 90;
    cornerstone.setViewport(element, viewport);
    updateOrientationMarkers(element, viewport);
};

rotateR = function() {
    const element = getActiveViewportElement();
    let viewport = cornerstone.getViewport(element);
    viewport.rotation += 90;
    cornerstone.setViewport(element, viewport);
    updateOrientationMarkers(element, viewport);
};

invert = function() {
    const element = getActiveViewportElement();
    let viewport = cornerstone.getViewport(element);
    viewport.invert = (viewport.invert === false);
    cornerstone.setViewport(element, viewport);
};

flipV = function() {
    const element = getActiveViewportElement();
    let viewport = cornerstone.getViewport(element);
    viewport.vflip = (viewport.vflip === false);
    cornerstone.setViewport(element, viewport);
    updateOrientationMarkers(element, viewport);
};

flipH = function() {
    const element = getActiveViewportElement();
    let viewport = cornerstone.getViewport(element);
    viewport.hflip = (viewport.hflip === false);
    cornerstone.setViewport(element, viewport);
    updateOrientationMarkers(element, viewport);
};

resetViewport = function() {
    const element = getActiveViewportElement();
    const enabledElement = cornerstone.getEnabledElement(element);
    if (enabledElement.fitToWindow === false) {
        const imageId = enabledElement.image.imageId;
        const instance = cornerstoneTools.metaData.get('instance', imageId);

        enabledElement.viewport = cornerstone.getDefaultViewport(enabledElement.canvas, enabledElement.image);
        
        const instanceClassDefaultViewport = getInstanceClassDefaultViewport(instance, enabledElement, imageId);
        cornerstone.setViewport(element, instanceClassDefaultViewport);
    } else {
        cornerstone.reset(element);
    }
};

clearTools = function() {
    const element = getActiveViewportElement();
    const toolStateManager = cornerstoneTools.globalImageIdSpecificToolStateManager;
    toolStateManager.clear(element);
    cornerstone.updateImage(element);
};

toggleCinePlay = function() {
    const element = getActiveViewportElement();
    var viewportIndex = Session.get('activeViewport');

    var isPlaying = OHIF.viewer.isPlaying[viewportIndex] || false;
    if (isPlaying) {
        cornerstoneTools.stopClip(element);
    } else {
        cornerstoneTools.playClip(element);
    }

    OHIF.viewer.isPlaying[viewportIndex] = !OHIF.viewer.isPlaying[viewportIndex];
    Session.set('UpdateCINE', Random.id());
};

toggleCineDialog = function() {
    var cineDialog = document.getElementById('cineDialog');
    toggleDialog(cineDialog);
}

isPlaying = function() {
    Session.get('UpdateCINE');
    var activeViewport = Session.get('activeViewport');

    // TODO=Check best way to make sure this is always defined
    // Right now it is initialized in enableHotkeys AND in
    // imageViewer onCreated, but this appears to break some things
    if (!OHIF.viewer.isPlaying) {
        return;
    }

    return !!OHIF.viewer.isPlaying[activeViewport];
};