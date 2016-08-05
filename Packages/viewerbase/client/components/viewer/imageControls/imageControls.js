const slideTimeoutTime = 40;
let slideTimeout;

Template.imageControls.events({
    'input #imageSlider, change #imageSlider': function(e) {
        // Note that we throttle requests to prevent the
        // user's ultrafast scrolling from firing requests too quickly.
        clearTimeout(slideTimeout);
        slideTimeout = setTimeout(() => {
            // Using the slider in an inactive viewport
            // should cause that viewport to become active
            const slider = $(e.currentTarget);
            const newActiveElement = slider.parents().eq(2).siblings('.imageViewerViewport').get(0);
            setActiveViewport(newActiveElement);

            // Subtract 1 here since the slider goes from 1 to N images
            // But the stack indexing starts at 0
            const newImageIdIndex = parseInt(slider.val(), 10) - 1;
            switchToImageByIndex(newImageIdIndex);
        }, slideTimeoutTime);

        return false;
    }
});
