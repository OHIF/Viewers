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

    const contextName = 'viewer';
    OHIF.commands.createContext(contextName);
    const registerToolCommand = (commandName, toolId) => {
        OHIF.commands.registerCommand(contextName, toolId, {
            name: commandName,
            action: toolManager.setActiveTool,
            params: toolId
        });
    };

    const registerToolCommands = map => _.each(map, registerToolCommand);

    registerToolCommands({
        wwwc: 'Levels',
        zoom: 'Zoom',
        angle: 'Angle',
        dragProbe: 'Probe',
        ellipticalRoi: 'Ellipse',
        magnify: 'Magnify',
        annotate: 'Annotate',
        stackScroll: 'Stack Scroll',
        pan: 'Pan',
        length: 'Length',
        spine: 'Spine',
        wwwcRegion: 'ROI Window'
    });

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
        WLPresetSoftTissue: () => WLPresets.applyWLPresetToActiveElement('SoftTissue'),
        WLPresetLung: () => WLPresets.applyWLPresetToActiveElement('Lung'),
        WLPresetLiver: () => WLPresets.applyWLPresetToActiveElement('Liver'),
        WLPresetBone: () => WLPresets.applyWLPresetToActiveElement('Bone'),
        WLPresetBrain: () => WLPresets.applyWLPresetToActiveElement('Brain'),

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
 * Binds all hotkeys keydown events to the tasks defined in
 * OHIF.viewer.hotkeys or a given param
 * @param  {Object} hotkeys hotkey and task mapping (not required). If not given, uses OHIF.viewer.hotkeys
 */
function enableHotkeys(hotkeys) {
    const viewerHotkeys = hotkeys || OHIF.viewer.hotkeys;

    const definitions = {};
    Object.keys(viewerHotkeys).forEach(definition => {
        const hotkey = viewerHotkeys[definition];
        const action = OHIF.viewer.hotkeyFunctions[definition];
        definitions[definition] = {
            hotkey,
            action
        };
    });

    OHIF.hotkeys.setContext('viewer', definitions);
    OHIF.hotkeys.switchToContext('viewer');
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
