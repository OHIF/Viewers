// Resize viewport elements
resizeViewportElements = function() {
    viewportResizeTimer = setTimeout(function() {
        var elements = $('.imageViewerViewport').not('.empty');
        elements.each(function(index, element) {
            cornerstone.resize(element, true);
        });
    }, 1);
};