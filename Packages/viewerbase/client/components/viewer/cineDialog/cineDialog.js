import { OHIF } from 'meteor/ohif:core';

function updateFramerate(rate) {
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
}

Template.cineDialog.helpers({
    isPlaying: function() {
        return isPlaying();
    },
    framerate: function() {
        Session.get('UpdateCine');
        return OHIF.viewer.cine.framesPerSecond.toFixed(1);
    }
});

Template.cineDialog.events({
    'click #cineFirstButton': function() {
        switchToImageByIndex(0);
    },
    'click #cineBackButton': function() {
        switchToImageRelative(-1);
    },
    'click #cineSlowPlaybackButton': function() {
        updateFramerate(OHIF.viewer.cine.framesPerSecond - 1);
    },
    'click #cinePlayButton': function() {
        toggleCinePlay();
    },
    'click #cineNextButton': function() {
        switchToImageRelative(1);
    },
    'click #cineFastForwardButton': function() {
        updateFramerate(OHIF.viewer.cine.framesPerSecond + 1);
    },
    'click #cineLastButton': function() {
        switchToImageByIndex(-1);
    },
    'change #cineLoopCheckbox': function(e) {
        var element = getActiveViewportElement();
        var playClipToolData = cornerstoneTools.getToolState(element, 'playClip');
        playClipToolData.data[0].loop = $(e.currentTarget).is(':checked');
        OHIF.viewer.cine.loop = playClipToolData.data[0].loop;
    },
    'input #cineSlider': function(e) {
        // Update the FPS text onscreen
        var rate = parseFloat($(e.currentTarget).val());
        updateFramerate(rate);
    }
});

Template.cineDialog.onRendered(function() {
    const instance = Template.instance();
    const dialog = instance.$('#cineDialog');
    dialog.draggable();
});
