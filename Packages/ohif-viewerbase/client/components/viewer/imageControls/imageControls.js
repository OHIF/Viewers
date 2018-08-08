import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';
import { setActiveViewport } from '../../../lib/setActiveViewport';
import { switchToImageByIndex } from '../../../lib/switchToImageByIndex';

const slideTimeoutTime = 40;
let slideTimeout;

Template.imageControls.onRendered(() => {
    const instance = Template.instance();

    // Set the current imageSlider width to its parent's height
    // (because webkit is stupid and can't style vertical sliders)
    const $slider = instance.$('.imageSlider');
    const $viewport = $slider.closest('.imageViewerViewportOverlay').siblings('.imageViewerViewport');

    instance.handleResize = _.throttle(() => {
        const viewportHeight = $viewport.height();
        $slider.width(viewportHeight - 20);
    }, 150);

    instance.handleResize();

    $(window).on('resize', instance.handleResize);
});

Template.imageControls.onDestroyed(() => {
    const instance = Template.instance();
    if (instance.handleResize) {
        $(window).off('resize', instance.handleResize);
    }
});

Template.imageControls.events({
    'rescale .scrollbar'(event, instance) {
        instance.handleResize();
    },

    'keydown input[type=range]'(event) {
        // We don't allow direct keyboard up/down input on the
        // image sliders since the natural direction is reversed (0 is at the top)

        // Store the KeyCodes in an object for readability
        const keys = {
            DOWN: 40,
            UP: 38
        };

        if (event.which === keys.DOWN) {
            OHIF.commands.run('scrollDown');
            event.preventDefault();
        } else if (event.which === keys.UP) {
            OHIF.commands.run('scrollUp');
            event.preventDefault();
        }
    },

    'input input[type=range], change input[type=range]'(event) {
        // Note that we throttle requests to prevent the
        // user's ultrafast scrolling from firing requests too quickly.
        clearTimeout(slideTimeout);
        slideTimeout = setTimeout(() => {
            // Using the slider in an inactive viewport
            // should cause that viewport to become active
            const $slider = $(event.currentTarget);
            const viewportContainer = $slider.parents('.viewportContainer');
            setActiveViewport(viewportContainer);

            // Subtract 1 here since the slider goes from 1 to N images
            // But the stack indexing starts at 0
            const newImageIdIndex = parseInt($slider.val(), 10) - 1;
            switchToImageByIndex(newImageIdIndex);
        }, slideTimeoutTime);

        return false;
    }
});
