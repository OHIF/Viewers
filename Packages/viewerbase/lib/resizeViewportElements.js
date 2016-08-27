var resizeTimer;

handleResize = function() {
    // Avoid doing DOM manipulation during the resize handler
    // because it is fired very often.
    // Resizing is therefore performed 100 ms after the resize event stops.
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
        resizeViewportElements();
    }, 100);
};

// Resize viewport elements
resizeViewportElements = function() {
    viewportResizeTimer = setTimeout(function() {
        var elements = $('.imageViewerViewport').not('.empty');
        elements.each(function(index, element) {
            var enabledElement;
            try {
                enabledElement = cornerstone.getEnabledElement(element);
            } catch(error) {
                return;
            }

            cornerstone.resize(element, true);

            if (enabledElement.fitToWindow === false) {
                var imageId = enabledElement.image.imageId;
                var instance = cornerstoneTools.metaData.get('instance', imageId);
                var instanceClassViewport = getInstanceClassDefaultViewport(instance, enabledElement, imageId);
                cornerstone.setViewport(element, instanceClassViewport);
            }

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