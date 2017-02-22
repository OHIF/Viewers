import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { OHIF } from 'meteor/ohif:core';
import { viewportUtils } from './viewportUtils';

const WL_PRESET_CUSTOM = 'Custom';
const WL_PRESET_DEFAULT = 'Default';

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

    setOHIFWLPresets(OHIF.viewer.defaultWLPresets);
});

function updateElementWLPresetData(element) {
    const wlPresetData = cornerstone.getElementData(element, 'wlPreset');
    const enabledElement = cornerstone.getEnabledElement(element);
    const { viewport, image } = enabledElement;
    const { windowCenter, windowWidth } = viewport.voi;
    let presetName;

    if (windowWidth === image.windowWidth && windowCenter === image.windowCenter) {
        presetName = WL_PRESET_DEFAULT;
    } else {
        const WLPresets = OHIF.viewer.wlPresets;
        for (let name in WLPresets) {
            const preset = WLPresets[name];
            if (windowCenter === preset.wc && windowWidth === preset.ww) {
                presetName = name;
                break;
            }
        }
    }

    wlPresetData.name = presetName || WL_PRESET_CUSTOM;
    wlPresetData.ww = windowWidth;
    wlPresetData.wc = windowCenter;

    if (wlPresetData.name === WL_PRESET_CUSTOM) {
        const custom = wlPresetData.custom || (wlPresetData.custom = Object.create(null));
        custom.ww = windowWidth;
        custom.wc = windowCenter;
    }
}

/**
 * Set specified W/L preset on given element on fallback to default W/L preset if the specified preset is not valid.
 * @param {String} presetName The desired W/L preset to be applied
 * @param {DOMElement} element An enabled viewport DOM Element.
 */
function applyWLPreset(presetName, element) {
    const wlPresets = OHIF.viewer.wlPresets;
    const wlPresetData = cornerstone.getElementData(element, 'wlPreset');
    const viewport = cornerstone.getViewport(element);

    if (presetName === WL_PRESET_CUSTOM && wlPresetData.custom) {
        viewport.voi.windowWidth = wlPresetData.custom.ww;
        viewport.voi.windowCenter = wlPresetData.custom.wc;
    } else if (presetName in wlPresets) {
        const preset = wlPresets[presetName];
        viewport.voi.windowWidth = preset.ww;
        viewport.voi.windowCenter = preset.wc;
    } else {
        const enabledElement = cornerstone.getEnabledElement(element);
        viewport.voi.windowWidth = enabledElement.image.windowWidth;
        viewport.voi.windowCenter = enabledElement.image.windowCenter;
        presetName = WL_PRESET_DEFAULT;
    }

    wlPresetData.name = presetName;
    wlPresetData.ww = viewport.voi.windowWidth;
    wlPresetData.wc = viewport.voi.windowCenter;

    // Update the viewport
    cornerstone.setViewport(element, viewport);

    OHIF.log.info('WLPresets::Applying WL Preset: ' + presetName);

    // Notify other components about W/L Preset changes
    Session.set('OHIFWlPresetApplied', presetName);
}

function applyWLPresetToActiveElement(presetName) {
    const element = viewportUtils.getActiveViewportElement();
    if (!element) {
        return;
    }

    applyWLPreset(presetName, element);
}

/**
 * Overrides OHIF's wlPresets
 * @param  {Object} wlPresets Object with wlPresets mapping
 */
function setOHIFWLPresets(wlPresets) {
    const hasOwn = Object.prototype.hasOwnProperty;
    const presetMap = Object.create(null); // Objects without prototype have much faster lookup times
    for (let name in wlPresets) {
        if (hasOwn.call(wlPresets, name)) {
            presetMap[name] = wlPresets[name];
        }
    }
    OHIF.viewer.wlPresets = presetMap;
}

/**
 * Export functions inside WLPresets namespace.
 */

const WLPresets = {
    applyWLPreset,
    applyWLPresetToActiveElement,
    setOHIFWLPresets,
    updateElementWLPresetData
};

export { WLPresets };
