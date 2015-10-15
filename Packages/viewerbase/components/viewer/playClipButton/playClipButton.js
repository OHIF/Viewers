Template.playClipButton.helpers({
    'isPlaying': function() {
        Session.get('UpdateCINE');
        var viewportIndex = Session.get('ActiveViewport');
        return !!OHIF.viewer.isPlaying[viewportIndex];
    }
});