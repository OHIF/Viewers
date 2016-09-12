import { Template } from 'meteor/templating';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { OHIF } from 'meteor/ohif:core';
import { Session } from 'meteor/session';
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';

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
            label: 'Cine Speed',
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
        const element = getActiveViewportElement();
        const playClipToolData = cornerstoneTools.getToolState(element, 'playClip');
        playClipToolData.data[0].framesPerSecond = OHIF.viewer.cine.framesPerSecond;

        // If the movie is playing, stop/start to update the framerate
        if (isPlaying()) {
            cornerstoneTools.stopClip(element);
            cornerstoneTools.playClip(element);
        }

        Session.set('UpdateCINE', Random.id());
    };

    // Define the actions API
    instance.api = {
        displaySetPrevious: () => OHIF.viewer.moveDisplaySets(false),
        displaySetNext: () => OHIF.viewer.moveDisplaySets(true),
        cineToggle: () => toggleCinePlay(),
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
            const element = getActiveViewportElement();

            // Get the cornerstone playClip tool data
            const toolData = cornerstoneTools.getToolState(element, 'playClip').data[0];

            // Get the cine object
            const cine = OHIF.viewer.cine;

            // replace the cine values with the tool data
            _.extend(cine, toolData);

            // Set the defaults
            cine.framesPerSecond = cine.framesPerSecond || 24;
            cine.loop = _.isUndefined(cine.loop) ? true : cine.loop;

            // Set the updated data on the form inputs
            instance.$('form:first').data('component').value(cine);

            // Update the session to refresh the framerate text
            Session.set('UpdateCINE', Random.id());
        });
    });
});

Template.cineDialog.onRendered(() => {
    const instance = Template.instance();

    // Make the CINE dialog bounded and draggable
    instance.$('#cineDialog').bounded().draggable();
});

Template.cineDialog.events({
    'change [data-key=loop] input'(event, instance) {
        const element = getActiveViewportElement();
        const playClipToolData = cornerstoneTools.getToolState(element, 'playClip');
        playClipToolData.data[0].loop = $(event.currentTarget).is(':checked');
        OHIF.viewer.cine.loop = playClipToolData.data[0].loop;
    },

    'input [data-key=framesPerSecond] input'(event, instance) {
        // Update the FPS text onscreen
        const rate = parseFloat($(event.currentTarget).val());
        instance.updateFramerate(rate);
    }
});

Template.cineDialog.helpers({
    isPlaying() {
        return isPlaying();
    },

    framerate() {
        Session.get('UpdateCINE');
        return OHIF.viewer.cine.framesPerSecond.toFixed(1);
    },

    displaySetDisabled(isNext) {
        Session.get('LayoutManagerUpdated');
        return !OHIF.viewer.canMoveDisplaySets(isNext) ? 'disabled' : '';
    }
});
