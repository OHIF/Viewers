var allCornerstoneEvents = 'CornerstoneToolsMouseDown CornerstoneToolsMouseDownActivate ' +
    'CornerstoneToolsMouseClick CornerstoneToolsMouseDrag CornerstoneToolsMouseUp ' +
    'CornerstoneToolsMouseWheel CornerstoneToolsTap CornerstoneToolsTouchPress ' +
    'CornerstoneToolsTouchStart CornerstoneToolsTouchStartActive ' +
    'CornerstoneToolsMultiTouchDragStart';

/**
 * This function loads a study series into a viewport element.
 *
 * @param data {object} Object containing the study, series, and viewport element to be used
 */
function loadSeriesIntoViewport(data, templateData) {
    log.info("imageViewerViewport loadSeriesIntoViewport");

    // Make sure we have all the data required to render the series
    if (!data.study || !data.series || !data.element) {
        return;
    }

    // Get the current element and it's index in the list of all viewports
    // The viewport index is often used to store information about a viewport element
    var element = data.element;
    var viewportIndex = $(".imageViewerViewport").index(element);

    // Get the contentID of the current worklist tab, if the viewport is running
    // alongside the worklist package
    var contentId = Session.get('activeContentId');
    
    // If the viewer is inside a tab, create an object related to the specified viewport
    // This data will be saved so that the tab can be reloaded to the same state after tabs
    // are switched
    if (contentId) {
        ViewerData[contentId].loadedSeriesData[viewportIndex] = {};
    }

    // Create an empty array to populate with image IDs
    var imageIds = [];

    // Loop through the current series and add metadata to the
    // Cornerstone meta data provider. This will be used to fill information
    // into the viewport overlays, and to calculate reference lines and orientation markers
    var series = data.series;
    var numImages = series.instances.length;
    var imageId;

    series.instances.forEach(function(instance, imageIndex) {
        var metaData = {
            instance: instance,
            series: series,
            study: data.study,
            numImages: numImages,
            imageIndex: imageIndex + 1
        };

        var numFrames = instance.numFrames;
        if (numFrames > 1) {
            log.info('Multiframe image detected');
            for (var i = 0; i < numFrames; i++) {
                metaData.frame = i;
                imageId = getImageId(instance, i);
                imageIds.push(imageId);
                addMetaData(imageId, metaData);
            }
        } else {
            imageId = getImageId(instance);
            imageIds.push(imageId);
            addMetaData(imageId, metaData);
        }
    });

    // Define the current image stack using the newly created image IDs
    var stack = {
        currentImageIdIndex: data.currentImageIdIndex || 0,
        imageIds: imageIds
    };

    // Show or hide the image scrollbar depending
    // on the number of images in the stack
    var currentOverlay = $(element).siblings('.imageViewerViewportOverlay');
    var imageControls = currentOverlay.find('.imageControls');
    currentOverlay.find('.imageControls').height($(element).height());

    if (stack.imageIds.length === 1) {
        imageControls.hide();
        currentOverlay.find('.topright, .bottomright').css('right', '3px');
    } else {
        imageControls.show();
        currentOverlay.find('.topright, .bottomright').css('right', '39px');

        // Update the maximum value of the slider
        var currentImageSlider = currentOverlay.find('#imageSlider');
        currentImageSlider.attr('max', stack.imageIds.length);
        currentImageSlider.val(1);

        // Set it's width to its parent's height
        // (because webkit is stupid and can't style vertical sliders)
        var scrollbar = currentOverlay.find('#scrollbar');
        scrollbar.height(scrollbar.parent().height() - 20);
        var overlayHeight = currentImageSlider.parent().height();
        currentImageSlider.width(overlayHeight);
    }

    // Get the current image ID for the stack that will be rendered
    imageId = imageIds[stack.currentImageIdIndex];

    // Save the current image ID inside the template data so it can be
    // retrieved from the template helpers
    templateData.imageId = imageId;

    // Save the current image ID inside the ViewportLoading object.
    // 
    // The ViewportLoading object relates the viewport elements with whichever
    // image is currently being loaded into them. This is useful so that we can
    // place progress (download %) for each image inside the proper viewports.
    ViewportLoading[viewportIndex] = imageId;
    
    // Enable Cornerstone for the viewport element
    //
    // NOTE: This uses the experimental WebGL renderer for Cornerstone!
    // If you have problems, replace it with this line instead:
    // cornerstone.enable(element);
    cornerstone.enable(element, cornerstone.webGL.renderer.render);

    // Get the handler functions that will run when loading has finished or thrown
    // an error. These are used to show/hide loading / error text boxes on each viewport.
    var endLoadingHandler = cornerstoneTools.loadHandlerManager.getEndLoadHandler();
    var errorLoadingHandler = cornerstoneTools.loadHandlerManager.getErrorLoadingHandler();

    // Start loading the image.
    cornerstone.loadAndCacheImage(imageId).then(function(image) {
        var enabledElement;
        try {
            enabledElement = cornerstone.getEnabledElement(element);
        } catch(error) {
            log.warn('Viewport destroyed before loaded image could be displayed');
            return;
        }

        // If there is a saved object containing Cornerstone viewport data
        // (e.g. scale, invert, window settings) in the input data, apply it now.
        //
        // Otherwise, display the loaded image in the viewport element with the
        // default viewport settings.
        if (data.viewport) {
            cornerstone.displayImage(element, image, data.viewport);
        } else {
            cornerstone.displayImage(element, image);
        }

        // Remove the data for this viewport from the ViewportLoading object
        // This will stop the loading percentage complete from being displayed.
        delete ViewportLoading[viewportIndex];
        
        // Call the handler function that represents the end of the image loading phase
        // (e.g. hide the progress text box)
        endLoadingHandler(element);

        // Resize the canvas to fit the current viewport element size. Fit the displayed
        // image to the canvas dimensions.
        cornerstone.resize(element, true);

        // Remove the 'empty' class from the viewport to hide any instruction text
        element.classList.remove('empty');

        // Hide the viewport instructions (i.e. 'Drag a stack here') and show
        // the viewport overlay data.
        $(element).siblings('.viewportInstructions').hide();
        $(element).siblings('.imageViewerViewportOverlay').show();

        // Add stack state managers for the stack tool, CINE tool, and reference lines
        cornerstoneTools.addStackStateManager(element, [ 'stack', 'playClip', 'referenceLines' ]);

        // Get the current viewport settings
        var viewport = cornerstone.getViewport(element);

        // Enable orientation markers, if applicable
        updateOrientationMarkers(element);

        // Clear any old stack data
        cornerstoneTools.clearToolState(element, 'stack');
        cornerstoneTools.addToolState(element, 'stack', stack);

        // Enable mouse, mouseWheel, touch, and keyboard input on the element
        cornerstoneTools.mouseInput.enable(element);
        cornerstoneTools.touchInput.enable(element);
        cornerstoneTools.mouseWheelInput.enable(element);
        cornerstoneTools.keyboardInput.enable(element);

        // Use the tool manager to enable the currently active tool for this
        // newly rendered element
        var activeTool = toolManager.getActiveTool();
        toolManager.setActiveTool(activeTool, [element]);

        // Define a function to run whenever the Cornerstone viewport is rendered
        // (e.g. following a change of window or zoom)
        function onImageRendered(e, eventData) {
            log.info('imageViewerViewport onImageRendered');

            // Use Session to trigger reactive updates in the viewportOverlay helper functions
            // This lets the viewport overlay always display correct window / zoom values
            Session.set('CornerstoneImageRendered' + viewportIndex, Random.id());

            // Save the current viewport into the ViewerData global variable, as well as the
            // Meteor Session. This lets the viewport be saved/reloaded on a hot-code reload
            var viewport = cornerstone.getViewport(element);
            ViewerData[contentId].loadedSeriesData[viewportIndex].viewport = viewport;
            Session.set('ViewerData', ViewerData);
        }

        // Attach the onImageRendered callback to the CornerstoneImageRendered event
        $(element).off('CornerstoneImageRendered', onImageRendered);
        $(element).on('CornerstoneImageRendered', onImageRendered);

        // Set a random value for the Session variable in order to trigger an overlay update
        Session.set('CornerstoneImageRendered' + viewportIndex, Random.id());

        // Define a function to run whenever the Cornerstone viewport changes images
        // (e.g. during scrolling)
        function onNewImage(e, eventData) {
            log.info('imageViewerViewport onNewImage');

            // Update the templateData with the new imageId
            // This allows the template helpers to update reactively
            templateData.imageId = eventData.enabledElement.image.imageId;
            Session.set('CornerstoneNewImage' + viewportIndex, Random.id());

            // If this viewport is displaying a stack of images, save the current image
            // index in the stack to the global ViewerData object, as well as the Meteor Session.
            var stack = cornerstoneTools.getToolState(element, 'stack');
            if (stack && stack.data.length && stack.data[0].imageIds.length > 1) {
                var imageIdIndex = stack.data[0].imageIds.indexOf(templateData.imageId);
                ViewerData[contentId].loadedSeriesData[viewportIndex].currentImageIdIndex = imageIdIndex;
                Session.set('ViewerData', ViewerData);
            }
        }

        // Attach the onNewImage callback to the CornerstoneNewImage event
        $(element).off('CornerstoneNewImage', onNewImage);
        $(element).on('CornerstoneNewImage', onNewImage);

        // Set a random value for the Session variable in order to trigger an overlay update
        Session.set('CornerstoneNewImage' + viewportIndex, Random.id());

        function OnStackScroll(e, eventData) {
            // Get the element and stack data
            var element = e.target;
            var toolData = cornerstoneTools.getToolState(element, 'stack');
            if (!toolData || !toolData.data || !toolData.data.length) {
                return;
            }

            var stack = toolData.data[0];

            // Update the imageSlider value
            var currentOverlay = $(element).siblings('.imageViewerViewportOverlay');
            var currentImageSlider = currentOverlay.find('#imageSlider');
            currentImageSlider.val(stack.currentImageIdIndex + 1);
        }

        $(element).off('CornerstoneStackScroll', OnStackScroll);
        if (stack.imageIds.length > 1) {
            $(element).on('CornerstoneStackScroll', OnStackScroll);
        }


        // Define a function to trigger an event whenever a new viewport is being used
        // This is used to update the value of the "active viewport", when the user interacts
        // with a new viewport element
        function sendActivationTrigger(e, eventData) {
            // Check if the current active viewport in the Meteor Session
            // Is the same as the viewport in which the activation event was fired.
            // If it was, no changes are necessary, so stop here.
            var element = eventData.element;
            var activeViewportIndex = Session.get('activeViewport');
            var viewportIndex = $(".imageViewerViewport").index(element);

            // Reset the focus, even if we don't need to re-enable reference lines or prefetching
            $(element).focus();

            if (viewportIndex === activeViewportIndex) {
                return;
            }

            log.info('imageViewerViewport sendActivationTrigger');

            // Otherwise, trigger an 'ActivateViewport' event to be handled by the Template event
            // handler
            eventData.viewportIndex = viewportIndex;
            var customEvent = $.Event('ActivateViewport', eventData);

            // Need to overwrite the type set in the original event
            customEvent.type = 'ActivateViewport';
            $(e.target).trigger(customEvent, eventData);
        }

        // Attach the sendActivationTrigger function to all of the Cornerstone interaction events
        $(element).off(allCornerstoneEvents, sendActivationTrigger);
        $(element).on(allCornerstoneEvents, sendActivationTrigger);

        // Store the current series data inside a global variable
        OHIF.viewer.loadedSeriesData[viewportIndex] = {
            studyInstanceUid: data.studyInstanceUid,
            seriesInstanceUid: data.seriesInstanceUid,
            currentImageIdIndex: data.currentImageIdIndex,
            viewport: viewport
        };
        ViewerData[contentId].loadedSeriesData = OHIF.viewer.loadedSeriesData;
        
        // Check if image plane (orientation / loction) data is present for the current image
        var imagePlane = cornerstoneTools.metaData.get('imagePlane', image.imageId);

        // If it is, and reference lines are enabled, add this element to the global synchronizer
        // that is used for updating reference lines, and enable reference lines for this viewport.
        if (OHIF.viewer.refLinesEnabled && imagePlane && imagePlane.frameOfReferenceUID) {
            OHIF.viewer.updateImageSynchronizer.add(element);
        }

        // Set the active viewport based on the Session variable
        // This is done to ensure that the active element has the current
        // focus, so that keyboard events are triggered.
        if (viewportIndex === Session.get('activeViewport')) {
            setActiveViewport(element);
        }

        // Run any renderedCallback that exists in the data context
        if (data.renderedCallback && typeof data.renderedCallback === "function") {
            data.renderedCallback(element);
        }
    }, function(error) {
        // If something goes wrong while loading the image, fire the error handler.
        errorLoadingHandler(element, imageId, error);
    });
}

