import { Meteor } from 'meteor/meteor';
import { $ } from 'meteor/jquery';
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
        cinePlay: 'SPACE',
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

    OHIF.viewer.hotkeyFunctions = {
        wwwc: () => toolManager.setActiveTool('wwwc'),
        zoom: () => toolManager.setActiveTool('zoom'),
        angle: () => toolManager.setActiveTool('angle'),
        dragProbe: () => toolManager.setActiveTool('dragProbe'),
        ellipticalRoi: () => toolManager.setActiveTool('ellipticalRoi'),
        magnify: () => toolManager.setActiveTool('magnify'),
        annotate: () => toolManager.setActiveTool('annotate'),
        stackScroll: () => toolManager.setActiveTool('stackScroll'),
        pan: () => toolManager.setActiveTool('pan'),
        length: () => toolManager.setActiveTool('length'),
        spine: () => toolManager.setActiveTool('spine'),
        wwwcRegion: () => toolManager.setActiveTool('wwwcRegion'),

        zoomIn() {
            const button = document.getElementById('zoomIn');
            flashButton(button);
            viewportUtils.zoomIn();
        },

        zoomOut() {
            const button = document.getElementById('zoomOut');
            flashButton(button);
            viewportUtils.zoomOut();
        },

        zoomToFit() {
            const button = document.getElementById('zoomToFit');
            flashButton(button);
            viewportUtils.zoomToFit();
        },

        scrollDown() {
            const $container = $('.viewportContainer.active');
            const button = $container.find('#nextImage').get(0);

            if (!$container.find('.imageViewerViewport').hasClass('empty')) {
                flashButton(button);
                switchToImageRelative(1);
            }
        },

        scrollFirstImage() {
            const $container = $('.viewportContainer.active');
            if (!$container.find('.imageViewerViewport').hasClass('empty')) {
                switchToImageByIndex(0);
            }
        },

        scrollLastImage() {
            const $container = $('.viewportContainer.active');
            if (!$container.find('.imageViewerViewport').hasClass('empty')) {
                switchToImageByIndex(-1);
            }
        },

        scrollUp() {
            const $container = $('.viewportContainer.active');
            if (!$container.find('.imageViewerViewport').hasClass('empty')) {
                const button = $container.find('#prevImage').get(0);
                flashButton(button);
                switchToImageRelative(-1);
            }
        },

        previousDisplaySet: () => OHIF.viewerbase.layoutManager.moveDisplaySets(false),
        nextDisplaySet: () => OHIF.viewerbase.layoutManager.moveDisplaySets(true),
        nextPanel: () => panelNavigation.loadNextActivePanel(),
        previousPanel: () => panelNavigation.loadPreviousActivePanel(),

        invert() {
            const button = document.getElementById('invert');
            flashButton(button);
            viewportUtils.invert();
        },

        flipV() {
            const button = document.getElementById('flipV');
            flashButton(button);
            viewportUtils.flipV();
        },

        flipH() {
            const button = document.getElementById('flipH');
            flashButton(button);
            viewportUtils.flipH();
        },

        rotateR() {
            const button = document.getElementById('rotateR');
            flashButton(button);
            viewportUtils.rotateR();
        },

        rotateL() {
            const button = document.getElementById('rotateL');
            flashButton(button);
            viewportUtils.rotateL();
        },

        cinePlay: () => viewportUtils.toggleCinePlay(),

        defaultTool() {
            const tool = toolManager.getDefaultTool();
            toolManager.setActiveTool(tool);
        },

        toggleOverlayTags() {
            const $dicomTags = $('.imageViewerViewportOverlay .dicomTag');
            if ($dicomTags.eq(0).css('display') === 'none') {
                $dicomTags.show();
            } else {
                $dicomTags.hide();
            }
        },

        resetStack() {
            const button = document.getElementById('resetStack');
            flashButton(button);
            resetStack();
        },

        clearImageAnnotations() {
            const button = document.getElementById('clearImageAnnotations');
            flashButton(button);
            clearImageAnnotations();
        },

        cineDialog() {
            /**
             * TODO: This won't work in OHIF's, since this element
             * doesn't exist
             */
            const button = document.getElementById('cine');
            flashButton(button);
            viewportUtils.toggleCineDialog();
            button.classList.toggle('active');
        }
    };

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
 * Global function to merge different hotkeys configurations
 * but avoiding conflicts between different keys with same action
 * When this occurs, it will delete the action from OHIF's configuration
 * So if you want to keep all OHIF's actions, use an unused-ohif-key
 * Used for compatibility with others systems only
 *
 * @param hotkeysActions {object} Object with actions map
 * @return {object}
 */
