/**
 * This function enables stack prefetching for a specified element (viewport)
 * It first disables any prefetching currently occurring on any other viewports.
 * Prefetching will not be enabled if the series is a clip.
 *
 * @param element
 */
function enablePrefetchOnElement(viewportIndex) {
    log.info("imageViewerViewport enablePrefetchOnElement");

    var element = $('.imageViewerViewport').get(viewportIndex);

    // Loop through all viewports and disable stackPrefetch
    $('.imageViewerViewport').each(function() {
        if (!$(this).find('canvas').length) {
            return;
        }
        cornerstoneTools.stackPrefetch.disable(this);
    });

    // Make sure there is a stack to fetch
    var stack = cornerstoneTools.getToolState(element, 'stack');
    if (stack && stack.data.length && stack.data[0].imageIds.length > 1) {
        cornerstoneTools.stackPrefetch.enable(element);
    }
}

function displayReferenceLines(viewportIndex) {
    log.info("imageViewerViewport displayReferenceLines");

    var element = $('.imageViewerViewport').get(viewportIndex);

    $('.imageViewerViewport').each(function(index, element) {
        var imageId;
        try {
            var enabledElement = cornerstone.getEnabledElement(element);
            imageId = enabledElement.image.imageId;
        } catch(error) {
            return;
        }

        if (!imageId || !$(this).find('canvas').length) {
            return;
        }

        if (index === viewportIndex) {
            cornerstoneTools.referenceLines.tool.disable(element);
            return;
        }
        cornerstoneTools.referenceLines.tool.enable(element, OHIF.viewer.updateImageSynchronizer);
    });
}

function loadSeriesIntoViewport(data) {
    log.info("imageViewerViewport loadSeriesIntoViewport");

    if (!data.series || !data.element) {
        return;
    }

    var contentId = Session.get('activeContentId');
    

    var study = data.study;
    var series = data.series;
    var element = data.element;
    var viewportIndex = $(".imageViewerViewport").index(element);

    ViewerData[contentId].loadedSeriesData[viewportIndex] = {};

    var allEvents = 'CornerstoneToolsMouseDown CornerstoneToolsMouseDownActivate ' +
        'CornerstoneToolsMouseClick CornerstoneToolsMouseDrag CornerstoneToolsMouseUp ' +
        'CornerstoneToolsMouseWheel CornerstoneToolsTap CornerstoneToolsTouchPress ' +
        'CornerstoneToolsTouchStart CornerstoneToolsTouchStartActive ' +
        'CornerstoneToolsDragStartActive CornerstoneToolsMultiTouchDragStart';

    var imageIds = [];
    var numImages = series.instances.length;
    series.instances.forEach(function(instance, imageIndex) {
        var imageId = getImageId(instance);
        imageIds.push(imageId);
        var data = {
            instance: instance,
            series: series,
            study: study,
            numImages: numImages,
            imageIndex: imageIndex + 1
        };
        addMetaData(imageId, data);
    });

    var stack = {
        currentImageIdIndex: data.currentImageIdIndex || 0,
        imageIds: imageIds
    };

    var imageId = imageIds[stack.currentImageIdIndex];

    var templateData = Template.currentData();
    templateData.imageId = imageId;

    // NOTE: This uses the experimental WebGL renderer for Cornerstone!
    cornerstone.enable(element, cornerstone.webGL.renderer.render);
    // If you have problems, replace it with this line instead:
    // cornerstone.enable(element);


    var endLoadingHandler = cornerstoneTools.loadHandlerManager.getEndLoadHandler();
    var errorLoadingHandler = cornerstoneTools.loadHandlerManager.getErrorLoadingHandler();

    ViewportLoading[viewportIndex] = imageId;

    cornerstone.loadAndCacheImage(imageId).then(function(image) {
        if (data.viewport) {
            cornerstone.displayImage(element, image, data.viewport);
        } else {
            cornerstone.displayImage(element, image);
        }
        delete ViewportLoading[viewportIndex];
        
        endLoadingHandler(element);

        cornerstone.resize(element, true);

        element.classList.remove('empty');
        $(element).siblings('.viewportInstructions').hide();
        $(element).siblings('.imageViewerViewportOverlay').show();

        var imagePlane = cornerstoneTools.metaData.get('imagePlane', image.imageId);

        cornerstoneTools.addStackStateManager(element, [ 'stack', 'playClip', 'referenceLines' ]);

        // Enable orientation markers, if applicable
        var viewport = cornerstone.getViewport(element);
        updateOrientationMarkers(element, viewport);

        // Clear any old stack data
        cornerstoneTools.clearToolState(element, 'stack');
        cornerstoneTools.addToolState(element, 'stack', stack);

        // Enable mouse input
        cornerstoneTools.mouseInput.enable(element);
        cornerstoneTools.touchInput.enable(element);
        cornerstoneTools.mouseWheelInput.enable(element);

        var activeTool = toolManager.getActiveTool();
        toolManager.setActiveTool(activeTool);

        cornerstoneTools.magnify.enable(element);

        function onImageRendered(e, eventData) {
            log.info('imageViewerViewport onImageRendered');

            Session.set('CornerstoneImageRendered' + viewportIndex, Random.id());
            var viewport = cornerstone.getViewport(element);
            ViewerData[contentId].loadedSeriesData[viewportIndex].viewport = viewport;
            Session.set('ViewerData', ViewerData);
        }

        $(element).off('CornerstoneImageRendered', onImageRendered);
        $(element).on('CornerstoneImageRendered', onImageRendered);
        Session.set('CornerstoneImageRendered' + viewportIndex, Random.id());

        function onNewImage(e, eventData) {
            log.info('imageViewerViewport onNewImage');

            // Update the templateData with the new imageId
            // This allows the template helpers to update reactively
            templateData.imageId = eventData.enabledElement.image.imageId;
            Session.set('CornerstoneNewImage' + viewportIndex, Random.id());

            var stack = cornerstoneTools.getToolState(element, 'stack');
            if (stack && stack.data.length && stack.data[0].imageIds.length > 1) {
                var imageIdIndex = stack.data[0].imageIds.indexOf(templateData.imageId);
                ViewerData[contentId].loadedSeriesData[viewportIndex].currentImageIdIndex = imageIdIndex;
                Session.set('ViewerData', ViewerData);
            }
        }

        $(element).off('CornerstoneNewImage', onNewImage);
        $(element).on('CornerstoneNewImage', onNewImage);

        function sendActivationTrigger(e, eventData) {
            log.info('imageViewerViewport sendActivationTrigger');
            var activeViewportIndex = Session.get('activeViewport');
            var viewportIndex = $(".imageViewerViewport").index(eventData.element);
            if (viewportIndex === activeViewportIndex) {
                return;
            }
            eventData.viewportIndex = viewportIndex;
            var customEvent = $.Event('ActivateViewport', eventData);

            // Need to overwrite the type set in the original event
            customEvent.type = 'ActivateViewport';
            $(e.target).trigger(customEvent, eventData);
        }

        $(element).off(allEvents, sendActivationTrigger);
        $(element).on(allEvents, sendActivationTrigger);

        Session.set('CornerstoneNewImage' + viewportIndex, Random.id());

        OHIF.viewer.loadedSeriesData[viewportIndex] = {
            studyInstanceUid: data.studyInstanceUid,
            seriesInstanceUid: data.seriesInstanceUid,
            currentImageIdIndex: data.currentImageIdIndex,
            viewport: viewport
        };
        
        if (OHIF.viewer.refLinesEnabled && imagePlane && imagePlane.frameOfReferenceUID) {
            OHIF.viewer.updateImageSynchronizer.add(element);
            displayReferenceLines(viewportIndex);
        }

    }, function(error) {
        errorLoadingHandler(element, imageId, error);
    });
}