/**
 * This function sets series for the study and calls LoadSeriesIntoViewport function
 *
 * @param data includes study data
 * @param seriesInstanceUid series information which is loaded in Template
 * @param templateData currentData of Template
 *
 */
function setSeries(data, seriesInstanceUid, templateData){
    var study = data.study;
    study.seriesList.every(function(series) {
        if (series.seriesInstanceUid === seriesInstanceUid) {
            data.series = series;
            return false;
        }
        return true;
    });

    // If we didn't find anything, stop here
    if (!data.series) {
        return;
    }

    // Otherwise, load pass the data object into loadSeriesIntoViewport
    loadSeriesIntoViewport(data, templateData);
}

/**
 * This function searches an object to return the keys that contain a specific value
 *
 * @param object {object} The object to be searched
 * @param value The value to be found
 *
 * @returns {array} The keys for which the object has the specified value
 */
function getKeysByValue(object, value) {
    // http://stackoverflow.com/questions/9907419/javascript-object-get-key-by-value
    return Object.keys(object).filter(function(key) {
        return object[key] === value;
    });
}


Meteor.startup(function() {
    // On Meteor startup, define the global objects used to store loading imageIds
    // by viewport / thumbnail element
    ViewportLoading = {};
    ThumbnailLoading = {};

    // Whenever the CornerstoneImageLoadProgress is fired, identify which viewports
    // the "in-progress" image is to be displayed in. Then pass the percent complete
    // via the Meteor Session to the other templates to be displayed in the relevant viewports.
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

    var config = {
        magnifySize: 300,
        magnificationLevel: 3
    };

    cornerstoneTools.magnify.setConfiguration(config);
});

