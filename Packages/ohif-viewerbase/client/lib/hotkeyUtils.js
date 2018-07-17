import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
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
        // Tool hotkeys
        defaultTool: 'ESC',
        zoom: 'Z',
        wwwc: 'W',
        pan: 'P',
        angle: 'A',
        stackScroll: 'S',
        magnify: 'M',
        length: '',
        annotate: '',
        dragProbe: '',
        ellipticalRoi: '',
        rectangleRoi: '',

        // Viewport hotkeys
        flipH: 'H',
        flipV: 'V',
        rotateR: 'R',
        rotateL: 'L',
        invert: 'I',
        zoomIn: '',
        zoomOut: '',
        zoomToFit: '',
        resetViewport: '',
        clearTools: '',

        // Viewport navigation hotkeys
        scrollDown: 'DOWN',
        scrollUp: 'UP',
        scrollLastImage: 'END',
        scrollFirstImage: 'HOME',
        previousDisplaySet: 'PAGEUP',
        nextDisplaySet: 'PAGEDOWN',
        nextPanel: 'RIGHT',
        previousPanel: 'LEFT',

        // Miscellaneous hotkeys
        toggleOverlayTags: 'O',
        toggleCinePlay: 'SPACE',
        toggleCineDialog: '',
        toggleDownloadDialog: '',

        // Preset hotkeys
        WLPreset0: '1',
        WLPreset1: '2',
        WLPreset2: '3',
        WLPreset3: '4',
        WLPreset4: '5',
        WLPreset5: '6',
        WLPreset6: '7',
        WLPreset7: '8',
        WLPreset8: '9',
        WLPreset9: '0'
    };

    // For now
    OHIF.viewer.hotkeys = OHIF.viewer.defaultHotkeys;

    // Create commands context for viewer
    const contextName = 'viewer';
    OHIF.commands.createContext(contextName);

    // Create a function that returns true if the active viewport is empty
    const isActiveViewportEmpty = () => {
        const activeViewport = Session.get('activeViewport') || 0;
        return $('.imageViewerViewport').eq(activeViewport).hasClass('empty');
    };

    // Functions to register the tool switching commands
    const registerToolCommands = map => _.each(map, (commandName, toolId) => {
        OHIF.commands.register(contextName, toolId, {
            name: commandName,
            action: toolManager.setActiveTool,
            params: toolId
        });
    });

    // Register the default tool command
    OHIF.commands.register(contextName, 'defaultTool', {
        name: 'Default Tool',
        action: () => toolManager.setActiveTool(toolManager.getDefaultTool())
    });

    // Register the tool switching commands
    registerToolCommands({
        wwwc: 'W/L',
        zoom: 'Zoom',
        angle: 'Angle Measurement',
        dragProbe: 'Pixel Probe',
        ellipticalRoi: 'Elliptical ROI',
        rectangleRoi: 'Rectangle ROI',
        magnify: 'Magnify',
        annotate: 'Annotate',
        stackScroll: 'Scroll Stack',
        pan: 'Pan',
        length: 'Length Measurement',
        wwwcRegion: 'W/L by Region',
        crosshairs: 'Crosshairs'
    });

    // Functions to register the viewport commands
    const registerViewportCommands = map => _.each(map, (commandName, commandId) => {
        OHIF.commands.register(contextName, commandId, {
            name: commandName,
            action: viewportUtils[commandId],
            disabled: isActiveViewportEmpty
        });
    });

    // Register the viewport commands
    registerViewportCommands({
        zoomIn: 'Zoom In',
        zoomOut: 'Zoom Out',
        zoomToFit: 'Zoom to Fit',
        invert: 'Invert',
        flipH: 'Flip Horizontally',
        flipV: 'Flip Vertically',
        rotateR: 'Rotate Right',
        rotateL: 'Rotate Left',
        resetViewport: 'Reset',
        clearTools: 'Clear Tools'
    });

    // Register the preset switching commands
    const applyPreset = presetName => WLPresets.applyWLPresetToActiveElement(presetName);
    for (let i = 0; i < 10; i++) {
        OHIF.commands.register(contextName, `WLPreset${i}`, {
            name: `W/L Preset ${i + 1}`,
            action: applyPreset,
            params: i
        });
    }

    // Check if display sets can be moved
    const canMoveDisplaySets = isNext => {
        if (!OHIF.viewerbase.layoutManager) {
            return false;
        } else {
            return OHIF.viewerbase.layoutManager.canMoveDisplaySets(isNext);
        }
    };

    // Register viewport navigation commands
    OHIF.commands.set(contextName, {
        scrollDown: {
            name: 'Scroll Down',
            action: () => !isActiveViewportEmpty() && switchToImageRelative(1)
        },
        scrollUp: {
            name: 'Scroll Up',
            action: () => !isActiveViewportEmpty() && switchToImageRelative(-1)
        },
        scrollFirstImage: {
            name: 'Scroll to First Image',
            action: () => !isActiveViewportEmpty() && switchToImageByIndex(0)
        },
        scrollLastImage: {
            name: 'Scroll to Last Image',
            action: () => !isActiveViewportEmpty() && switchToImageByIndex(-1)
        },
        previousDisplaySet: {
            name: 'Previous Series',
            action: () => OHIF.viewerbase.layoutManager.moveDisplaySets(false),
            disabled: () => !canMoveDisplaySets(false)
        },
        nextDisplaySet: {
            name: 'Next Series',
            action: () => OHIF.viewerbase.layoutManager.moveDisplaySets(true),
            disabled: () => !canMoveDisplaySets(true)
        },
        nextPanel: {
            name: 'Next Image Viewport',
            action: () => panelNavigation.loadNextActivePanel()
        },
        previousPanel: {
            name: 'Previous Image Viewport',
            action: () => panelNavigation.loadPreviousActivePanel()
        }
    }, true);

    // Register miscellaneous commands
    OHIF.commands.set(contextName, {
        toggleOverlayTags: {
            name: 'Toggle Image Info Overlay',
            action() {
                const $dicomTags = $('.imageViewerViewportOverlay .dicomTag');
                $dicomTags.toggle($dicomTags.eq(0).css('display') === 'none');
            }
        },
        toggleCinePlay: {
            name: 'Play/Pause Cine',
            action: viewportUtils.toggleCinePlay,
            disabled: OHIF.viewerbase.viewportUtils.hasMultipleFrames
        },
        toggleCineDialog: {
            name: 'Show/Hide Cine Controls',
            action: viewportUtils.toggleCineDialog,
            disabled: OHIF.viewerbase.viewportUtils.hasMultipleFrames
        },
        toggleDownloadDialog: {
            name: 'Show/Hide Download Dialog',
            action: viewportUtils.toggleDownloadDialog,
            disabled: () => !viewportUtils.isDownloadEnabled()
        }
    }, true);

    OHIF.viewer.hotkeyFunctions = {};

    OHIF.viewer.loadedSeriesData = {};

    // Enable hotkeys
    hotkeyUtils.enableHotkeys();
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
    OHIF.hotkeys.set('viewer', definitions, true);
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
