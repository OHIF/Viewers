import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';

getActiveViewportElement = () => {
    const viewportIndex = Session.get('activeViewport') || 0;
    return $('.imageViewerViewport').get(viewportIndex);
};

zoomIn = () => {
    const element = getActiveViewportElement();
    if (!element) {
        return;
    }

    let viewport = cornerstone.getViewport(element);
    const scaleIncrement = 0.15;
    const maximumScale = 10;
    viewport.scale = Math.min(viewport.scale + increment, maximumScale);
    cornerstone.setViewport(element, viewport);
};

zoomOut = () => {
    const element = getActiveViewportElement();
    if (!element) {
        return;
    }

    let viewport = cornerstone.getViewport(element);
    const scaleIncrement = 0.15;
    const minimumScale = 0.05;
    viewport.scale = Math.max(viewport.scale - increment, minimumScale);
    cornerstone.setViewport(element, viewport);
};

zoomToFit = () => {
    const element = getActiveViewportElement();
    if (!element) {
        return;
    }

    cornerstone.fitToWindow(element);
};

rotateL = () => {
    const element = getActiveViewportElement();
    if (!element) {
        return;
    }

    let viewport = cornerstone.getViewport(element);
    viewport.rotation -= 90;
    cornerstone.setViewport(element, viewport);
    updateOrientationMarkers(element, viewport);
};

rotateR = () => {
    const element = getActiveViewportElement();
    if (!element) {
        return;
    }

    let viewport = cornerstone.getViewport(element);
    viewport.rotation += 90;
    cornerstone.setViewport(element, viewport);
    updateOrientationMarkers(element, viewport);
};

invert = () => {
    const element = getActiveViewportElement();
    if (!element) {
        return;
    }

    let viewport = cornerstone.getViewport(element);
    viewport.invert = (viewport.invert === false);
    cornerstone.setViewport(element, viewport);
};

flipV = () => {
    const element = getActiveViewportElement();
    let viewport = cornerstone.getViewport(element);
    viewport.vflip = (viewport.vflip === false);
    cornerstone.setViewport(element, viewport);
    updateOrientationMarkers(element, viewport);
};

flipH = () => {
    const element = getActiveViewportElement();
    let viewport = cornerstone.getViewport(element);
    viewport.hflip = (viewport.hflip === false);
    cornerstone.setViewport(element, viewport);
    updateOrientationMarkers(element, viewport);
};

resetViewport = () => {
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

clearTools = () => {
    const element = getActiveViewportElement();
    const toolStateManager = cornerstoneTools.globalImageIdSpecificToolStateManager;
    toolStateManager.clear(element);
    cornerstone.updateImage(element);
};

linkStackScroll = () => {
    const synchronizer = OHIF.viewer.stackImagePositionOffsetSynchronizer;

    if(synchronizer.isActive()) {
        synchronizer.deactivate();
    } else {
        synchronizer.activate();
    }
}

// Toggle the play/stop state for the cornerstone clip tool
toggleCinePlay = () => {
    // Get the active viewport element
    const element = getActiveViewportElement();

    // Check if it's playing the clip to toggle it
    if (isPlaying()) {
        cornerstoneTools.stopClip(element);
    } else {
        cornerstoneTools.playClip(element);
    }

    // Update the UpdateCINE session property
    Session.set('UpdateCINE', Random.id());
};

// Show/hide the CINE dialog
toggleCineDialog = () => {
    const cineDialog = document.getElementById('cineDialog');
    toggleDialog(cineDialog);
};

// Check if the clip is playing on the active viewport
isPlaying = () => {
    // Create a dependency on LayoutManagerUpdated and UpdateCINE session
    Session.get('UpdateCINE');
    Session.get('LayoutManagerUpdated');

    // Get the viewport element and its current playClip tool state
    const element = getActiveViewportElement();
    // Empty Elements throws cornerstore exception
    if (!element || !$(element).find('canvas').length) {
        return;
    }

    const toolState = cornerstoneTools.getToolState(element, 'playClip');

    // Stop here if the tool state is not defined yet
    if (!toolState) {
        return false;
    }

    // Get the clip state
    const clipState = toolState.data[0];
    
    if(clipState) {
        // Return true if the clip is playing
        return !_.isUndefined(clipState.intervalId);
    }

    return false;
};



// Check if a study has multiple frames
hasMultipleFrames = () => {
    // Its called everytime active viewport and/or layout change
    Session.get('activeViewport');
    Session.get('LayoutManagerUpdated');

    const activeViewport = getActiveViewportElement();

    // No active viewport yet: disable button
    if(!activeViewport || !$(activeViewport).find('canvas').length) {
      return true;
    }

    // Get images in the stack
    const stackToolData = cornerstoneTools.getToolState(activeViewport, 'stack');

    // No images in the stack, so disable button
    if (!stackToolData || !stackToolData.data || !stackToolData.data.length) {
        return true;
    }

    // Get number of images in the stack
    const stackData = stackToolData.data[0];
    const nImages = stackData.imageIds && stackData.imageIds.length ? stackData.imageIds.length : 1;

    // Stack has just one image, so disable button
    if(nImages === 1) {
      return true;
    }

    if(clipState) {
        // Return true if the clip is playing
        return !_.isUndefined(clipState.intervalId);
    }

    return false;
};

// Check if a study has multiple frames
hasMultipleFrames = () => {
    // Its called everytime active viewport and/or layout change
    Session.get('activeViewport');
    Session.get('LayoutManagerUpdated');

    const activeViewport = getActiveViewportElement();

    // No active viewport yet: disable button
    if(!activeViewport) {
      return true;
    }

    // Get images in the stack
    const stackToolData = cornerstoneTools.getToolState(activeViewport, 'stack');

    // No images in the stack, so disable button
    if (!stackToolData || !stackToolData.data || !stackToolData.data.length) {
        return true;
    }

    // Get number of images in the stack
    const stackData = stackToolData.data[0];
    const nImages = stackData.imageIds && stackData.imageIds.length ? stackData.imageIds.length : 1;

    // Stack has just one image, so disable button
    if(nImages === 1) {
      return true;
    }

    return false;
};

isStackScrollLinkingDisabled = () => {
    // Its called everytime active viewport and/or layout change
    Session.get('activeViewport');
    Session.get('LayoutManagerUpdated');

    const synchronizer = OHIF.viewer.stackImagePositionOffsetSynchronizer;
    const linkableViewports = synchronizer.getLinkableViewports();

    return linkableViewports.length <= 1;
}

// Create an event listener to update playing state when a clip stops playing
$(window).on('CornerstoneToolsClipStopped', () => Session.set('UpdateCINE', Random.id()));
