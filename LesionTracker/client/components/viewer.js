function resizeViewports() {
    log.info("viewer resizeViewports");

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

Template.viewer.onCreated(function() {
    log.info("viewer onCreated");

    OHIF = {
        viewer: {}
    };

    OHIF.viewer.loadIndicatorDelay = 3000;
    OHIF.viewer.defaultTool = 'wwwc';
    OHIF.viewer.refLinesEnabled = true;
    OHIF.viewer.isPlaying = {};

    OHIF.viewer.functionList = {
        invert: function(element) {
            var viewport = cornerstone.getViewport(element);
            viewport.invert = !viewport.invert;
            cornerstone.setViewport(element, viewport);
        },
        resetViewport: function(element) {
            cornerstone.reset(element);
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

    var contentId = this.data.contentId;
    
    if (ViewerData[contentId].loadedSeriesData) {
        log.info('Reloading previous loadedSeriesData');

        OHIF.viewer.loadedSeriesData = ViewerData[contentId].loadedSeriesData;

    } else {
        log.info('Setting default ViewerData');
        OHIF.viewer.loadedSeriesData = {};
        
        ViewerData[contentId].loadedSeriesData = OHIF.viewer.loadedSeriesData;

        // Update the viewer data object
        ViewerData[contentId].viewportColumns = 2;
        ViewerData[contentId].viewportRows = 1;
        ViewerData[contentId].activeViewport = 0;
        Session.set('ViewerData', ViewerData);
    }

    Session.set('activeViewport', ViewerData[contentId].activeViewport || 0);

    // Update the ViewerStudies collection with the loaded studies
    ViewerStudies = new Meteor.Collection(null);
    this.data.studies.forEach(function(study) {
        study.selected = true;
        ViewerStudies.insert(study);
    });

    OHIF.viewer.updateImageSynchronizer = new cornerstoneTools.Synchronizer("CornerstoneNewImage", cornerstoneTools.updateImageSynchronizer);
});

Template.viewer.onDestroyed(function() {
    log.info("onDestroyed");
    OHIF.viewer.updateImageSynchronizer.destroy();
});

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