function getKeysByValue(object, value) {
    // http://stackoverflow.com/questions/9907419/javascript-object-get-key-by-value
    return Object.keys(object).filter(function(key) {
        return object[key] === value;
    });
}

Meteor.startup(function() {
    ViewportLoading = {};
    ThumbnailLoading = {};

    $(cornerstone).on('CornerstoneImageLoadProgress', function(e, eventData) {
        viewportIndices = getKeysByValue(ViewportLoading, eventData.imageId);
        viewportIndices.forEach(function(viewportIndex) {
            Session.set('CornerstoneLoadProgress' + viewportIndex, eventData.percentComplete);
        });

        thumbnailIndices = getKeysByValue(ThumbnailLoading, eventData.imageId);
        thumbnailIndices.forEach(function(thumbnailIndex) {
            Session.set('CornerstoneThumbnailLoadProgress' + thumbnailIndex, eventData.percentComplete);
        });
    });
});

Template.imageViewerViewport.onRendered(function() {
    log.info("imageViewerViewport onRendered");

    var element = this.find(".imageViewerViewport");
    $(element).siblings('.imageViewerLoadingIndicator').css('display', 'block');

    var studies = Session.get('studies');
    var activeViewport = Session.get('activeViewport');

    if (activeViewport === this.data.viewportIndex) {
        $('#imageViewerViewports .viewportContainer').removeClass('active');
        $(element).parents('.viewportContainer').addClass('active');
    }

    var data = {
        element: element,
        viewport: this.data.viewport,
        currentImageIdIndex: this.data.currentImageIdIndex,
        studyInstanceUid: this.data.studyInstanceUid,
        seriesInstanceUid: this.data.seriesInstanceUid,
        activeViewport: activeViewport
    };

    if (this.data.seriesInstanceUid === undefined || this.data.studyInstanceUid === undefined) {
        element.classList.add('empty');
        $(element).siblings('.imageViewerLoadingIndicator').css('display', 'none');
        $(element).siblings('.viewportInstructions').show();
        return;
    }

    var studyInstanceUid = this.data.studyInstanceUid;
    var seriesInstanceUid = this.data.seriesInstanceUid;

    studies.every(function(study) {
        if (study.studyInstanceUid === studyInstanceUid) {
            data.study = study;
            study.seriesList.every(function(series) {
                if (series.seriesInstanceUid === seriesInstanceUid) {
                    data.series = series;
                    return false;
                }
                return true;
            });
            return false;
        }
        return true;
    });

    loadSeriesIntoViewport(data);
});

Template.imageViewerViewport.onDestroyed(function() {
    log.info("imageViewerViewport onDestroyed");

    var element = this.find(".imageViewerViewport");
    
    try {
        cornerstoneTools.stopClip(element);
    } catch(error) {
    }

    cornerstone.disable(element);
});

Template.imageViewerViewport.events({
    'ActivateViewport .imageViewerViewport': function(e) {
        log.info("imageViewerViewport ActivateViewport");

        Session.set("activeViewport", this.viewportIndex);
        $('#imageViewerViewports .viewportContainer').removeClass('active');
        $(e.currentTarget).parents('.viewportContainer').addClass('active');

        enablePrefetchOnElement(this.viewportIndex);
        displayReferenceLines(this.viewportIndex);
    },
});