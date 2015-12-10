// Resize viewport elements
resizeViewportElements = function() {
    viewportResizeTimer = setTimeout(function() {
        var elements = $('.imageViewerViewport').not('.empty');
        elements.each(function(index, element) {
            cornerstone.resize(element, true);

            // TODO= Refactor this into separate scrollbar resize function
            var currentOverlay = $(element).siblings('.imageViewerViewportOverlay');
            var imageControls = currentOverlay.find('.imageControls');
            currentOverlay.find('.imageControls').height($(element).height());

            // Set it's width to its parent's height
            // (because webkit is stupid and can't style vertical sliders)
            var scrollbar = currentOverlay.find('#scrollbar');
            scrollbar.height(scrollbar.parent().height() - 20);

            var currentImageSlider = currentOverlay.find('#imageSlider');
            var overlayHeight = currentImageSlider.parent().height();
            currentImageSlider.width(overlayHeight);
        });
    }, 1);
};