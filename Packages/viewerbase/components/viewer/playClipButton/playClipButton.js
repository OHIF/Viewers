Template.playClipButton.helpers({
    'isPlaying': function() {
        Session.get('UpdateCINE');
        var viewportIndex = this.activeViewport.get();
        return !!OHIF.viewer.isPlaying[viewportIndex];
    }
});