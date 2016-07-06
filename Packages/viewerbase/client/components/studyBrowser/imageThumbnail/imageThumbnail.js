Template.imageThumbnail.onRendered(() => {
    const instance = Template.instance();

    // Declare DOM and jQuery objects
    const element = instance.find('.imageThumbnailCanvas');
    const $element = $(element);
    const $loading = $element.find('.imageThumbnailLoadingIndicator');
    const $loadingError = $element.find('.imageThumbnailErrorLoadingIndicator');

    instance.refreshImage = () => {
        // Disable cornerstone for thumbnail element and remove its canvas
        cornerstone.disable(element);
        $element.find('canvas').remove();

        // Enable cornerstone for thumbnail element angain creating a new canvas
        cornerstone.enable(element);

        // Get the image ID
        const imageInstance = instance.data.thumbnail.stack.instances[0];
        const imageId = getImageId(imageInstance);

        // Activate the loading state
        $loading.css('display', 'block');

        // Add the current index on the global thumbnail loading controller
        const thumbnailIndex = $('.imageThumbnailCanvas').index(element);
        ThumbnailLoading[thumbnailIndex] = imageId;
        instance.data.thumbnailIndex = thumbnailIndex;

        // Define a handler for success on image load
        const loadSuccess = image => {
            cornerstone.displayImage(element, image);
            delete ThumbnailLoading[thumbnailIndex];
            $loading.css('display', 'none');
        };

        // Define a handler for error on image load
        const loadError = error => $loadingError.css('display', 'block');

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

        // Wait for the new data and reresh the image thumbnail
        Meteor.setTimeout(() => {
            instance.refreshImage();
        });
    });
});

Template.imageThumbnail.helpers({
    // Executed every time the image loading progress is changed
    percentComplete() {
        const instance = Template.instance();

        // Register a dependency from this computation on Session key
        const percentComplete = Session.get('CornerstoneThumbnailLoadProgress' + instance.data.thumbnailIndex);

        // Return the complete percent amount of the image loading
        if (percentComplete && percentComplete !== 100) {
            return percentComplete + '%';
        }
    }
});
