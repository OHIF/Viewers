Template.imageThumbnail.onRendered(function() {
  var instance = this.data.instances[0];
  var element = this.find('.imageThumbnail');
  cornerstone.enable(element);

  var imageId = getImageId(instance);

  cornerstone.loadAndCacheImage(imageId).then(function(image) {
    cornerstone.displayImage(element, image);
  });
});