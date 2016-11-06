import { OHIF } from 'meteor/ohif:core';

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
function loadDisplaySetIntoViewport(data, templateData) {
    OHIF.log.info('imageViewerViewport loadDisplaySetIntoViewport');

    // Make sure we have all the data required to render the series
    if (!data.study || !data.displaySet || !data.element) {
        OHIF.log.warn('loadDisplaySetIntoViewport: No Study, Display Set, or Element provided');
        return;
    }

    // Get the current element and it's index in the list of all viewports
    // The viewport index is often used to store information about a viewport element
    var element = data.element;
    var viewportIndex = $('.imageViewerViewport').index(element);

    let layoutManager = window.layoutManager;
    layoutManager.viewportData = layoutManager.viewportData || {};
    layoutManager.viewportData[viewportIndex] = layoutManager.viewportData[viewportIndex] || {};
    layoutManager.viewportData[viewportIndex].viewportIndex = viewportIndex;

    // Get the contentID of the current study list tab, if the viewport is running
    // alongside the study list package
    var contentId = Session.get('activeContentId');

    // If the viewer is inside a tab, create an object related to the specified viewport
    // This data will be saved so that the tab can be reloaded to the same state after tabs
    // are switched
    if (contentId) {
        if (!ViewerData[contentId]) {
            return;
        }

        ViewerData[contentId].loadedSeriesData[viewportIndex] = {};
    }

    // Create an empty array to populate with image IDs
    var imageIds = [];

    // Loop through the current series and add metadata to the
    // Cornerstone meta data provider. This will be used to fill information
    // into the viewport overlays, and to calculate reference lines and orientation markers
    var displaySet = data.displaySet;
    var numImages = displaySet.images.length;
    var imageId;

    displaySet.images.forEach(function(image, imageIndex) {
        var metaData = {
            instance: image,
            series: displaySet, // TODO: Check this
            study: data.study,
            numImages: numImages,
            imageIndex: imageIndex + 1
        };

        var numFrames = image.numFrames;
        if (numFrames > 1) {
            OHIF.log.info('Multiframe image detected');
            for (var i = 0; i < numFrames; i++) {
                metaData.frame = i;
                imageId = getImageId(image, i);
                imageIds.push(imageId);
                addMetaData(imageId, metaData);
            }
        } else {
            imageId = getImageId(image);
            imageIds.push(imageId);
            addMetaData(imageId, metaData);
        }
    });

    // Define the current image stack using the newly created image IDs
    var stack = {
        currentImageIdIndex: data.currentImageIdIndex || 0,
        imageIds: imageIds
    };

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
    var options = {
        renderer: 'webgl'
    };

    // NOTE: This uses the experimental WebGL renderer for Cornerstone!
    // If you have problems, replace it with this line instead:
    // cornerstone.enable(element);
    cornerstone.enable(element, options);

    // Get the handler functions that will run when loading has finished or thrown
    // an error. These are used to show/hide loading / error text boxes on each viewport.
    var endLoadingHandler = cornerstoneTools.loadHandlerManager.getEndLoadHandler();
    var errorLoadingHandler = cornerstoneTools.loadHandlerManager.getErrorLoadingHandler();

    // Get the current viewport settings
    var viewport = cornerstone.getViewport(element);

    // Store the current series data inside the Layout Manager
    layoutManager.viewportData[viewportIndex] = {
        imageId: imageId,
        studyInstanceUid: data.studyInstanceUid,
        seriesInstanceUid: data.seriesInstanceUid,
        displaySetInstanceUid: data.displaySetInstanceUid,
        currentImageIdIndex: data.currentImageIdIndex,
        viewport: viewport,
        viewportIndex: viewportIndex
    };

    // Start loading the image.
    cornerstone.loadAndCacheImage(imageId).then(function(image) {
        var enabledElement;
        try {
            enabledElement = cornerstone.getEnabledElement(element);
        } catch (error) {
            OHIF.log.warn('Viewport destroyed before loaded image could be displayed');
            return;
        }

        // Update the enabled element with the image and viewport data
        // This is not usually necessary, but we need them stored in case
        // a sopClassUid-specific viewport setting is present.
        enabledElement.image = image;
        enabledElement.viewport = cornerstone.getDefaultViewport(enabledElement.canvas, image);

        // Update the metaData for missing fields
        updateMetaData(image);

        // Check if there are default viewport settings for this sopClassUid
        if (!displaySet.images || !displaySet.images.length) {
            return;
        }

        var instance = displaySet.images[0];
        var instanceClassViewport = getInstanceClassDefaultViewport(instance, enabledElement, image.imageId);

        // If there are sopClassUid-specific viewport settings, apply them
        if (instanceClassViewport) {
            cornerstone.displayImage(element, image, instanceClassViewport);

            // Mark that this element should not be fit to the window in the resize listeners
            // TODO: Find another way to do this?
            enabledElement.fitToWindow = false;

            // Resize the canvas to fit the current viewport element size.
            cornerstone.resize(element, false);
        } else if (data.viewport) {
            // If there is a saved object containing Cornerstone viewport data
            // (e.g. scale, invert, window settings) in the input data, apply it now.
            cornerstone.displayImage(element, image, data.viewport);

            // Resize the canvas to fit the current viewport element size. Fit the displayed
            // image to the canvas dimensions.
            cornerstone.resize(element, true);
        } else {
            // If no saved viewport settings or modality-specific settings exists,
            // display the loaded image in the viewport element with no loaded viewport
            // settings.
            cornerstone.displayImage(element, image);

            // Resize the canvas to fit the current viewport element size. Fit the displayed
            // image to the canvas dimensions.
            cornerstone.resize(element, true);
        }

        // Remove the data for this viewport from the ViewportLoading object
        // This will stop the loading percentage complete from being displayed.
        delete ViewportLoading[viewportIndex];

        // Call the handler function that represents the end of the image loading phase
        // (e.g. hide the progress text box)
        endLoadingHandler(element);

        // Remove the 'empty' class from the viewport to hide any instruction text
        element.classList.remove('empty');

        // Hide the viewport instructions (i.e. 'Drag a stack here') and show
        // the viewport overlay data.
        $(element).siblings('.viewportInstructions').hide();
        $(element).siblings('.imageViewerViewportOverlay').show();

        // Add stack state managers for the stack tool, CINE tool, and reference lines
        cornerstoneTools.addStackStateManager(element, ['stack', 'playClip', 'referenceLines']);

        // Enable orientation markers, if applicable
        updateOrientationMarkers(element);

        // Clear any old stack data
        cornerstoneTools.clearToolState(element, 'stack');
        cornerstoneTools.addToolState(element, 'stack', stack);

        // Set the default CINE settings
        var multiframeMetadata = instance.multiframeMetadata;

        let fps;
        if (multiframeMetadata) {
            fps = multiframeMetadata.averageFrameRate
        } else {
            fps = OHIF.viewer.cine.framesPerSecond
        }

        var cineToolData = {
            loop: OHIF.viewer.cine.loop,
            framesPerSecond: fps
        };

        cornerstoneTools.addToolState(element, 'playClip', cineToolData);

        // Autoplay datasets that have framerates set
        if (multiframeMetadata && multiframeMetadata.isMultiframeImage && multiframeMetadata.averageFrameRate > 0) {
            cornerstoneTools.playClip(element);
        }

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
            OHIF.log.info('imageViewerViewport onImageRendered');

            if (!layoutManager.viewportData[viewportIndex]) {
                OHIF.log.warn("onImageRendered: LayoutManager has no viewport data for this viewport index?: " + viewportIndex);
            }

            // Use Session to trigger reactive updates in the viewportOverlay helper functions
            // This lets the viewport overlay always display correct window / zoom values
            Session.set('CornerstoneImageRendered' + viewportIndex, Random.id());

            // Save the current viewport into the ViewerData global variable, as well as the
            // Meteor Session. This lets the viewport be saved/reloaded on a hot-code reload
            var viewport = cornerstone.getViewport(element);
            layoutManager.viewportData[viewportIndex].viewport = viewport;
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
            OHIF.log.info('imageViewerViewport onNewImage');

            // Update the metaData for missing fields
            updateMetaData(eventData.enabledElement.image);

            // Update the templateData with the new imageId
            // This allows the template helpers to update reactively
            templateData.imageId = eventData.enabledElement.image.imageId;
            Session.set('CornerstoneNewImage' + viewportIndex, Random.id());
            layoutManager.viewportData[viewportIndex].imageId = eventData.enabledElement.image.imageId;

            // Get the element and stack data
            var element = e.target;
            var toolData = cornerstoneTools.getToolState(element, 'stack');
            if (!toolData || !toolData.data || !toolData.data.length) {
                return;
            }

            var stack = toolData.data[0];

            // If this viewport is displaying a stack of images, save the current image
            // index in the stack to the global ViewerData object, as well as the Meteor Session.
            var stack = cornerstoneTools.getToolState(element, 'stack');
            if (stack && stack.data.length && stack.data[0].imageIds.length > 1) {
                var imageIdIndex = stack.data[0].imageIds.indexOf(templateData.imageId);
                layoutManager.viewportData[viewportIndex].currentImageIdIndex = imageIdIndex;
                ViewerData[contentId].loadedSeriesData[viewportIndex].currentImageIdIndex = imageIdIndex;
                Session.set('ViewerData', ViewerData);
            }
        }

        // Attach the onNewImage callback to the CornerstoneNewImage event
        $(element).off('CornerstoneNewImage', onNewImage);
        $(element).on('CornerstoneNewImage', onNewImage);

        // Set a random value for the Session variable in order to trigger an overlay update
        Session.set('CornerstoneNewImage' + viewportIndex, Random.id());

        // Define a function to trigger an event whenever a new viewport is being used
        // This is used to update the value of the "active viewport", when the user interacts
        // with a new viewport element
        function sendActivationTrigger(e, eventData) {
            // Check if the current active viewport in the Meteor Session
            // Is the same as the viewport in which the activation event was fired.
            // If it was, no changes are necessary, so stop here.
            var element = eventData.element;
            var activeViewportIndex = Session.get('activeViewport');
            var viewportIndex = $('.imageViewerViewport').index(element);

            // Reset the focus, even if we don't need to re-enable reference lines or prefetching
            $(element).focus();

            if (viewportIndex === activeViewportIndex) {
                return;
            }

            OHIF.log.info('imageViewerViewport sendActivationTrigger');

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

        ViewerData[contentId].loadedSeriesData = layoutManager.viewportData;

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
        if (data.renderedCallback && typeof data.renderedCallback === 'function') {
            data.renderedCallback(element);
        }

        // Update the LayoutManagerUpdated session key
        layoutManager.updateSession();
    }, function(error) {
        // If something goes wrong while loading the image, fire the error handler.
        errorLoadingHandler(element, imageId, error);
    });
}

