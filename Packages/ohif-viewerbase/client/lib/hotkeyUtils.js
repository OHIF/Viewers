import { Meteor } from 'meteor/meteor';
import { $ } from 'meteor/jquery';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';
import { toolManager } from './toolManager';
import { switchToImageRelative } from './switchToImageRelative';
import { switchToImageByIndex } from './switchToImageByIndex';
import { viewportUtils } from './viewportUtils';
import { panelNavigation } from './panelNavigation';
import { WLPresets } from './WLPresets';

// TODO: add this to namespace definitions
Meteor.startup(function() {
    OHIF.viewer.loadIndicatorDelay = 200;
    OHIF.viewer.defaultTool = 'wwwc';
    OHIF.viewer.refLinesEnabled = true;
    OHIF.viewer.isPlaying = {};
    OHIF.viewer.cine = {
        framesPerSecond: 24,
        loop: true
    };

    OHIF.viewer.defaultHotkeys = {
        defaultTool: 'ESC',
        angle: 'A',
        stackScroll: 'S',
        pan: 'P',
        magnify: 'M',
        scrollDown: 'DOWN',
        scrollUp: 'UP',
        nextDisplaySet: 'PAGEDOWN',
        previousDisplaySet: 'PAGEUP',
        nextPanel: 'RIGHT',
        previousPanel: 'LEFT',
        invert: 'I',
        flipV: 'V',
        flipH: 'H',
        wwwc: 'W',
        zoom: 'Z',
        toggleCinePlay: 'SPACE',
        rotateR: 'R',
        rotateL: 'L',
        toggleOverlayTags: 'SHIFT',
        WLPresetSoftTissue: ['NUMPAD1', '1'],
        WLPresetLung: ['NUMPAD2', '2'],
        WLPresetLiver: ['NUMPAD3', '3'],
        WLPresetBone: ['NUMPAD4', '4'],
        WLPresetBrain: ['NUMPAD5', '5']
    };

    // For now
    OHIF.viewer.hotkeys = OHIF.viewer.defaultHotkeys;

    // Create commands context for viewer
    const contextName = 'viewer';
    OHIF.commands.createContext(contextName);

    // Functions to register the tool switching commands
    const registerToolCommands = map => _.each(map, (commandName, toolId) => {
        OHIF.commands.register(contextName, toolId, {
            name: commandName,
            action: toolManager.setActiveTool,
            params: toolId
        });
    });

    // Register the tool switching commands
    registerToolCommands({
        wwwc: 'Levels',
        zoom: 'Zoom',
        angle: 'Angle',
        dragProbe: 'Probe',
        ellipticalRoi: 'Ellipse',
        rectangleRoi: 'Rectangle',
        magnify: 'Magnify',
        annotate: 'Annotate',
        stackScroll: 'Stack Scroll',
        pan: 'Pan',
        length: 'Length',
        spine: 'Spine',
        wwwcRegion: 'ROI Window'
    });

    // Functions to register the viewport commands
    const registerViewportCommands = map => _.each(map, (commandName, commandId) => {
        OHIF.commands.register(contextName, commandId, {
            name: commandName,
            action: viewportUtils[commandId]
        });
    });

    // Register the viewport commands
    registerViewportCommands({
        zoomIn: 'Zoom in',
        zoomOut: 'Zoom out',
        zoomToFit: 'Zoom to fit',
        invert: 'Invert',
        flipH: 'Flip horizontally',
        flipV: 'Flip vertically',
        rotateR: 'Rotate right',
        rotateL: 'Rotate left',
        toggleCinePlay: 'Play/Pause',
        toggleCineDialog: 'CINE dialog',
        resetViewport: 'Reset',
        clearTools: 'Clear'
    });

    // Functions to register the preset switching commands
    const registerWLPresetCommands = map => _.each(map, (commandName, presetName) => {
        OHIF.commands.register(contextName, presetName, {
            name: commandName,
            action: WLPresets.applyWLPresetToActiveElement,
            params: presetName.replace('WLPreset', '')
        });
    });

    // Register the preset switching commands
    registerWLPresetCommands({
        WLPresetSoftTissue: 'SoftTissue',
        WLPresetLung: 'Lung',
        WLPresetLiver: 'Liver',
        WLPresetBone: 'Bone',
        WLPresetBrain: 'Brain'
    });

    // Register scrolling commands
    const isActiveViewportEmpty = () => $('.viewportContainer.active .imageViewerViewport').hasClass('empty');
    OHIF.commands.set(contextName, {
        scrollDown: {
            name: 'Scroll down',
            action: () => !isActiveViewportEmpty() && switchToImageRelative(1)
        },
        scrollUp: {
            name: 'Scroll up',
            action: () => !isActiveViewportEmpty() && switchToImageRelative(-1)
        },
        scrollFirstImage: {
            name: 'Scroll to first image',
            action: () => !isActiveViewportEmpty() && switchToImageByIndex(0)
        },
        scrollLastImage: {
            name: 'Scroll to last image',
            action: () => !isActiveViewportEmpty() && switchToImageByIndex(-1)
        }
    }, true);

    // Register viewport navigation commands
    OHIF.commands.set(contextName, {
        previousDisplaySet: {
            name: 'Scroll down',
            action: () => OHIF.viewerbase.layoutManager.moveDisplaySets(false)
        },
        nextDisplaySet: {
            name: 'Scroll up',
            action: () => OHIF.viewerbase.layoutManager.moveDisplaySets(true)
        },
        nextPanel: {
            name: 'Scroll to first image',
            action: () => panelNavigation.loadNextActivePanel()
        },
        previousPanel: {
            name: 'Scroll to last image',
            action: () => panelNavigation.loadPreviousActivePanel()
        }
    }, true);

    // Register miscellaneous commands
    OHIF.commands.set(contextName, {
        defaultTool: {
            name: 'Default tool',
            action: () => toolManager.setActiveTool(toolManager.getDefaultTool())
        },
        toggleOverlayTags: {
            name: 'Toggle overlay tags',
            action() {
                const $dicomTags = $('.imageViewerViewportOverlay .dicomTag');
                $dicomTags.toggle($dicomTags.eq(0).css('display') === 'none');
            }
        }
    }, true);

    OHIF.viewer.hotkeyFunctions = {};

    OHIF.viewer.loadedSeriesData = {};
});

// Define a jQuery reverse function
$.fn.reverse = [].reverse;

/**
 * Overrides OHIF's refLinesEnabled
 * @param  {Boolean} refLinesEnabled True to enable and False to disable
 */
function setOHIFRefLines(refLinesEnabled) {
    OHIF.viewer.refLinesEnabled = refLinesEnabled;
}

/**
 * Overrides OHIF's hotkeys
 * @param  {Object} hotkeys Object with hotkeys mapping
 */
function setOHIFHotkeys(hotkeys) {
    OHIF.viewer.hotkeys = hotkeys;
}

/**
 * Binds all hotkeys keydown events to the tasks defined in
 * OHIF.viewer.hotkeys or a given param
 * @param  {Object} hotkeys hotkey and task mapping (not required). If not given, uses OHIF.viewer.hotkeys
 */
function enableHotkeys(hotkeys) {
    const definitions = hotkeys || OHIF.viewer.hotkeys;
    OHIF.hotkeys.set('viewer', definitions);
    OHIF.context.set('viewer');
}

/**
 * Export functions inside hotkeyUtils namespace.
 */

const hotkeyUtils = {
    setOHIFRefLines, /* @TODO: find a better place for this...  */
    setOHIFHotkeys,
    enableHotkeys
};

export { hotkeyUtils };
