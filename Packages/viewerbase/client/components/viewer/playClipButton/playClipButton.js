toggleCinePlay = function(element) {
    if (!element) {
        var activeViewport = Session.get('activeViewport');
        element = $('.imageViewerViewport').get(activeViewport);
    }

    if (!element) {
        return;
    }

    var viewportIndex = $('.imageViewerViewport').index(element);
    var isPlaying = OHIF.viewer.isPlaying[viewportIndex] || false;
    if (isPlaying === true) {
        cornerstoneTools.stopClip(element);
    } else {
        cornerstoneTools.playClip(element);
    }
    OHIF.viewer.isPlaying[viewportIndex] = !OHIF.viewer.isPlaying[viewportIndex];
    Session.set('UpdateCINE', Random.id());
};

Template.playClipButton.helpers({
    'isPlaying': function() {
        Session.get('UpdateCINE');
        var activeViewport = Session.get('activeViewport');

        // TODO=Check best way to make sure this is always defined
        // Right now it is initialized in enableHotkeys AND in 
        // imageViewer onCreated, but this appears to break some things
        if (!OHIF.viewer.isPlaying) {
            return;
        }
        return !!OHIF.viewer.isPlaying[activeViewport];
    }
});

Template.playClipButton.events({
    'click #playClip': function() {
        toggleCinePlay();
    }
});