/**
 * This function sets the display set for the study and calls LoadDisplaySetIntoViewport function
 *
 * @param data includes study data
 * @param displaySetInstanceUid Display set information which is loaded in Template
 * @param templateData currentData of Template
 *
 */
function setDisplaySet(data, displaySetInstanceUid, templateData) {
    var study = data.study;
    if (!study || !study.displaySets) {
        throw 'Study does not exist or has no display sets';
    }

    study.displaySets.every(displaySet => {
        if (displaySet.displaySetInstanceUid === displaySetInstanceUid) {
            data.displaySet = displaySet;
            return false;
        }

        return true;
    });

    // If we didn't find anything, stop here
    if (!data.displaySet) {
        throw 'Display set not found in specified study!';
    }

    // Otherwise, load pass the data object into loadSeriesIntoViewport
    loadDisplaySetIntoViewport(data, templateData);
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
    return Object.keys(object).filter(key => object[key] === value);
}

Meteor.startup(function() {
    // On Meteor startup, define the global objects used to store loading imageIds
    // by viewport / thumbnail element
    ViewportLoading = {};

    // Whenever the CornerstoneImageLoadProgress is fired, identify which viewports
    // the "in-progress" image is to be displayed in. Then pass the percent complete
    // via the Meteor Session to the other templates to be displayed in the relevant viewports.
    $(cornerstone).on('CornerstoneImageLoadProgress', function(e, eventData) {
        viewportIndices = getKeysByValue(ViewportLoading, eventData.imageId);
        viewportIndices.forEach(function(viewportIndex) {
            Session.set('CornerstoneLoadProgress' + viewportIndex, eventData.percentComplete);
        });

        const encodedId = OHIF.string.encodeId(eventData.imageId);
        Session.set('CornerstoneThumbnailLoadProgress' + encodedId, eventData.percentComplete);
    });

    const config = {
        magnifySize: 300,
        magnificationLevel: 3
    };

    cornerstoneTools.magnify.setConfiguration(config);
});

