OHIF = {
    viewer: {}
};

OHIF.viewer.imageViewerLoadedSeriesDictionary = {};
OHIF.viewer.imageViewerCurrentImageIdIndexDictionary = {};
OHIF.viewer.loadIndicatorDelay = 3000;
OHIF.viewer.defaultTool = 'wwwc';
OHIF.viewer.refLinesEnabled = true;
OHIF.viewer.isPlaying = {};

Meteor.startup(function() {
    OHIF.viewer.updateImageSynchronizer = new cornerstoneTools.Synchronizer("CornerstoneNewImage", cornerstoneTools.updateImageSynchronizer);
    OHIF.viewer.functionList = {
        invert: function(element) {
            var viewport = cornerstone.getViewport(element);
            viewport.invert = !viewport.invert;
            cornerstone.setViewport(element, viewport);
        },
        playClip: function(element) {
            var viewportIndex = $('.imageViewerViewport').index(element);
            var isPlaying = OHIF.viewer.isPlaying[viewportIndex] || false;
            if (isPlaying === true) {
                cornerstoneTools.stopClip(element);
            } else {
                cornerstoneTools.playClip(element);
            }
            OHIF.viewer.isPlaying[viewportIndex] = !OHIF.viewer.isPlaying[viewportIndex];
            Session.set('UpdateCINE', Random.id());
        }
    };


    if (isTouchDevice()) {
        OHIF.viewer.tooltipConfig = {
            trigger: 'manual'
        };
    } else {
        OHIF.viewer.tooltipConfig = {
            trigger: 'hover'
        };
    }
});

function resizeViewports() {
    // Handle resizing of image viewer viewports
    // For some reason, this seems to need to be on
    // another delay, or the resizing won't work properly
    viewportResizeTimer = setTimeout(function() {
        var elements = $('.imageViewerViewport');
        elements.each(function(index) {
            var element = this;
            if (!element) {
                return;
            }
            cornerstone.resize(element, true);
        });
    }, 1);
}

Session.setDefault('ActiveViewport', 0);
Session.setDefault('viewportRows', 1);
Session.setDefault('viewportColumns', 1);

// Avoid doing DOM manipulation during the resize handler
// because it is fired very often.
// Resizing is therefore performed 100 ms after the resize event stops.
var resizeTimer;
$(window).on('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
        resizeViewports();
    }, 100);
});

Template.viewer.onRendered(function() {
    var imageViewer = $("#viewer");
    if (imageViewer) {
        $('.navbar-default').css({
            'background-color': '#000000',
            'border-color': '#101010'
        });
        document.body.style.overflow = "hidden";
        document.body.style.height = '100%';
        document.body.style.width = '100%';
        document.body.style.minWidth = 0;
        document.body.style.position = 'fixed'; // Prevent overscroll on mobile devices
    }
});