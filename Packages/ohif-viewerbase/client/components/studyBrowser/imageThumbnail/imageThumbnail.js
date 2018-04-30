import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { OHIF } from 'meteor/ohif:core';
import { cornerstone } from 'meteor/ohif:cornerstone';

/**
 * Asynchronous wrapper around Cornerstone's renderToCanvas method.
 *
 * @param {HTMLElement} canvasElement An HTML <canvas> element
 * @param {Image} image A Cornerstone Image
 *
 * @return {Promise} A promise tracking the progress of the rendering. Resolves empty.
 */
function renderAsync(canvasElement, image) {
  return new Promise((resolve, reject) => {
    try {
      cornerstone.renderToCanvas(canvasElement, image);
      resolve();
    } catch(error) {
      reject(error);
    }
  });
}

Template.imageThumbnail.onCreated(() => {
    const instance = Template.instance();

    instance.isLoading = new ReactiveVar(false);
    instance.hasLoadingError = new ReactiveVar(false);

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
    const $thumbnailElement = $parent.find('.imageThumbnailCanvas');

    instance.refreshImage = () => {
        const imageElement = $thumbnailElement.find('img').get(0);

        // Activate the loading state
        instance.isLoading.set(true);
        instance.hasLoadingError.set(false);

        // Clear the previous image
        imageElement.removeAttribute('src');

        // Define a handler for success on image load
        const loadSuccess = image => {
            // This is an off-screen canvas. It's used to get dataURL images by using
            // cornerstone.renderToCanvas function.
            const canvasElement = document.createElement('canvas');
            canvasElement.width = 193;
            canvasElement.height = 123;

            // Render the image to canvas to be able to get its dataURL
            renderAsync(canvasElement, image).then(() => {
              instance.isLoading.set(false);

              imageElement.src = canvasElement.toDataURL('image/jpeg', 1);
            });
        };

        // Define a handler for error on image load
        const loadError = () => {
            instance.isLoading.set(false);
            instance.hasLoadingError.set(true);
        };

        // Call cornerstone image loader with the defined handlers
        cornerstone.loadAndCacheImage(instance.imageId).then(loadSuccess, loadError);
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

        // Get the image ID. If it is the same as the currently rendered imageId,
        // refresh the image.
        const imageId = instance.getThumbnailImageId();
        if (imageId !== instance.imageId) {
          instance.imageId = imageId;

          instance.refreshImage();
        }
    });
});

Template.imageThumbnail.helpers({
    // Executed every time the thumbnail image loading progress is changed
    percentComplete() {
        const instance = Template.instance();

        // Get the encoded image ID for thumbnail
        const encodedImageId = OHIF.string.encodeId(instance.imageId);

        // Register a dependency from this computation on Session key
        const percentComplete = Session.get('CornerstoneThumbnailLoadProgress' + encodedImageId);

        // Return the complete percent amount of the image loading
        if (percentComplete && percentComplete !== 100) {
            return percentComplete + '%';
        }
    },

    // Return how much the stack has already loaded
    stackPercentComplete() {
        const stack = Template.instance().data.thumbnail.stack;
        const progress = Session.get(`StackProgress:${stack.displaySetInstanceUid}`);
        return progress && progress.percentComplete;
    },

    showStackLoadingProgressBar() {
        return OHIF.uiSettings.showStackLoadingProgressBar;
    },

    isLoading() {
      return Template.instance().isLoading.get();
    },

    hasLoadingError() {
      return Template.instance().hasLoadingError.get();
    }
});
