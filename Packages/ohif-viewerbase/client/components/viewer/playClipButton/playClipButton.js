import { Template } from 'meteor/templating';
import { viewportUtils } from '../../../lib/viewportUtils';

Template.playClipButton.helpers({
    isPlaying: function() {
        return viewportUtils.isPlaying();
    },
    disableButton() {
        return viewportUtils.hasMultipleFrames();
    }
});
