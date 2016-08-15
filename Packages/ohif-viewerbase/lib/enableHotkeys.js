import { OHIF } from 'meteor/ohif:core';

Meteor.startup(function() {

    if (!OHIF.viewer) {
        OHIF.viewer = {};
    }

    OHIF.viewer.loadIndicatorDelay = 3000;
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

    OHIF.viewer.hotkeyFunctions = {
        wwwc: function() {
            toolManager.setActiveTool('wwwc');
        },
        zoom: function() {
            toolManager.setActiveTool('zoom');
        },
        angle: function() {
            toolManager.setActiveTool('angle');
        },
        dragProbe: function() {
            toolManager.setActiveTool('dragProbe');
        },
        ellipticalRoi: function() {
            toolManager.setActiveTool('ellipticalRoi');
        },
        magnify: function() {
            toolManager.setActiveTool('magnify');
        },
        annotate: function() {
            toolManager.setActiveTool('annotate');
        },
        stackScroll: function() {
            toolManager.setActiveTool('stackScroll');
        },
        pan: function() {
            toolManager.setActiveTool('pan');
        },
        length: function() {
            toolManager.setActiveTool('length');
        },
        spine: function() {
            toolManager.setActiveTool('spine');
        },
        wwwcRegion: function() {
            toolManager.setActiveTool('wwwcRegion');
        },
        zoomIn: function() {
            var button = document.getElementById('zoomIn');
            flashButton(button);
            zoomIn();
        },
        zoomOut: function() {
            var button = document.getElementById('zoomOut');
            flashButton(button);
            zoomOut();
        },
        zoomToFit: function() {
            var button = document.getElementById('zoomToFit');
            flashButton(button);
            zoomToFit();
        },
        scrollDown: function() {
            var container = $('.viewportContainer.active');
            var button = container.find('#nextImage').get(0);

            if (!container.find('.imageViewerViewport').hasClass('empty')) {
                flashButton(button);
                switchToImageRelative(1);
            }
        },
        scrollFirstImage: function() {
            var container = $('.viewportContainer.active');
            if (!container.find('.imageViewerViewport').hasClass('empty')) {
                switchToImageByIndex(0);
            }
        },
        scrollLastImage: function() {
            var container = $('.viewportContainer.active');
            if (!container.find('.imageViewerViewport').hasClass('empty')) {
                switchToImageByIndex(-1);
            }
        },
        scrollUp: function() {
            var container = $('.viewportContainer.active');
            if (!container.find('.imageViewerViewport').hasClass('empty')) {
                var button = container.find('#prevImage').get(0);
                flashButton(button);
                switchToImageRelative(-1);
            }
        },
        previousDisplaySet() {
            OHIF.viewer.moveDisplaySets(false);
        },
        nextDisplaySet() {
            OHIF.viewer.moveDisplaySets(true);
        },
        nextPanel: function() {
            nextActivePanel();
        },
        previousPanel: function() {
            previousActivePanel();
        },
        invert: function() {
            var button = document.getElementById('invert');
            flashButton(button);
            invert();
        },
        flipV: function() {
            var button = document.getElementById('flipV');
            flashButton(button);
            flipV();
        },
        flipH: function() {
            var button = document.getElementById('flipH');
            flashButton(button);
            flipH();
        },
        rotateR: function() {
            var button = document.getElementById('rotateR');
            flashButton(button);
            rotateR();
        },
        rotateL: function() {
            var button = document.getElementById('rotateL');
            flashButton(button);
            rotateL();
        },
        cinePlay: function() {
            toggleCinePlay();
        },
        defaultTool: function() {
            var tool = toolManager.getDefaultTool();
            toolManager.setActiveTool(tool);
        },
        toggleOverlayTags: function() {
            var dicomTags = $('.imageViewerViewportOverlay .dicomTag');
            if (dicomTags.eq(0).css('display') === 'none') {
                dicomTags.show();
            } else {
                dicomTags.hide();
            }
        }
    };

    OHIF.viewer.loadedSeriesData = {};
});

// Define a jQuery reverse function
$.fn.reverse = [].reverse;

function previousActivePanel() {
    log.info('nextActivePanel');
    var currentIndex = Session.get('activeViewport');
    currentIndex--;

    var viewports = $('.imageViewerViewport');
    var numViewports = viewports.length;
    if (currentIndex < 0) {
        currentIndex = numViewports - 1;
    }

    var element = viewports.get(currentIndex);
    if (!element) {
        return;
    }

    setActiveViewport(element);
}

function nextActivePanel() {
    log.info('nextActivePanel');
    var currentIndex = Session.get('activeViewport');
    currentIndex++;

    var viewports = $('.imageViewerViewport');
    var numViewports = viewports.length;
    if (currentIndex >= numViewports) {
        currentIndex = 0;
    }

    var element = viewports.get(currentIndex);
    if (!element) {
        return;
    }

    setActiveViewport(element);
}

function flashButton(button) {
    if (!button) {
        return;
    }

    button.classList.add('active');
    setTimeout(function() {
        button.classList.remove('active');
    }, 100);
}

function bindHotkey(hotkey, task) {
    var hotkeyFunctions = OHIF.viewer.hotkeyFunctions;

    // Only bind defined, non-empty HotKeys
    if (!hotkey || hotkey === '') {
        return;
    }

    var fn;
    if (task.indexOf('WLPreset') > -1) {
        var presetName = task.replace('WLPreset', '');
        fn = function() {
            applyWLPresetToActiveElement(presetName);
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

    var hotKeyForBinding = hotkey.toLowerCase();

    $(document).bind('keydown', hotKeyForBinding, fn);
}

enableHotkeys = function() {
    var viewerHotkeys = OHIF.viewer.hotkeys;

    $(document).unbind('keydown');

    Object.keys(viewerHotkeys).forEach(function(task) {
        var taskHotkeys = viewerHotkeys[task];
        if (!taskHotkeys || !taskHotkeys.length) {
            return;
        }

        if (taskHotkeys.constructor === Array) {
            taskHotkeys.forEach(function(hotkey) {
                bindHotkey(hotkey, task);
            });
        } else {
            // taskHotkeys represents a single key
            bindHotkey(taskHotkeys, task);
        }
    });
};
