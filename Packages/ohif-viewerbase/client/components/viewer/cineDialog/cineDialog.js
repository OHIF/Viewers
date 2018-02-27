import { Template } from 'meteor/templating';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';
import { OHIF } from 'meteor/ohif:core';
import { cornerstoneTools } from 'meteor/ohif:cornerstone';
import { viewportUtils } from '../../../lib/viewportUtils';
import { switchToImageRelative } from '../../../lib/switchToImageRelative';
import { switchToImageByIndex } from '../../../lib/switchToImageByIndex';

Template.cineDialog.onCreated(() => {
    const instance = Template.instance();

    // Create the data schema for CINE controls
    instance.schema = new SimpleSchema({
        intervalId: {
            type: Number,
            optional: true
        },
        loop: {
            type: Boolean,
            label: 'Loop',
            defaultValue: true
        },
        framesPerSecond: {
            type: Number,
            label: '',
            defaultValue: 24,
            min: 1,
            max: 90,
            optional: true
        }
    });

    // Update the current viewport frame rate
    instance.updateFramerate = rate => {
        OHIF.viewer.cine.framesPerSecond = rate;

        // Update playClip toolData for this imageId
        const element = viewportUtils.getActiveViewportElement();
        if (!element) {
            return;
        }

        let playClipData = cornerstoneTools.getToolState(element, 'playClip');
        if (!playClipData || !playClipData.data || !playClipData.data.length) {
            return;
        }

        // A valid playClip data object is available.
        playClipData = playClipData.data[0];

        // If the movie is playing, stop/start to update the framerate
        if (playClipData.intervalId !== void 0) {
            cornerstoneTools.stopClip(element);
            cornerstoneTools.playClip(element, OHIF.viewer.cine.framesPerSecond);
        } else {
            playClipData.framesPerSecond = OHIF.viewer.cine.framesPerSecond;
        }

        Session.set('UpdateCINE', Math.random());
    };

    // Define the actions API
    instance.api = {
        displaySetPrevious: () => OHIF.viewerbase.layoutManager.moveDisplaySets(false),
        displaySetNext: () => OHIF.viewerbase.layoutManager.moveDisplaySets(true),
        cineToggle: () => viewportUtils.toggleCinePlay(),
        cineFirst: () => switchToImageByIndex(0),
        cineLast: () => switchToImageByIndex(-1),
        cinePrevious: () => switchToImageRelative(-1),
        cineNext: () => switchToImageRelative(1),
        cineSlowDown: () => {
            const newValue = OHIF.viewer.cine.framesPerSecond - 1;
            if (newValue > 0) {
                instance.updateFramerate(newValue);
            }
        },
        cineSpeedUp: () => {
            const newValue = OHIF.viewer.cine.framesPerSecond + 1;
            if (newValue <= 90) {
                instance.updateFramerate(newValue);
            }
        }
    };

    // Run this computation every time the active viewport is changed
    instance.autorun(() => {
        Session.get('activeViewport');

        Tracker.afterFlush(() => {
            // Get the active viewportElement
            const element = viewportUtils.getActiveViewportElement();
            if (!element) {
                return;
            }

            // check if playClip tool has been initialized...
            const playClipData = cornerstoneTools.getToolState(element, 'playClip');
            if (!playClipData) {
                return;
            }

            // Get the cornerstone playClip tool data
            const toolData = playClipData.data[0];

            // Get the cine object
            const cine = OHIF.viewer.cine;

            // replace the cine values with the tool data
            _.extend(cine, toolData);

            // Set the defaults
            cine.framesPerSecond = cine.framesPerSecond || 24;
            cine.loop = _.isUndefined(cine.loop) ? true : cine.loop;

            // Set the updated data on the form inputs
            const elementComponent = instance.$('form:first').data('component');
            if (elementComponent) {
                elementComponent.value(cine);
            }

            // Update the session to refresh the framerate text
            Session.set('UpdateCINE', Math.random());
        });
    });

    /**
     * Set/Reset Window resize handler. This function is a replacement for
     * ... jQuery's on('resize', func) version which, for some unkown reason
     * ... is currently not working for this portion of code.
     * ... Further investigation is necessary.
     *
     * This happens because when an event is attached using jQuery's
     * you can't get it using vanilla JavaScript, it returns null.
     * You need to use jQuery for that. So, either you use vanilla JS or jQuery
     * to get an element's event handler. See viewerMain for more details.
     */

    instance.setResizeHandler = handler => {
        if (typeof handler === 'function') {
            const origHandler = window.onresize;
            instance.origWindowResizeHandler = typeof origHandler === 'function' ? origHandler : null;
            window.onresize = event => {
                if (typeof origHandler === 'function') {
                    origHandler.call(window, event);
                }

                handler.call(window, event);
            };
        } else {
            window.onresize = instance.origWindowResizeHandler || null;
            window.origWindowResizeHandler = null;
        }
    };

    /**
     * Set optimal position for Cine dialog.
     */

    instance.setOptimalPosition = (event, options) => {
        const $viewer = $('#viewer');
        const $toolbarElement = $('.toolbarSection .toolbarSectionTools:first');
        const $cineDialog = $('#cineDialog');
        $cineDialog.width($('#cineDialogForm').outerWidth());

        if ($toolbarElement.length < 1 || $cineDialog.length < 1) {
            return;
        }

        if ($cineDialog.data('wasDragged') || $cineDialog.data('wasBounded')) {
            // restore original handler...
            instance.setResizeHandler(null);
            return;
        }

        const cineDialogSize = {
            width: $cineDialog.outerWidth() || 0,
            height: $cineDialog.outerHeight() || 0
        };

        const topLeftCoords = {
            top: 0,
            left: 0
        };

        const toolbarRect = {
            offset: $toolbarElement.offset() || topLeftCoords,
            width: $toolbarElement.outerWidth() || 0,
            height: $toolbarElement.outerHeight() || 0
        };

        const cineDialogCoords = {
            left: toolbarRect.offset.left + toolbarRect.width + 20,
            top: toolbarRect.offset.top + toolbarRect.height - cineDialogSize.height
        };

        if (options) {
            if (options.left) {
                cineDialogCoords.left = options.left;
            }

            if (options.top) {
                cineDialogCoords.top = options.top;
            }
        }

        // Check if it is out of screen
        if (cineDialogCoords.top < 0) {
            cineDialogCoords.top = 0;
        } else if (cineDialogCoords.top + cineDialogSize.height > $viewer.height()) {
            cineDialogCoords.top -= (cineDialogCoords.top + cineDialogSize.height) - $viewer.height();
        }

        if (cineDialogCoords.left < 0) {
            cineDialogCoords.left = 0;
        } else if (cineDialogCoords.left + cineDialogSize.width > $viewer.width()) {
            cineDialogCoords.left -= (cineDialogCoords.left + cineDialogSize.width) - $viewer.width();
        }

        $cineDialog.css(cineDialogCoords);
    };
});

