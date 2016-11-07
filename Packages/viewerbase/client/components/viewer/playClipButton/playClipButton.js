Template.playClipButton.helpers({
    isPlaying: function() {
        return isPlaying();
    },
    disableButton() {
        return hasMultipleFrames();
    }
});