Template.imageViewerViewport.onRendered(function() {
    var templateData = Template.currentData();
    OHIF.log.info('imageViewerViewport onRendered');

    // When the imageViewerViewport template is rendered
    var element = this.find('.imageViewerViewport');
    this.element = element;

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
        displaySetInstanceUid: this.data.displaySetInstanceUid,
        studyInstanceUid: this.data.studyInstanceUid,
        seriesInstanceUid: this.data.seriesInstanceUid,
        renderedCallback: this.data.renderedCallback,
        activeViewport: activeViewport
    };

    // If no displaySetInstanceUid was supplied, display the drag/drop
    // instructions and then stop here since we don't know what to display in the viewport.
    if (!this.data.displaySetInstanceUid) {
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
    var displaySetInstanceUid = this.data.displaySetInstanceUid;

    data.study = study;
    setDisplaySet(data, displaySetInstanceUid, templateData);
});

Template.imageViewerViewport.onDestroyed(function() {
    OHIF.log.info('imageViewerViewport onDestroyed');

    // When a viewport element is being destroyed
    var element = this.find('.imageViewerViewport');
    if (!element || !$(element).find('canvas').length) {
        return;
    }

    // Try to stop any currently playing clips
    // Otherwise the interval will continuously throw errors
    try {
        var enabledElement = cornerstone.getEnabledElement(this.element);
        if (enabledElement) {
            cornerstoneTools.stopClip(this.element);
        }
    } catch (error) {
        OHIF.log.warn(error);
    }

    // Disable the viewport element with Cornerstone
    // This also triggers the removal of the element from all available
    // synchronizers, such as the one used for reference lines.
    cornerstone.disable(this.element);
});

Template.imageViewerViewport.events({
    'ActivateViewport .imageViewerViewport'(event) {
        OHIF.log.info('imageViewerViewport ActivateViewport');
        setActiveViewport(event.currentTarget);
    },

    'click .imageViewerViewport'(event) {
        setActiveViewport(event.currentTarget);
    },

    'CornerstoneToolsMouseDoubleClick .imageViewerViewport, CornerstoneToolsDoubleTap .imageViewerViewport'(event) {
        // Get the double clicked viewport index
        const viewportIndex = $('.imageViewerViewport').index(event.currentTarget);

        // Enlarge the double clicked viewport
        layoutManager.toggleEnlargement(viewportIndex);

        // Wait for DOM re-rendering and update the active viewport
        Tracker.afterFlush(() => {
            // Check if the viewer is zoomed
            if (layoutManager.isZoomed) {
                // Set the active viewport as the only one visible
                setActiveViewport($('.imageViewerViewport')[0]);
            } else {
                // Set the active viewport as the previous zoomed viewport
                setActiveViewport($('.imageViewerViewport').eq(window.layoutManager.zoomedViewportIndex));
            }
        });
    }
});