Template.imageViewerViewport.onRendered(function() {
    var templateData = Template.currentData();
    log.info("imageViewerViewport onRendered");

    // When the imageViewerViewport template is rendered
    var element = this.find(".imageViewerViewport");

    // Display the loading indicator for this element
    $(element).siblings('.imageViewerLoadingIndicator').css('display', 'block');

    // Get the current active viewport index, if this viewport has the same index,
    // add the CSS 'active' class to highlight this viewport.
    var activeViewport = Session.get('activeViewport');

    // Create a data object to pass to the series loading function (loadSeriesIntoViewport)
    var data = {
        element: element,
        viewport: this.data.viewport,
        currentImageIdIndex: this.data.currentImageIdIndex,
        studyInstanceUid: this.data.studyInstanceUid,
        seriesInstanceUid: this.data.seriesInstanceUid,
        renderedCallback: this.data.renderedCallback,
        activeViewport: activeViewport
    };

    // If no seriesInstanceUid or studyInstanceUid were supplied, display the drag/drop
    // instructions and then stop here since we don't know what to display in the viewport.
    if (!this.data.seriesInstanceUid || !this.data.studyInstanceUid) {
        element.classList.add('empty');
        $(element).siblings('.imageViewerLoadingIndicator').css('display', 'none');
        $(element).siblings('.viewportInstructions').show();
        return;
    }

    // Look through the ViewerStudies collection for a
    // study with this studyInstanceUid
    var study = ViewerStudies.findOne({
        studyInstanceUid: this.data.studyInstanceUid
    });
    var seriesInstanceUid = this.data.seriesInstanceUid;

    // TODO: This code block might be refactored
    // Load previous measurement study when reloading a patient
    if (!study) {
        Meteor.call('GetStudyMetadata', this.data.studyInstanceUid, function(error, study) {
            // Once we have retrieved the data, we sort the series' by series
            // and instance number in ascending order
            if(!study){
                return;
            }
            sortStudy(study);
            data.study = study;

            setSeries(data, seriesInstanceUid, templateData);
        });
    }

    data.study = study;
    setSeries(data, seriesInstanceUid, templateData);
});

Template.imageViewerViewport.onDestroyed(function() {
    log.info("imageViewerViewport onDestroyed");

    // When a viewport element is being destroyed
    var element = this.find(".imageViewerViewport");
    
    // Try to stop any currently playing clips
    // Otherwise the interval will continuously throw errors
    try {
        cornerstoneTools.stopClip(element);
    } catch(error) {
        log.warn(error);
    }

    // Disable the viewport element with Cornerstone
    // This also triggers the removal of the element from all available
    // synchronizers, such as the one used for reference lines.
    cornerstone.disable(element);
});

Template.imageViewerViewport.events({
    'ActivateViewport .imageViewerViewport': function(e) {
        log.info("imageViewerViewport ActivateViewport");
        setActiveViewport(e.currentTarget);
    }
});