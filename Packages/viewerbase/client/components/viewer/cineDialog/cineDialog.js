import { OHIF } from 'meteor/ohif:core';

Template.cineDialog.onCreated(() => {
    const instance = Template.instance();

    instance.updateFramerate = rate => {
        OHIF.viewer.cine.framesPerSecond = rate;

        // Update playClip toolData for this imageId
        var element = getActiveViewportElement();
        var playClipToolData = cornerstoneTools.getToolState(element, 'playClip');
        playClipToolData.data[0].framesPerSecond = OHIF.viewer.cine.framesPerSecond;

        // If the movie is playing, stop/start to update the framerate
        if (isPlaying()) {
            cornerstoneTools.stopClip(element);
            cornerstoneTools.playClip(element);
        }

        Session.set('UpdateCine', Random.id());
    };
});

Template.cineDialog.onRendered(() => {
    const instance = Template.instance();
    const dialog = instance.$('#cineDialog');
    dialog.draggable();
});

Template.cineDialog.events({
    'click #cineFirstButton'(event, instance) {
        switchToImageByIndex(0);
    },

    'click #cineBackButton'(event, instance) {
        switchToImageRelative(-1);
    },

    'click #cineSlowPlaybackButton'(event, instance) {
        const newValue = OHIF.viewer.cine.framesPerSecond - 1;
        if (newValue > 0) {
            instance.updateFramerate(newValue);
        }
    },

    'click #cinePlayButton'(event, instance) {
        toggleCinePlay();
    },

    'click #cineNextButton'(event, instance) {
        switchToImageRelative(1);
    },

    'click #cineFastForwardButton'(event, instance) {
        const newValue = OHIF.viewer.cine.framesPerSecond + 1;
        if (newValue <= 90) {
            instance.updateFramerate(newValue);
        }
    },

    'click #cineLastButton'(event, instance) {
        switchToImageByIndex(-1);
    },

    'change #cineLoopCheckbox'(event, instance) {
        var element = getActiveViewportElement();
        var playClipToolData = cornerstoneTools.getToolState(element, 'playClip');
        playClipToolData.data[0].loop = $(event.currentTarget).is(':checked');
        OHIF.viewer.cine.loop = playClipToolData.data[0].loop;
    },

    'input #cineSlider'(event, instance) {
        // Update the FPS text onscreen
        var rate = parseFloat($(event.currentTarget).val());
        instance.updateFramerate(rate);
    }
});

Template.cineDialog.helpers({
    isPlaying() {
        return isPlaying();
    },

    framerate() {
        Session.get('UpdateCine');
        return OHIF.viewer.cine.framesPerSecond.toFixed(1);
    }
});
