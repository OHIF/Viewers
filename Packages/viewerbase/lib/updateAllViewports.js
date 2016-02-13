updateAllViewports = function() {
    var viewports = $('.imageViewerViewport').not('.empty');
    viewports.each(function(index, element) {
        cornerstone.updateImage(element);
    });
};