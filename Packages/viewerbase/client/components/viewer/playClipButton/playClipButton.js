toggleCinePlay = function(element) {
    var viewports = $('.imageViewerViewport');

    if (!element) {
        var viewportIndex = Session.get('activeViewport');
        element = viewports.get(viewportIndex);
    }

    if (!element) {
        return;
    }

    var isPlaying = OHIF.viewer.isPlaying[viewportIndex] || false;
    if (isPlaying) {
        cornerstoneTools.stopClip(element);
    } else {
        cornerstoneTools.playClip(element);
    }

    OHIF.viewer.isPlaying[viewportIndex] = !OHIF.viewer.isPlaying[viewportIndex];
    Session.set('UpdateCINE', Random.id());
};

isPlaying = function() {
    Session.get('UpdateCINE');
    var activeViewport = Session.get('activeViewport');

    // TODO=Check best way to make sure this is always defined
    // Right now it is initialized in enableHotkeys AND in
    // imageViewer onCreated, but this appears to break some things
    if (!OHIF.viewer.isPlaying) {
        return;
    }

    return !!OHIF.viewer.isPlaying[activeViewport];
};

Template.playClipButton.helpers({
    isPlaying: function() {
        return isPlaying();
    }
});

Template.playClipButton.events({
    'click #playClip': function() {
        toggleCinePlay();
    },
    'click #toggleCineDialog': function() {
        var cineDialog = document.getElementById('cineDialog');
        toggleDialog(cineDialog);
    }
});
