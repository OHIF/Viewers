import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { OHIF } from 'meteor/ohif:core';
import { cornerstone } from 'meteor/ohif:cornerstone';

Template.imageThumbnail.onCreated(() => {
    const instance = Template.instance();

    // Get the image ID for current thumbnail
    instance.getThumbnailImageId = () => {
        const settingPath = 'public.ui.useMiddleSeriesInstanceAsThumbnail';
        const useMiddleFrame = OHIF.utils.ObjectPath.get(Meteor.settings, settingPath);
        const stack = instance.data.thumbnail.stack;
        const lastIndex = (stack.numImageFrames || stack.images.length || 1) - 1;
        let imageIndex = useMiddleFrame ? Math.floor(lastIndex / 2) : 0;
        let imageInstance;

        if (stack.isMultiFrame) {
            imageInstance = stack.images[0];
        } else {
            imageInstance = stack.images[imageIndex];
            imageIndex = undefined;
        }

        return imageInstance.getImageId(imageIndex, true);
    };
});

Template.imageThumbnail.onRendered(() => {
    const instance = Template.instance();

    // Declare DOM and jQuery objects
    const $parent = instance.$('.imageThumbnail');
    const $loading = $parent.find('.imageThumbnailLoadingIndicator');
    const $loadingError = $parent.find('.imageThumbnailErrorLoadingIndicator');
    const $element = $parent.find('.imageThumbnailCanvas');
    const element = $element.get(0);

    instance.refreshImage = () => {
        if (!element) {
            return;
        }

        // Remove previously generated static images
        $element.find('.static-image').remove();

        // Enable cornerstone for thumbnail element again creating a new canvas
        cornerstone.enable(element, { renderer: '' });

        // Activate the loading state
        $loading.css('display', 'block');

        // Define a handler for success on image load
        const loadSuccess = image => {
            // Check to make sure the element is enabled.
            try {
                cornerstone.getEnabledElement(element);
            } catch(error) {
                return;
            }

            cornerstone.displayImage(element, image);

            $element.one('cornerstoneimagerendered', event => {
                const eventData = event.originalEvent.detail;
                const { element } = eventData;
                const enabledElement = cornerstone.getEnabledElement(element);

                // Create a static image from
                const imageElement = document.createElement('img');
                imageElement.classList.add('static-image');
                const dataUrl = enabledElement.canvas.toDataURL('image/jpeg', 1);
                imageElement.src = dataUrl;

                // Try to disable cornerstone for thumbnail element and remove its canvas
                try {
                    cornerstone.disable(element);
                } catch (e) {}

                $element.append(imageElement);

                $loading.css('display', 'none');
            });
        };

        // Define a handler for error on image load
        const loadError = () => {
            $loading.css('display', 'none');
            $loadingError.css('display', 'block');
        };

        // Get the image ID
        const imageId = instance.getThumbnailImageId();

        // Call cornerstone image loader with the defined handlers
        cornerstone.loadAndCacheImage(imageId).then(loadSuccess, loadError);
    };

    // Run this computation every time the current study is changed
    instance.autorun(() => {
        // Check if there is a reactive var set for current study
        if (instance.data.currentStudy) {
            // Register a dependency from this computation on current study
            instance.data.currentStudy.dep.depend();
        }

        // Depend on external data and re-run this computation when it changes
        Template.currentData();

        // Wait for the new data and refresh the image thumbnail
        Tracker.afterFlush(() => instance.refreshImage());
    });
});

Template.imageThumbnail.onDestroyed(() => {
    const instance = Template.instance();

    // Declare DOM and jQuery objects
    const $parent = instance.$('.imageThumbnail');
    const $element = $parent.find('.imageThumbnailCanvas');
    const element = $element.get(0);

    // Try to disable the element if it still exists
    try {
        cornerstone.disable(element);
    } catch (e) {}
});

Template.imageThumbnail.helpers({
    // Executed every time the thumbnail image loading progress is changed
    percentComplete() {
        const instance = Template.instance();

        // Get the encoded image ID for thumbnail
        const encodedImageId = OHIF.string.encodeId(instance.getThumbnailImageId());

        // Register a dependency from this computation on Session key
        const percentComplete = Session.get('CornerstoneThumbnailLoadProgress' + encodedImageId);

        // Return the complete percent amount of the image loading
        if (percentComplete && percentComplete !== 100) {
            return percentComplete + '%';
        }
    },

    // Return how much the stack has already loaded
    stackPercentComplete() {
        const instance = Template.instance();
        const stack = instance.data.thumbnail.stack;
        const displaySetInstanceUid = stack.displaySetInstanceUid;
        const progress = Session.get('StackProgress:' + displaySetInstanceUid);
        const percentComplete = progress && progress.percentComplete;

        return percentComplete;
    },

    showStackLoadingProgressBar() {
        return OHIF.uiSettings.showStackLoadingProgressBar;
    }
});
