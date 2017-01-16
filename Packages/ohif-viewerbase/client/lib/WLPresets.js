import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:core';
import { viewportUtils } from './viewportUtils';

// TODO: add this to a namespace definition
Meteor.startup(function() {
    OHIF.viewer.defaultWLPresets = {
        SoftTissue: {
            wc: 40,
            ww: 400
        },
        Lung: {
            wc: -600,
            ww: 1500
        },
        Liver: {
            wc: 90,
            ww: 150
        },
        Bone: {
            wc: 480,
            ww: 2500
        },
        Brain: {
            wc: 40,
            ww: 80
        }
    };

    // For now
    OHIF.viewer.wlPresets = OHIF.viewer.defaultWLPresets;
});

function applyWLPreset(presetName, element) {
    OHIF.log.info('Applying WL Preset: ' + presetName);
    if (presetName !== 'Custom') {
        const viewport = cornerstone.getViewport(element);

        if (presetName === 'Default') {
            const enabledElement = cornerstone.getEnabledElement(element);
            viewport.voi.windowWidth = enabledElement.image.windowWidth;
            viewport.voi.windowCenter = enabledElement.image.windowCenter;
        } else {
            const preset = OHIF.viewer.wlPresets[presetName];
            if(preset) {
                viewport.voi.windowWidth = preset.ww;
                viewport.voi.windowCenter = preset.wc;
            }
        }

        // Update the viewport
        cornerstone.setViewport(element, viewport);
    }
}

function applyWLPresetToActiveElement(presetName) {
    const element = viewportUtils.getActiveViewportElement();
    if (!element) {
        return;
    }

    applyWLPreset(presetName, element);

    // To perform reactivity in other components
    Session.set('WLPresetActiveElement', presetName);
}

/**
 * Overrides OHIF's wlPresets
 * @param  {Object} wlPresets Object with wlPresets mapping
 */
function setOHIFWLPresets(wlPresets) {
    OHIF.viewer.wlPresets = wlPresets;
}

/**
 * Export functions inside WLPresets namespace.
 */

const WLPresets = {
    applyWLPreset,
    applyWLPresetToActiveElement,
    setOHIFWLPresets
};

export { WLPresets };
