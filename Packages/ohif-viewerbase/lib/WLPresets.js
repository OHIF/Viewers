import { OHIF } from 'meteor/ohif:core';

applyWLPreset = function(presetName, element) {
    log.info("Applying WL Preset: " + presetName);
    var viewport = cornerstone.getViewport(element);

    if (presetName === 'Default') {
        var enabledElement = cornerstone.getEnabledElement(element);
        viewport.voi.windowWidth = enabledElement.image.windowWidth;
        viewport.voi.windowCenter = enabledElement.image.windowCenter;
    } else {
        var preset = OHIF.viewer.wlPresets[presetName];
        viewport.voi.windowWidth = preset.ww;
        viewport.voi.windowCenter = preset.wc;
    }

    // Update the viewport
    cornerstone.setViewport(element, viewport);
};

applyWLPresetToActiveElement = function(presetName) {
    var element = getActiveViewportElement();
    if (!element) {
        return;
    }

    applyWLPreset(presetName, element);
};