function mergeHotkeys(hotkeysActions) {
    // Merge hotkeys, overriding OHIF's settings
    const mergedHotkeys = Object.assign({}, OHIF.viewer.defaultHotkeys, hotkeysActions);

    const defaultHotkeys = OHIF.viewer.defaultHotkeys;
    const hotkeysKeys = Object.keys(hotkeysActions);

    // Check for conflicts with same keys but different actions
    Object.keys(defaultHotkeys).forEach(ohifAction => {
        hotkeysKeys.forEach(definedAction => {
            // Different action but same key:
            // Remove action from merge if is not in "hotkeysActions"
            // If it is, it's already merged so nothing to do
            if (ohifAction !== definedAction && hotkeysActions[definedAction] === defaultHotkeys[ohifAction] && !hotkeysActions[ohifAction]) {
                delete mergedHotkeys[ohifAction];
            }
        });
    });

    return mergedHotkeys;
}

/**
 * Add an active class to a button for 100ms only
 * to give the impressiont the button was pressed.
 * This is for tools that don't keep the button "pressed"
 * all the time the tool is active.
 *
 * @param  button DOM Element for the button to be "flashed"
 */
function flashButton(button) {
    if (!button) {
        return;
    }

    button.classList.add('active');
    setTimeout(() => {
        button.classList.remove('active');
    }, 100);
}

/**
 * Binds a task to a hotkey keydown event
 * @param  {String} hotkey keyboard key
 * @param  {String} task   task function name
 */
function bindHotkey(hotkey, task) {
    const hotkeyFunctions = OHIF.viewer.hotkeyFunctions;

    // Only bind defined, non-empty HotKeys
    if (!hotkey || hotkey === '') {
        return;
    }

    let fn;
    if (task.indexOf('WLPreset') > -1) {
        const presetName = task.replace('WLPreset', '');
        fn = function() {
            WLPresets.applyWLPresetToActiveElement(presetName);
        };
    } else {
        fn = hotkeyFunctions[task];

        // If the function doesn't exist in the
        // hotkey function list, try the viewer-specific function list
        if (!fn && OHIF.viewer && OHIF.viewer.functionList) {
            fn = OHIF.viewer.functionList[task];
        }
    }

    if (!fn) {
        return;
    }

    const hotKeyForBinding = hotkey.toLowerCase();

    $(document).bind('keydown', hotKeyForBinding, fn);
}

/**
 * Binds all hotkeys keydown events to the tasks defined in
 * OHIF.viewer.hotkeys or a given param
 * @param  {Object} hotkeys hotkey and task mapping (not required). If not given, uses OHIF.viewer.hotkeys
 */
function enableHotkeys(hotkeys) {
    const viewerHotkeys = hotkeys || OHIF.viewer.hotkeys;

    $(document).unbind('keydown');

    Object.keys(viewerHotkeys).forEach(function(task) {
        const taskHotkeys = viewerHotkeys[task];
        if (!taskHotkeys || !taskHotkeys.length) {
            return;
        }

        if (taskHotkeys instanceof Array) {
            taskHotkeys.forEach(hotkey => bindHotkey(hotkey, task));
        } else {
            // taskHotkeys represents a single key
            bindHotkey(taskHotkeys, task);
        }
    });
}

/**
 * Export functions inside hotkeyUtils namespace.
 */

const hotkeyUtils = {
    setOHIFRefLines, /* @TODO: find a better place for this...  */
    setOHIFHotkeys,
    mergeHotkeys,
    enableHotkeys
};

export { hotkeyUtils };
