let resizeTimer;

handleResize = function() {
    // Avoid doing DOM manipulation during the resize handler
    // because it is fired very often.
    // Resizing is therefore performed 100 ms after the resize event stops.
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        resizeViewportElements();
    }, 100);
};

const repositionStudySeriesQuickSwitch = () => {
    const activeTab = Session.get('activeContentId');
    if(activeTab === 'viewerTab') {
        const nViewports = window.layoutManager.viewportData.length;

        if(nViewports && nViewports > 1) {
            const leftSidebar = $('#viewer .sidebar-left.sidebar-open');
            const rightSidebar = $('#viewer .sidebar-right.sidebar-open');
            const leftQuickSwitch = $('.quickSwitchWrapper.left');
            const rightQuickSwitch = $('.quickSwitchWrapper.right');

            const hasLeftSidebar = leftSidebar.length > 0;
            const hasRightSidebar = rightSidebar.length > 0;

            rightQuickSwitch.removeClass('left-sidebar-only');
            leftQuickSwitch.removeClass('right-sidebar-only');

            let leftOffset = 0;

            if(hasLeftSidebar) {
                leftOffset = ( leftSidebar.width()/$(window).width() ) * 100;

                if(!hasRightSidebar) {
                    rightQuickSwitch.addClass('left-sidebar-only');
                }
            }

            if(hasRightSidebar && !hasLeftSidebar) {
                leftQuickSwitch.addClass('right-sidebar-only');
            }

            const leftPosition = ( ($('#imageViewerViewports').width() / nViewports) / $(window).width() ) * 100 + leftOffset;
            const rightPosition = 100 - leftPosition;

            leftQuickSwitch.css('right', rightPosition + '%');
            rightQuickSwitch.css('left', leftPosition + '%');
        }
        
    }
};

// Resize viewport elements
resizeViewportElements = function() {
    const viewportResizeTimer = setTimeout(() => {
        repositionStudySeriesQuickSwitch();

        const elements = $('.imageViewerViewport').not('.empty');
        elements.each((index, element) => {
            let enabledElement;
            try {
                enabledElement = cornerstone.getEnabledElement(element);
            } catch(error) {
                return;
            }

            cornerstone.resize(element, true);

            if (enabledElement.fitToWindow === false) {
                const imageId = enabledElement.image.imageId;
                const instance = cornerstoneTools.metaData.get('instance', imageId);
                const instanceClassViewport = getInstanceClassDefaultViewport(instance, enabledElement, imageId);
                cornerstone.setViewport(element, instanceClassViewport);
            }

            // TODO= Refactor this into separate scrollbar resize function
            const currentOverlay = $(element).siblings('.imageViewerViewportOverlay');
            const imageControls = currentOverlay.find('.imageControls');
            currentOverlay.find('.imageControls').height($(element).height());

            // Set it's width to its parent's height
            // (because webkit is stupid and can't style vertical sliders)
            const scrollbar = currentOverlay.find('#scrollbar');
            scrollbar.height(scrollbar.parent().height() - 20);

            const currentImageSlider = currentOverlay.find('#imageSlider');
            const overlayHeight = currentImageSlider.parent().height();
            currentImageSlider.width(overlayHeight);
        });
    }, 1);
};