Template.cineDialog.onRendered(() => {
    const instance = Template.instance();
    const $dialog = instance.$('#cineDialog');
    const singleRowLayout = OHIF.uiSettings.displayEchoUltrasoundWorkflow;

    // set dialog in optimal position and make sure it continues in a optimal position...
    // ... when the window has been resized
    instance.setOptimalPosition(null, { top: singleRowLayout ? 47 : 26 });

    // The jQuery method does not seem to be working...
    // ... $(window).resize(instance.setOptimalPosition)
    // This requires additional investigation.
    instance.setResizeHandler(instance.setOptimalPosition);

    // Make the CINE dialog bounded and draggable
    $dialog.draggable({ defaultElementCursor: 'move' }).bounded();

    // Polyfill for older browsers
    window.dialogPolyfill.registerDialog($dialog.get(0));

    // Prevent dialog from being dragged when user clicks any button
    const $controls = $dialog.find('.cine-navigation, .cine-controls, .cine-options');
    $controls.on('mousedown touchstart', event => event.stopPropagation());
});

Template.cineDialog.onDestroyed(() => {
    const instance = Template.instance();
    // remove resize handler...
    instance.setResizeHandler(null);
});

Template.cineDialog.events({
    'change [data-key=loop] input'(event, instance) {
        const element = viewportUtils.getActiveViewportElement();
        OHIF.viewer.cine.loop = $(event.currentTarget).is(':checked');
        // Update playClip tool data if available.
        let playClipData = cornerstoneTools.getToolState(element, 'playClip');
        if (playClipData && playClipData.data && playClipData.data.length > 0) {
            playClipData.data[0].loop = OHIF.viewer.cine.loop;
        }
    },

    'input [data-key=framesPerSecond] input, change [data-key=framesPerSecond] input'(event, instance) {
        // Update the FPS text onscreen
        const rate = parseFloat($(event.currentTarget).val());
        instance.updateFramerate(rate);
    },

    'click .button-close'(event, instance) {
        OHIF.commands.run('toggleCineDialog');
    }
});

Template.cineDialog.helpers({
    isPlaying() {
        return viewportUtils.isPlaying();
    },

    framerate() {
        Session.get('UpdateCINE');
        return OHIF.viewer.cine.framesPerSecond.toFixed(1);
    },

    displaySetDisabled(isNext) {
        Session.get('LayoutManagerUpdated');

        // @TODO: Investigate why this is running while OHIF.viewerbase.layoutManager is undefined
        if (!OHIF.viewerbase.layoutManager) {
            return;
        }

        return !OHIF.viewerbase.layoutManager.canMoveDisplaySets(isNext) ? 'disabled' : '';
    },

    buttonDisabled() {
        return viewportUtils.hasMultipleFrames();
    },

    getClassNames(baseClass) {
        const style = OHIF.uiSettings.displayEchoUltrasoundWorkflow ? 'single' : 'double';
        return `${baseClass} ${style}-row-style`;
    }

});
