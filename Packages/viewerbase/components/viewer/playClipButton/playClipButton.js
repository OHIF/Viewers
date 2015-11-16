Template.playClipButton.helpers({
    'isPlaying': function() {
        Session.get('UpdateCINE');
        var activeViewport = Session.get('activeViewport');
        return !!OHIF.viewer.isPlaying[activeViewport];
    }
});