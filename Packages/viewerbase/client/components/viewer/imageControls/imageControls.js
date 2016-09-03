const slideTimeoutTime = 40;
let slideTimeout;

Template.imageControls.onRendered(() => {
    const instance = Template.instance();

    Meteor.defer(() => {
        // Set the current imageSlider width to its parent's height
        // (because webkit is stupid and can't style vertical sliders)
        const $slider = instance.$('#imageSlider');
        const $element = $slider.parents().eq(2).siblings('.imageViewerViewport');
        const viewportHeight = $element.height();

        $slider.width(viewportHeight - 20);
    });
})

Template.imageControls.events({
    'keydown #imageSlider'(event) {
        // We don't allow direct keyboard up/down input on the
        // image sliders since the natural direction is reversed (0 is at the top)

        // Prevent the browser's default behaviour (scrolling)
        event.preventDefault();

        // Store the KeyCodes in an object for readability
        const keys = {
            DOWN: 40,
            UP: 38
        };

        if (event.which === keys.DOWN) {
            OHIF.viewer.hotkeyFunctions.scrollDown();
        } else if (event.which === keys.UP) {
            OHIF.viewer.hotkeyFunctions.scrollUp();
        }
    },
    'input #imageSlider, change #imageSlider'(event) {
        // Note that we throttle requests to prevent the
        // user's ultrafast scrolling from firing requests too quickly.
        clearTimeout(slideTimeout);
        slideTimeout = setTimeout(() => {
            // Using the slider in an inactive viewport
            // should cause that viewport to become active
            const slider = $(event.currentTarget);
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
