toggleCinePlay = function(element) {
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
        return !!OHIF.viewer.isPlaying[activeViewport];
    }
});

Template.playClipButton.events({
    'click #playClip': function() {
        var activeViewport = Session.get('activeViewport');
        var element = $('.imageViewerViewport').get(activeViewport);
        toggleCinePlay(element);
    }
});