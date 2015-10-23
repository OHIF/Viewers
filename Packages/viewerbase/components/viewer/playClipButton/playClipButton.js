Template.playClipButton.helpers({
    'isPlaying': function() {
        Session.get('UpdateCINE');
        var viewportIndex = this.activeViewport.curValue;
        return !!OHIF.viewer.isPlaying[viewportIndex];
    }
});