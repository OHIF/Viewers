Template.imageThumbnail.onRendered(function() {
    var instance = this.data.stack.instances[0];
    var element = this.find('.imageThumbnailCanvas');

    cornerstone.disable(element);
    $(element).find('canvas').remove();

    cornerstone.enable(element);

    var imageId = getImageId(instance);

    var elem = $(element);
    elem.find('.imageThumbnailLoadingIndicator').css('display', 'block');

    var thumbnailIndex = $('.imageThumbnailCanvas').index(element);
    ThumbnailLoading[thumbnailIndex] = imageId;

    this.data.thumbnailIndex = thumbnailIndex;

    cornerstone.loadAndCacheImage(imageId).then(function(image) {
        cornerstone.displayImage(element, image);

        delete ThumbnailLoading[thumbnailIndex];
        elem.find('.imageThumbnailLoadingIndicator').css('display', 'none');
    }, function(error) {
        elem.find('.imageThumbnailErrorLoadingIndicator').css('display', 'block');
    });
});

Template.imageThumbnail.helpers({
    percentComplete: function() {
        var percentComplete = Session.get('CornerstoneThumbnailLoadProgress' + this.thumbnailIndex);
        if (percentComplete && percentComplete !== 100) {
            return percentComplete + '%';
        }
    }
});
