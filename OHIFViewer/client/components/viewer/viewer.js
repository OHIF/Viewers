Template.viewer.onCreated(function() {
    // Attach the Window resize listener
    $(window).on('resize', handleResize);
    $('.navbar').width('100%');

    Meteor.subscribe('hangingprotocols');

    log.info('viewer onCreated');

    OHIF = window.OHIF || {
        viewer: {}
    };

    OHIF.viewer.loadIndicatorDelay = 500;
    OHIF.viewer.defaultTool = 'wwwc';
    OHIF.viewer.refLinesEnabled = true;
    OHIF.viewer.isPlaying = {};
    OHIF.viewer.cine = {
        framesPerSecond: 24,
        loop: true
    };

    OHIF.viewer.functionList = {
        invert: function(element) {
            var viewport = cornerstone.getViewport(element);
            viewport.invert = !viewport.invert;
            cornerstone.setViewport(element, viewport);
        },
        resetViewport: function(element) {
            var enabledElement = cornerstone.getEnabledElement(element);
            if (enabledElement.fitToWindow === false) {
                var imageId = enabledElement.image.imageId;
                var instance = cornerstoneTools.metaData.get('instance', imageId);

                enabledElement.viewport = cornerstone.getDefaultViewport(enabledElement.canvas, enabledElement.image);
                var instanceClassDefaultViewport = getInstanceClassDefaultViewport(instance, enabledElement, imageId);
                cornerstone.setViewport(element, instanceClassDefaultViewport);
            } else {
                cornerstone.reset(element);
            }
        },
        clearTools: function(element) {
            var toolStateManager = cornerstoneTools.globalImageIdSpecificToolStateManager;
            toolStateManager.clear(element);
            cornerstone.updateImage(element);
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
        ViewerData[contentId].viewportColumns = 1;
        ViewerData[contentId].viewportRows = 1;
        ViewerData[contentId].activeViewport = 0;
        Session.set('ViewerData', ViewerData);
    }

    Session.set('activeViewport', ViewerData[contentId].activeViewport || 0);

    // Update the ViewerStudies collection with the loaded studies
    ViewerStudies.remove({});
    
    this.data.studies.forEach(function(study) {
        study.selected = true;
        ViewerStudies.insert(study);
    });
});

Template.viewer.onRendered(function() {
    // Enable hotkeys
    enableHotkeys();

    var parentNode = document.getElementById('layoutManagerTarget');
    var studies = this.data.studies;
    layoutManager = new LayoutManager(parentNode, studies);

    ProtocolEngine = new HP.ProtocolEngine(layoutManager, studies);
    HP.setEngine(ProtocolEngine);
});

Template.viewer.onDestroyed(function() {
    log.info('onDestroyed');

    // Remove the Window resize listener
    $(window).off('resize', handleResize);
});
