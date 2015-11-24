/*! cornerstoneTools - v0.7.7 - 2015-11-23 | (c) 2014 Chris Hafey | https://github.com/chafey/cornerstoneTools */
// Begin Source: src/header.js
if (typeof cornerstone === 'undefined') {
    cornerstone = {};
}

if (typeof cornerstoneTools === 'undefined') {
    cornerstoneTools = {
        referenceLines: {},
        orientation: {}
    };
}
 
// End Source; src/header.js

// Begin Source: src/inputSources/mouseWheelInput.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    function mouseWheel(e) {
        // !!!HACK/NOTE/WARNING!!!
        // for some reason I am getting mousewheel and DOMMouseScroll events on my
        // mac os x mavericks system when middle mouse button dragging.
        // I couldn't find any info about this so this might break other systems
        // webkit hack
        if (e.originalEvent.type === 'mousewheel' && e.originalEvent.wheelDeltaY === 0) {
            return;
        }
        // firefox hack
        if (e.originalEvent.type === 'DOMMouseScroll' && e.originalEvent.axis === 1) {
            return;
        }

        var element = e.currentTarget;
        var startingCoords = cornerstone.pageToPixel(element, e.pageX || e.originalEvent.pageX, e.pageY || e.originalEvent.pageY);

        e = window.event || e; // old IE support
        var wheelDelta = e.wheelDelta || -e.detail || -e.originalEvent.detail;
        var direction = Math.max(-1, Math.min(1, (wheelDelta)));

        var mouseWheelData = {
            element: element,
            viewport: cornerstone.getViewport(element),
            image: cornerstone.getEnabledElement(element).image,
            direction: direction,
            pageX: e.pageX || e.originalEvent.pageX,
            pageY: e.pageY || e.originalEvent.pageY,
            imageX: startingCoords.x,
            imageY: startingCoords.y
        };

        $(element).trigger('CornerstoneToolsMouseWheel', mouseWheelData);
    }

    var mouseWheelEvents = 'mousewheel DOMMouseScroll';

    function enable(element) {
        $(element).on(mouseWheelEvents, mouseWheel);
    }

    function disable(element) {
        $(element).unbind(mouseWheelEvents, mouseWheel);
    }

    // module exports
    cornerstoneTools.mouseWheelInput = {
        enable: enable,
        disable: disable
    };

})($, cornerstone, cornerstoneTools);
 
// End Source; src/inputSources/mouseWheelInput.js

// Begin Source: src/inputSources/mouseInput.js
(function($, cornerstone, cornerstoneMath, cornerstoneTools) {

    'use strict';

    var isClickEvent;
    var preventClickTimeout;
    var clickDelay = 200;

    function preventClickHandler() {
        isClickEvent = false;
    }

    function activateMouseDown(mouseEventDetail) {
        $(mouseEventDetail.element).trigger('CornerstoneToolsMouseDownActivate', mouseEventDetail);
    }

    function mouseDoubleClick(e) {
        var element = e.currentTarget;
        var eventType = 'CornerstoneToolsMouseDoubleClick';

        var startPoints = {
            page: cornerstoneMath.point.pageToPoint(e),
            image: cornerstone.pageToPixel(element, e.pageX, e.pageY),
            client: {
                x: e.clientX,
                y: e.clientY
            }
        };
        startPoints.canvas = cornerstone.pixelToCanvas(element, startPoints.image);

        var lastPoints = cornerstoneTools.copyPoints(startPoints);
        var eventData = {
            event: e,
            which: e.which,
            viewport: cornerstone.getViewport(element),
            image: cornerstone.getEnabledElement(element).image,
            element: element,
            startPoints: startPoints,
            lastPoints: lastPoints,
            currentPoints: startPoints,
            deltaPoints: {
                x: 0,
                y: 0
            },
            type: eventType
        };

        var event = $.Event(eventType, eventData);
        $(eventData.element).trigger(event, eventData);
    }

    function mouseDown(e) {
        preventClickTimeout = setTimeout(preventClickHandler, clickDelay);

        var element = e.currentTarget;
        var eventType = 'CornerstoneToolsMouseDown';

        // Prevent CornerstoneToolsMouseMove while mouse is down
        $(element).off('mousemove', mouseMove);

        var startPoints = {
            page: cornerstoneMath.point.pageToPoint(e),
            image: cornerstone.pageToPixel(element, e.pageX, e.pageY),
            client: {
                x: e.clientX,
                y: e.clientY
            }
        };
        startPoints.canvas = cornerstone.pixelToCanvas(element, startPoints.image);

        var lastPoints = cornerstoneTools.copyPoints(startPoints);
        var eventData = {
            event: e,
            which: e.which,
            viewport: cornerstone.getViewport(element),
            image: cornerstone.getEnabledElement(element).image,
            element: element,
            startPoints: startPoints,
            lastPoints: lastPoints,
            currentPoints: startPoints,
            deltaPoints: {
                x: 0,
                y: 0
            },
            type: eventType
        };

        var event = $.Event(eventType, eventData);
        $(eventData.element).trigger(event, eventData);

        if (event.isImmediatePropagationStopped() === false) {
            // no tools responded to this event, give the active tool a chance
            if (activateMouseDown(eventData) === true) {
                return cornerstoneTools.pauseEvent(e);
            }
        }

        var whichMouseButton = e.which;

        function onMouseMove(e) {
            // calculate our current points in page and image coordinates
            var eventType = 'CornerstoneToolsMouseDrag';
            var currentPoints = {
                page: cornerstoneMath.point.pageToPoint(e),
                image: cornerstone.pageToPixel(element, e.pageX, e.pageY),
                client: {
                    x: e.clientX,
                    y: e.clientY
                }
            };
            currentPoints.canvas = cornerstone.pixelToCanvas(element, currentPoints.image);

            // Calculate delta values in page and image coordinates
            var deltaPoints = {
                page: cornerstoneMath.point.subtract(currentPoints.page, lastPoints.page),
                image: cornerstoneMath.point.subtract(currentPoints.image, lastPoints.image),
                client: cornerstoneMath.point.subtract(currentPoints.client, lastPoints.client),
                canvas: cornerstoneMath.point.subtract(currentPoints.canvas, lastPoints.canvas)
            };

            var eventData = {
                which: whichMouseButton,
                viewport: cornerstone.getViewport(element),
                image: cornerstone.getEnabledElement(element).image,
                element: element,
                startPoints: startPoints,
                lastPoints: lastPoints,
                currentPoints: currentPoints,
                deltaPoints: deltaPoints,
                type: eventType
            };

            $(eventData.element).trigger(eventType, eventData);

            // update the last points
            lastPoints = cornerstoneTools.copyPoints(currentPoints);

            // prevent left click selection of DOM elements
            return cornerstoneTools.pauseEvent(e);
        }

        // hook mouseup so we can unbind our event listeners
        // when they stop dragging
        function onMouseUp(e) {
            // Cancel the timeout preventing the click event from triggering
            clearTimeout(preventClickTimeout);

            var eventType = 'CornerstoneToolsMouseUp';
            if (isClickEvent) {
                eventType = 'CornerstoneToolsMouseClick';
            }

            // calculate our current points in page and image coordinates
            var currentPoints = {
                page: cornerstoneMath.point.pageToPoint(e),
                image: cornerstone.pageToPixel(element, e.pageX, e.pageY),
                client: {
                    x: e.clientX,
                    y: e.clientY
                }
            };
            currentPoints.canvas = cornerstone.pixelToCanvas(element, currentPoints.image);

            // Calculate delta values in page and image coordinates
            var deltaPoints = {
                page: cornerstoneMath.point.subtract(currentPoints.page, lastPoints.page),
                image: cornerstoneMath.point.subtract(currentPoints.image, lastPoints.image),
                client: cornerstoneMath.point.subtract(currentPoints.client, lastPoints.client),
                canvas: cornerstoneMath.point.subtract(currentPoints.canvas, lastPoints.canvas)
            };

            var eventData = {
                event: e,
                which: whichMouseButton,
                viewport: cornerstone.getViewport(element),
                image: cornerstone.getEnabledElement(element).image,
                element: element,
                startPoints: startPoints,
                lastPoints: lastPoints,
                currentPoints: currentPoints,
                deltaPoints: deltaPoints,
                type: eventType
            };

            var event = $.Event(eventType, eventData);
            $(eventData.element).trigger(event, eventData);

            $(document).off('mousemove', onMouseMove);
            $(document).off('mouseup', onMouseUp);

            $(eventData.element).on('mousemove', mouseMove);

            isClickEvent = true;
        }

        $(document).on('mousemove', onMouseMove);
        $(document).on('mouseup', onMouseUp);

        return cornerstoneTools.pauseEvent(e);
    }

    function mouseMove(e) {
        var element = e.currentTarget;
        var eventType = 'CornerstoneToolsMouseMove';

        var startPoints = {
            page: cornerstoneMath.point.pageToPoint(e),
            image: cornerstone.pageToPixel(element, e.pageX, e.pageY),
            client: {
                x: e.clientX,
                y: e.clientY
            }
        };
        startPoints.canvas = cornerstone.pixelToCanvas(element, startPoints.image);

        var lastPoints = cornerstoneTools.copyPoints(startPoints);

        var whichMouseButton = e.which;

        // calculate our current points in page and image coordinates
        var currentPoints = {
            page: cornerstoneMath.point.pageToPoint(e),
            image: cornerstone.pageToPixel(element, e.pageX, e.pageY),
            client: {
                x: e.clientX,
                y: e.clientY
            }
        };
        currentPoints.canvas = cornerstone.pixelToCanvas(element, currentPoints.image);

        // Calculate delta values in page and image coordinates
        var deltaPoints = {
            page: cornerstoneMath.point.subtract(currentPoints.page, lastPoints.page),
            image: cornerstoneMath.point.subtract(currentPoints.image, lastPoints.image),
            client: cornerstoneMath.point.subtract(currentPoints.client, lastPoints.client),
            canvas: cornerstoneMath.point.subtract(currentPoints.canvas, lastPoints.canvas)
        };

        var eventData = {
            which: whichMouseButton,
            viewport: cornerstone.getViewport(element),
            image: cornerstone.getEnabledElement(element).image,
            element: element,
            startPoints: startPoints,
            lastPoints: lastPoints,
            currentPoints: currentPoints,
            deltaPoints: deltaPoints,
            type: eventType
        };
        $(element).trigger(eventType, eventData);

        // update the last points
        lastPoints = cornerstoneTools.copyPoints(currentPoints);
    }

    function disable(element) {
        $(element).off('mousedown', mouseDown);
        $(element).off('mousemove', mouseMove);
        $(element).off('dblclick', mouseDoubleClick);
    }

    function enable(element) {
        // Prevent handlers from being attached multiple times
        disable(element);
        
        $(element).on('mousedown', mouseDown);
        $(element).on('mousemove', mouseMove);
        $(element).on('dblclick', mouseDoubleClick);
    }

    // module exports
    cornerstoneTools.mouseInput = {
        enable: enable,
        disable: disable
    };

})($, cornerstone, cornerstoneMath, cornerstoneTools);
 
// End Source; src/inputSources/mouseInput.js

// Begin Source: src/inputSources/touchInput.js
(function($, cornerstone, cornerstoneMath, cornerstoneTools) {

    'use strict';

    /*jshint newcap: false */

    var lastScale = 1.0,
        lastRotation = 0.0,
        startPoints,
        currentPoints,
        lastPoints,
        deltaPoints,
        eventData,
        touchStartDelay,
        pressDelay = 700,
        pressTimeout,
        isPress = false,
        pressMaxDistance = 5,
        pageDistanceMoved,
        preventNextPinch = false;
    
    function onTouch(e) {
        ///console.log(e.type);
        var element = e.target.parentNode,
            event,
            eventType;

        // Prevent mouse events from occurring alongside touch events
        e.preventDefault();

        // If more than one finger is placed on the element, stop the press timeout
        if ((e.pointers && e.pointers.length > 1) ||
            (e.originalEvent && e.originalEvent.touches && e.originalEvent.touches.length > 1)) {
            isPress = false;
            clearTimeout(pressTimeout);
        }

        switch (e.type) {
            case 'tap':
                isPress = false;
                clearTimeout(pressTimeout);

                // calculate our current points in page and image coordinates
                currentPoints = {
                    page: cornerstoneMath.point.pageToPoint(e.pointers[0]),
                    image: cornerstone.pageToPixel(element, e.pointers[0].pageX, e.pointers[0].pageY),
                    client: {
                        x: e.pointers[0].clientX,
                        y: e.pointers[0].clientY
                    }
                };
                currentPoints.canvas = cornerstone.pixelToCanvas(element, currentPoints.image);

                eventType = 'CornerstoneToolsTap';
                eventData = {
                    event: e,
                    viewport: cornerstone.getViewport(element),
                    image: cornerstone.getEnabledElement(element).image,
                    element: element,
                    currentPoints: currentPoints,
                    type: eventType,
                    isTouchEvent: true
                };

                event = $.Event(eventType, eventData);
                $(element).trigger(event, eventData);
                break;

            case 'doubletap':
                isPress = false;
                clearTimeout(pressTimeout);

                // calculate our current points in page and image coordinates
                currentPoints = {
                    page: cornerstoneMath.point.pageToPoint(e.pointers[0]),
                    image: cornerstone.pageToPixel(element, e.pointers[0].pageX, e.pointers[0].pageY),
                    client: {
                        x: e.pointers[0].clientX,
                        y: e.pointers[0].clientY
                    }
                };
                currentPoints.canvas = cornerstone.pixelToCanvas(element, currentPoints.image);

                eventType = 'CornerstoneToolsDoubleTap';
                eventData = {
                    event: e,
                    viewport: cornerstone.getViewport(element),
                    image: cornerstone.getEnabledElement(element).image,
                    element: element,
                    currentPoints: currentPoints,
                    type: eventType,
                    isTouchEvent: true
                };

                event = $.Event(eventType, eventData);
                $(element).trigger(event, eventData);
                break;

            case 'pinchstart':
                isPress = false;
                clearTimeout(pressTimeout);
                
                lastScale = 1.0;
                break;

            case 'pinchmove':
                isPress = false;
                clearTimeout(pressTimeout);

                if (preventNextPinch === true) {
                    lastScale = e.scale;
                    preventNextPinch = false;
                    break;
                }

                var scaleChange = (e.scale - lastScale) / lastScale;

                startPoints = {
                    page: e.center,
                    image: cornerstone.pageToPixel(element, e.center.x, e.center.y),
                };
                startPoints.canvas = cornerstone.pixelToCanvas(element, startPoints.image);

                eventType = 'CornerstoneToolsTouchPinch';
                eventData = {
                    event: e,
                    startPoints: startPoints,
                    viewport: cornerstone.getViewport(element),
                    image: cornerstone.getEnabledElement(element).image,
                    element: element,
                    direction: e.scale < 1 ? 1 : -1,
                    scaleChange: scaleChange,
                    type: eventType,
                    isTouchEvent: true
                };

                event = $.Event(eventType, eventData);
                $(element).trigger(event, eventData);

                lastScale = e.scale;
                break;

            case 'touchstart':
                lastScale = 1.0;

                clearTimeout(pressTimeout);

                clearTimeout(touchStartDelay);
                touchStartDelay = setTimeout(function() {
                    startPoints = {
                        page: cornerstoneMath.point.pageToPoint(e.originalEvent.touches[0]),
                        image: cornerstone.pageToPixel(element, e.originalEvent.touches[0].pageX, e.originalEvent.touches[0].pageY),
                        client: {
                            x: e.originalEvent.touches[0].clientX,
                            y: e.originalEvent.touches[0].clientY
                        }
                    };
                    startPoints.canvas = cornerstone.pixelToCanvas(element, startPoints.image);

                    eventType = 'CornerstoneToolsTouchStart';
                    if (e.originalEvent.touches.length > 1) {
                        eventType = 'CornerstoneToolsMultiTouchStart';
                    }

                    eventData = {
                        event: e,
                        viewport: cornerstone.getViewport(element),
                        image: cornerstone.getEnabledElement(element).image,
                        element: element,
                        startPoints: startPoints,
                        currentPoints: startPoints,
                        type: eventType,
                        isTouchEvent: true
                    };

                    event = $.Event(eventType, eventData);
                    $(element).trigger(event, eventData);

                    if (event.isImmediatePropagationStopped() === false) {
                        //isPress = false;
                        //clearTimeout(pressTimeout);

                        // No current tools responded to the drag action.
                        // Create new tool measurement
                        eventType = 'CornerstoneToolsTouchStartActive';
                        if (e.originalEvent.touches.length > 1) {
                            eventType = 'CornerstoneToolsMultiTouchStartActive';
                        }

                        eventData.type = eventType;
                        $(element).trigger(eventType, eventData);
                    }

                    //console.log(eventType);
                    lastPoints = cornerstoneTools.copyPoints(startPoints);
                }, 50);

                isPress = true;
                pageDistanceMoved = 0;
                pressTimeout = setTimeout(function() {
                    if (!isPress) {
                        return;
                    }

                    currentPoints = {
                        page: cornerstoneMath.point.pageToPoint(e.originalEvent.touches[0]),
                        image: cornerstone.pageToPixel(element, e.originalEvent.touches[0].pageX, e.originalEvent.touches[0].pageY),
                        client: {
                            x: e.originalEvent.touches[0].clientX,
                            y: e.originalEvent.touches[0].clientY
                        }
                    };
                    currentPoints.canvas = cornerstone.pixelToCanvas(element, startPoints.image);

                    eventType = 'CornerstoneToolsTouchPress';
                    eventData = {
                        event: e,
                        viewport: cornerstone.getViewport(element),
                        image: cornerstone.getEnabledElement(element).image,
                        element: element,
                        currentPoints: currentPoints,
                        type: eventType,
                        isTouchEvent: true
                    };

                    event = $.Event(eventType, eventData);
                    $(element).trigger(event, eventData);

                    //console.log(eventType);
                }, pressDelay);
                break;

            case 'touchend':
                lastScale = 1.0;

                isPress = false;
                clearTimeout(pressTimeout);

                startPoints = {
                    page: cornerstoneMath.point.pageToPoint(e.originalEvent.changedTouches[0]),
                    image: cornerstone.pageToPixel(element, e.originalEvent.changedTouches[0].pageX, e.originalEvent.changedTouches[0].pageY),
                    client: {
                        x: e.originalEvent.changedTouches[0].clientX,
                        y: e.originalEvent.changedTouches[0].clientY
                    }
                };
                startPoints.canvas = cornerstone.pixelToCanvas(element, startPoints.image);

                eventType = 'CornerstoneToolsTouchEnd';

                eventData = {
                    event: e,
                    viewport: cornerstone.getViewport(element),
                    image: cornerstone.getEnabledElement(element).image,
                    element: element,
                    startPoints: startPoints,
                    currentPoints: startPoints,
                    type: eventType,
                    isTouchEvent: true
                };

                event = $.Event(eventType, eventData);
                $(element).trigger(event, eventData);
                break;

            case 'panmove':
                // calculate our current points in page and image coordinates
                currentPoints = {
                    page: cornerstoneMath.point.pageToPoint(e.pointers[0]),
                    image: cornerstone.pageToPixel(element, e.pointers[0].pageX, e.pointers[0].pageY),
                    client: {
                        x: e.pointers[0].clientX,
                        y: e.pointers[0].clientY
                    }
                };
                currentPoints.canvas = cornerstone.pixelToCanvas(element, currentPoints.image);

                // Calculate delta values in page and image coordinates
                deltaPoints = {
                    page: cornerstoneMath.point.subtract(currentPoints.page, lastPoints.page),
                    image: cornerstoneMath.point.subtract(currentPoints.image, lastPoints.image),
                    client: cornerstoneMath.point.subtract(currentPoints.client, lastPoints.client),
                    canvas: cornerstoneMath.point.subtract(currentPoints.canvas, lastPoints.canvas)
                };

                pageDistanceMoved += Math.sqrt(deltaPoints.page.x * deltaPoints.page.x + deltaPoints.page.y * deltaPoints.page.y);
                //console.log("pageDistanceMoved: " + pageDistanceMoved);
                if (pageDistanceMoved > pressMaxDistance) {
                    //console.log('Press event aborted due to movement');
                    isPress = false;
                    clearTimeout(pressTimeout);
                }
              
                eventType = 'CornerstoneToolsTouchDrag';
                if (e.pointers.length > 1) {
                    eventType = 'CornerstoneToolsMultiTouchDrag';
                }

                eventData = {
                    viewport: cornerstone.getViewport(element),
                    image: cornerstone.getEnabledElement(element).image,
                    element: element,
                    startPoints: startPoints,
                    lastPoints: lastPoints,
                    currentPoints: currentPoints,
                    deltaPoints: deltaPoints,
                    numPointers: e.pointers.length,
                    type: eventType,
                    isTouchEvent: true
                };

                event = $.Event(eventType, eventData);
                $(element).trigger(event, eventData);

                lastPoints = cornerstoneTools.copyPoints(currentPoints);
                break;

            case 'panstart':
                currentPoints = {
                    page: cornerstoneMath.point.pageToPoint(e.pointers[0]),
                    image: cornerstone.pageToPixel(element, e.pointers[0].pageX, e.pointers[0].pageY),
                    client: {
                        x: e.pointers[0].clientX,
                        y: e.pointers[0].clientY
                    }
                };
                currentPoints.canvas = cornerstone.pixelToCanvas(element, currentPoints.image);
                lastPoints = cornerstoneTools.copyPoints(currentPoints);
                break;

            case 'panend':
                isPress = false;
                clearTimeout(pressTimeout);

                // If lastPoints is not yet set, it means panend fired without panstart or pan,
                // so we can ignore this event
                if (!lastPoints) {
                    return false;
                }

                currentPoints = {
                    page: cornerstoneMath.point.pageToPoint(e.pointers[0]),
                    image: cornerstone.pageToPixel(element, e.pointers[0].pageX, e.pointers[0].pageY),
                    client: {
                        x: e.pointers[0].clientX,
                        y: e.pointers[0].clientY
                    }
                };
                currentPoints.canvas = cornerstone.pixelToCanvas(element, currentPoints.image);

                // Calculate delta values in page and image coordinates
                deltaPoints = {
                    page: cornerstoneMath.point.subtract(currentPoints.page, lastPoints.page),
                    image: cornerstoneMath.point.subtract(currentPoints.image, lastPoints.image),
                    client: cornerstoneMath.point.subtract(currentPoints.client, lastPoints.client),
                    canvas: cornerstoneMath.point.subtract(currentPoints.canvas, lastPoints.canvas)
                };

                eventType = 'CornerstoneToolsDragEnd';

                eventData = {
                    event: e.srcEvent,
                    viewport: cornerstone.getViewport(element),
                    image: cornerstone.getEnabledElement(element).image,
                    element: element,
                    startPoints: startPoints,
                    lastPoints: lastPoints,
                    currentPoints: currentPoints,
                    deltaPoints: deltaPoints,
                    type: eventType,
                    isTouchEvent: true
                };

                event = $.Event(eventType, eventData);
                $(element).trigger(event, eventData);

                var remainingPointers = e.pointers.length - e.changedPointers.length;
                if (remainingPointers === 2) {
                    preventNextPinch = true;
                }

                return cornerstoneTools.pauseEvent(e);

            case 'rotatemove':
                isPress = false;
                clearTimeout(pressTimeout);

                var rotation = e.rotation - lastRotation;
                lastRotation = e.rotation;

                eventType = 'CornerstoneToolsTouchRotate';
                eventData = {
                    event: e.srcEvent,
                    viewport: cornerstone.getViewport(element),
                    image: cornerstone.getEnabledElement(element).image,
                    element: element,
                    rotation: rotation,
                    type: eventType
                };
                event = $.Event(eventType, eventData);
                $(element).trigger(event, eventData);
                break;
        }

        //console.log(eventType);
        return false;
    }

    function enable(element) {
        disable(element);

        var hammerOptions = {
            inputClass: Hammer.SUPPORT_POINTER_EVENTS ? Hammer.PointerEventInput : Hammer.TouchInput
        };

        var mc = new Hammer.Manager(element, hammerOptions);

        var panOptions = {
            pointers: 0,
            direction: Hammer.DIRECTION_ALL,
            threshold: 0
        };

        var pan = new Hammer.Pan(panOptions);
        var pinch = new Hammer.Pinch({
            threshold: 0
        });
        var rotate = new Hammer.Rotate({
            threshold: 0
        });
        
        // we want to detect both the same time
        pinch.recognizeWith(pan);
        pinch.recognizeWith(rotate);

        // add to the Manager
        mc.add([ pan, rotate, pinch ]);
        mc.on('tap doubletap panstart panmove panend pinchstart pinchmove rotatemove', onTouch);

        cornerstoneTools.preventGhostClick.enable(element);
        $(element).on('touchstart touchend', onTouch);
        $(element).data('hammer', mc);
        //console.log('touchInput enabled');
    }

    function disable(element) {
        cornerstoneTools.preventGhostClick.disable(element);
        $(element).off('touchstart touchend', onTouch);
        var mc = $(element).data('hammer');
        if (mc) {
            mc.off('tap doubletap panstart panmove panend pinchmove rotatemove', onTouch);
        }

        //console.log('touchInput disabled');
    }

    // module exports
    cornerstoneTools.touchInput = {
        enable: enable,
        disable: disable
    };

})($, cornerstone, cornerstoneMath, cornerstoneTools);
 
// End Source; src/inputSources/touchInput.js

// Begin Source: src/imageTools/simpleMouseButtonTool.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    function simpleMouseButtonTool(mouseDownCallback) {
        var configuration = {};

        var toolInterface = {
            activate: function(element, mouseButtonMask, options) {
                $(element).off('CornerstoneToolsMouseDownActivate', mouseDownCallback);
                var eventData = {
                    mouseButtonMask: mouseButtonMask,
                    options: options
                };
                $(element).on('CornerstoneToolsMouseDownActivate', eventData, mouseDownCallback);
            },
            disable: function(element) {$(element).off('CornerstoneToolsMouseDownActivate', mouseDownCallback);},
            enable: function(element) {$(element).off('CornerstoneToolsMouseDownActivate', mouseDownCallback);},
            deactivate: function(element) {$(element).off('CornerstoneToolsMouseDownActivate', mouseDownCallback);},
            getConfiguration: function() { return configuration;},
            setConfiguration: function(config) {configuration = config;}
        };
        return toolInterface;
    }

    // module exports
    cornerstoneTools.simpleMouseButtonTool = simpleMouseButtonTool;

})($, cornerstone, cornerstoneTools);
 
// End Source; src/imageTools/simpleMouseButtonTool.js

// Begin Source: src/imageTools/mouseButtonTool.js
(function($, cornerstone, cornerstoneMath, cornerstoneTools) {

    'use strict';

    function mouseButtonTool(mouseToolInterface) {
        var configuration = {};

        ///////// BEGIN ACTIVE TOOL ///////
        function addNewMeasurement(mouseEventData) {
            var element = mouseEventData.element;

            var measurementData = mouseToolInterface.createNewMeasurement(mouseEventData);
            if (!measurementData) {
                return;
            }

            var eventData = {
                mouseButtonMask: mouseEventData.which
            };

            // associate this data with this imageId so we can render it and manipulate it
            cornerstoneTools.addToolState(mouseEventData.element, mouseToolInterface.toolType, measurementData);

            // since we are dragging to another place to drop the end point, we can just activate
            // the end point and let the moveHandle move it for us.
            $(element).off('CornerstoneToolsMouseMove', mouseToolInterface.mouseMoveCallback || mouseMoveCallback);
            $(element).off('CornerstoneToolsMouseDown', mouseToolInterface.mouseDownCallback || mouseDownCallback);
            $(element).off('CornerstoneToolsMouseDownActivate', mouseToolInterface.mouseDownActivateCallback || mouseDownActivateCallback);

            if (mouseToolInterface.mouseDoubleClickCallback) {
                $(element).off('CornerstoneToolsMouseDoubleClick', mouseToolInterface.mouseDoubleClickCallback);
            }

            cornerstone.updateImage(element);

            var handleMover;
            if (Object.keys(measurementData.handles).length === 1) {
                handleMover = cornerstoneTools.moveHandle;
            } else {
                handleMover = cornerstoneTools.moveNewHandle;
            }

            handleMover(mouseEventData, mouseToolInterface.toolType, measurementData, measurementData.handles.end, function() {
                measurementData.active = false;
                measurementData.invalidated = true;
                if (cornerstoneTools.anyHandlesOutsideImage(mouseEventData, measurementData.handles)) {
                    // delete the measurement
                    cornerstoneTools.removeToolState(element, mouseToolInterface.toolType, measurementData);
                }

                $(element).on('CornerstoneToolsMouseMove', eventData, mouseToolInterface.mouseMoveCallback || mouseMoveCallback);
                $(element).on('CornerstoneToolsMouseDown', eventData, mouseToolInterface.mouseDownCallback || mouseDownCallback);
                $(element).on('CornerstoneToolsMouseDownActivate', eventData, mouseToolInterface.mouseDownActivateCallback || mouseDownActivateCallback);

                if (mouseToolInterface.mouseDoubleClickCallback) {
                    $(element).on('CornerstoneToolsMouseDoubleClick', eventData, mouseToolInterface.mouseDoubleClickCallback);
                }

                cornerstone.updateImage(element);
            });
        }

        function mouseDownActivateCallback(e, eventData) {
            if (cornerstoneTools.isMouseButtonEnabled(eventData.which, e.data.mouseButtonMask)) {
                if (mouseToolInterface.addNewMeasurement) {
                    mouseToolInterface.addNewMeasurement(eventData);
                } else {
                    addNewMeasurement(eventData);
                }

                return false; // false = causes jquery to preventDefault() and stopPropagation() this event
            }
        }

        ///////// END ACTIVE TOOL ///////

        ///////// BEGIN DEACTIVE TOOL ///////

        function mouseMoveCallback(e, eventData) {
            cornerstoneTools.toolCoordinates.setCoords(eventData);
            // if a mouse button is down, do nothing
            if (eventData.which !== 0) {
                return;
            }
          
            // if we have no tool data for this element, do nothing
            var toolData = cornerstoneTools.getToolState(eventData.element, mouseToolInterface.toolType);
            if (!toolData) {
                return;
            }
            
            // We have tool data, search through all data
            // and see if we can activate a handle
            var imageNeedsUpdate = false;
            for (var i = 0; i < toolData.data.length; i++) {
                // get the cursor position in canvas coordinates
                var coords = eventData.currentPoints.canvas;

                var data = toolData.data[i];
                if (cornerstoneTools.handleActivator(eventData.element, data.handles, coords) === true) {
                    imageNeedsUpdate = true;
                }

                if ((mouseToolInterface.pointNearTool(eventData.element, data, coords) && !data.active) || (!mouseToolInterface.pointNearTool(eventData.element, data, coords) && data.active)) {
                    data.active = !data.active;
                    imageNeedsUpdate = true;
                }
            }

            // Handle activation status changed, redraw the image
            if (imageNeedsUpdate === true) {
                cornerstone.updateImage(eventData.element);
            }
        }

        function mouseDownCallback(e, eventData) {
            var data;
            var element = eventData.element;

            function handleDoneMove() {
                data.active = false;
                data.invalidated = true;
                if (cornerstoneTools.anyHandlesOutsideImage(eventData, data.handles)) {
                    // delete the measurement
                    cornerstoneTools.removeToolState(element, mouseToolInterface.toolType, data);
                }

                cornerstone.updateImage(element);
                $(element).on('CornerstoneToolsMouseMove', eventData, mouseToolInterface.mouseMoveCallback || mouseMoveCallback);
            }

            if (cornerstoneTools.isMouseButtonEnabled(eventData.which, e.data.mouseButtonMask)) {
                var coords = eventData.startPoints.canvas;
                var toolData = cornerstoneTools.getToolState(e.currentTarget, mouseToolInterface.toolType);

                var i;

                // now check to see if there is a handle we can move
                if (toolData) {
                    for (i = 0; i < toolData.data.length; i++) {
                        data = toolData.data[i];
                        var distanceSq = 25;
                        var handle = cornerstoneTools.getHandleNearImagePoint(element, data.handles, coords, distanceSq);
                        if (handle) {
                            $(element).off('CornerstoneToolsMouseMove', mouseToolInterface.mouseMoveCallback || mouseMoveCallback);
                            data.active = true;
                            cornerstoneTools.moveHandle(eventData, mouseToolInterface.toolType, data, handle, handleDoneMove);
                            e.stopImmediatePropagation();
                            return false;
                        }
                    }
                }

                // Now check to see if there is a line we can move
                // now check to see if we have a tool that we can move
                if (toolData && mouseToolInterface.pointNearTool) {
                    var options = {
                        deleteIfHandleOutsideImage: true,
                        preventHandleOutsideImage: false
                    };

                    for (i = 0; i < toolData.data.length; i++) {
                        data = toolData.data[i];
                        if (mouseToolInterface.pointNearTool(element, data, coords)) {
                            $(element).off('CornerstoneToolsMouseMove', mouseToolInterface.mouseMoveCallback || mouseMoveCallback);
                            cornerstoneTools.moveAllHandles(e, data, toolData, mouseToolInterface.toolType, options, handleDoneMove);
                            e.stopImmediatePropagation();
                            return false;
                        }
                    }
                }
            }
        }
        ///////// END DEACTIVE TOOL ///////

        // not visible, not interactive
        function disable(element) {
            $(element).off('CornerstoneImageRendered', mouseToolInterface.onImageRendered);
            $(element).off('CornerstoneToolsMouseMove', mouseToolInterface.mouseMoveCallback || mouseMoveCallback);
            $(element).off('CornerstoneToolsMouseDown', mouseToolInterface.mouseDownCallback || mouseDownCallback);
            $(element).off('CornerstoneToolsMouseDownActivate', mouseToolInterface.mouseDownActivateCallback || mouseDownActivateCallback);

            if (mouseToolInterface.mouseDoubleClickCallback) {
                $(element).off('CornerstoneToolsMouseDoubleClick', mouseToolInterface.mouseDoubleClickCallback);
            }

            cornerstone.updateImage(element);
        }

        // visible but not interactive
        function enable(element) {
            $(element).off('CornerstoneImageRendered', mouseToolInterface.onImageRendered);
            $(element).off('CornerstoneToolsMouseMove', mouseToolInterface.mouseMoveCallback || mouseMoveCallback);
            $(element).off('CornerstoneToolsMouseDown', mouseToolInterface.mouseDownCallback || mouseDownCallback);
            $(element).off('CornerstoneToolsMouseDownActivate', mouseToolInterface.mouseDownActivateCallback || mouseDownActivateCallback);

            if (mouseToolInterface.mouseDoubleClickCallback) {
                $(element).off('CornerstoneToolsMouseDoubleClick', mouseToolInterface.mouseDoubleClickCallback);
            }

            $(element).on('CornerstoneImageRendered', mouseToolInterface.onImageRendered);

            cornerstone.updateImage(element);
        }

        // visible, interactive and can create
        function activate(element, mouseButtonMask) {
            var eventData = {
                mouseButtonMask: mouseButtonMask
            };

            $(element).off('CornerstoneImageRendered', mouseToolInterface.onImageRendered);
            $(element).off('CornerstoneToolsMouseMove', mouseToolInterface.mouseMoveCallback || mouseMoveCallback);
            $(element).off('CornerstoneToolsMouseDown', mouseToolInterface.mouseDownCallback || mouseDownCallback);
            $(element).off('CornerstoneToolsMouseDownActivate', mouseToolInterface.mouseDownActivateCallback || mouseDownActivateCallback);

            $(element).on('CornerstoneImageRendered', mouseToolInterface.onImageRendered);
            $(element).on('CornerstoneToolsMouseMove', eventData, mouseToolInterface.mouseMoveCallback || mouseMoveCallback);
            $(element).on('CornerstoneToolsMouseDown', eventData, mouseToolInterface.mouseDownCallback || mouseDownCallback);
            $(element).on('CornerstoneToolsMouseDownActivate', eventData, mouseToolInterface.mouseDownActivateCallback || mouseDownActivateCallback);

            if (mouseToolInterface.mouseDoubleClickCallback) {
                $(element).off('CornerstoneToolsMouseDoubleClick', mouseToolInterface.mouseDoubleClickCallback);
                $(element).on('CornerstoneToolsMouseDoubleClick', eventData, mouseToolInterface.mouseDoubleClickCallback);
            }

            cornerstone.updateImage(element);
        }

        // visible, interactive
        function deactivate(element, mouseButtonMask) {
            var eventData = {
                mouseButtonMask: mouseButtonMask
            };

            $(element).off('CornerstoneImageRendered', mouseToolInterface.onImageRendered);
            $(element).off('CornerstoneToolsMouseMove', mouseToolInterface.mouseMoveCallback || mouseMoveCallback);
            $(element).off('CornerstoneToolsMouseDown', mouseToolInterface.mouseDownCallback || mouseDownCallback);
            $(element).off('CornerstoneToolsMouseDownActivate', mouseToolInterface.mouseDownActivateCallback || mouseDownActivateCallback);

            $(element).on('CornerstoneImageRendered', mouseToolInterface.onImageRendered);
            $(element).on('CornerstoneToolsMouseMove', eventData, mouseToolInterface.mouseMoveCallback || mouseMoveCallback);
            $(element).on('CornerstoneToolsMouseDown', eventData, mouseToolInterface.mouseDownCallback || mouseDownCallback);

            if (mouseToolInterface.mouseDoubleClickCallback) {
                $(element).off('CornerstoneToolsMouseDoubleClick', mouseToolInterface.mouseDoubleClickCallback);
                $(element).on('CornerstoneToolsMouseDoubleClick', eventData, mouseToolInterface.mouseDoubleClickCallback);
            }

            cornerstone.updateImage(element);
        }

        function getConfiguration() {
            return configuration;
        }

        function setConfiguration(config) {
            configuration = config;
        }

        var toolInterface = {
            enable: enable,
            disable: disable,
            activate: activate,
            deactivate: deactivate,
            getConfiguration: getConfiguration,
            setConfiguration: setConfiguration,
            mouseDownCallback: mouseDownCallback,
            mouseMoveCallback: mouseMoveCallback,
            mouseDownActivateCallback: mouseDownActivateCallback
        };

        // Expose pointNearTool if available
        if (mouseToolInterface.pointNearTool) {
            toolInterface.pointNearTool = mouseToolInterface.pointNearTool;
        }

        if (mouseToolInterface.mouseDoubleClickCallback) {
            toolInterface.mouseDoubleClickCallback = mouseToolInterface.mouseDoubleClickCallback;
        }

        if (mouseToolInterface.addNewMeasurement) {
            toolInterface.addNewMeasurement = mouseToolInterface.addNewMeasurement;
        }

        return toolInterface;
    }

    // module exports
    cornerstoneTools.mouseButtonTool = mouseButtonTool;

})($, cornerstone, cornerstoneMath, cornerstoneTools);
 
// End Source; src/imageTools/mouseButtonTool.js

// Begin Source: src/imageTools/mouseButtonRectangleTool.js
(function($, cornerstone, cornerstoneMath, cornerstoneTools) {

    'use strict';
    
    function mouseButtonRectangleTool(mouseToolInterface, preventHandleOutsideImage) {
        ///////// BEGIN ACTIVE TOOL ///////
        function addNewMeasurement(mouseEventData) {
            var measurementData = mouseToolInterface.createNewMeasurement(mouseEventData);
            
            //prevent adding new measurement if tool returns nill
            if (!measurementData) {
                return;
            }

            // associate this data with this imageId so we can render it and manipulate it
            cornerstoneTools.addToolState(mouseEventData.element, mouseToolInterface.toolType, measurementData);
           
            // since we are dragging to another place to drop the end point, we can just activate
            // the end point and let the moveHandle move it for us.
            $(mouseEventData.element).off('CornerstoneToolsMouseMove', mouseMoveCallback);
            cornerstoneTools.moveHandle(mouseEventData, mouseToolInterface.toolType, measurementData, measurementData.handles.end, function() {
                measurementData.active = false;
                if (cornerstoneTools.anyHandlesOutsideImage(mouseEventData, measurementData.handles)) {
                    // delete the measurement
                    cornerstoneTools.removeToolState(mouseEventData.element, mouseToolInterface.toolType, measurementData);
                }

                $(mouseEventData.element).on('CornerstoneToolsMouseMove', mouseMoveCallback);
            }, preventHandleOutsideImage);
        }

        function mouseDownActivateCallback(e, eventData) {
            if (cornerstoneTools.isMouseButtonEnabled(eventData.which, e.data.mouseButtonMask)) {
                addNewMeasurement(eventData);
                return false; // false = cases jquery to preventDefault() and stopPropagation() this event
            }
        }
        ///////// END ACTIVE TOOL ///////

        ///////// BEGIN DEACTIVE TOOL ///////

        function mouseMoveCallback(e, eventData) {
            cornerstoneTools.toolCoordinates.setCoords(eventData);
            // if a mouse button is down, do nothing
            if (eventData.which !== 0) {
                return;
            }
          
            // if we have no tool data for this element, do nothing
            var toolData = cornerstoneTools.getToolState(eventData.element, mouseToolInterface.toolType);
            if (toolData === undefined) {
                return;
            }
            
            // We have tool data, search through all data
            // and see if we can activate a handle
            var imageNeedsUpdate = false;
            var coords = eventData.currentPoints.canvas;

            for (var i = 0; i < toolData.data.length; i++) {
                // get the cursor position in image coordinates
                var data = toolData.data[i];
                if (cornerstoneTools.handleActivator(eventData.element, data.handles, coords) === true) {
                    imageNeedsUpdate = true;
                }

                if ((mouseToolInterface.pointInsideRect(eventData.element, data, coords) && !data.active) || (!mouseToolInterface.pointInsideRect(eventData.element, data, coords) && data.active)) {
                    data.active = !data.active;
                    imageNeedsUpdate = true;
                }
            }

            // Handle activation status changed, redraw the image
            if (imageNeedsUpdate === true) {
                cornerstone.updateImage(eventData.element);
            }
        }

        function mouseDownCallback(e, eventData) {
            var data;

            function handleDoneMove() {
                data.active = false;
                if (cornerstoneTools.anyHandlesOutsideImage(eventData, data.handles)) {
                    // delete the measurement
                    cornerstoneTools.removeToolState(eventData.element, mouseToolInterface.toolType, data);
                }

                cornerstone.updateImage(eventData.element);
                $(eventData.element).on('CornerstoneToolsMouseMove', mouseMoveCallback);
            }

            if (cornerstoneTools.isMouseButtonEnabled(eventData.which, e.data.mouseButtonMask)) {
                var coords = eventData.startPoints.canvas;
                var toolData = cornerstoneTools.getToolState(e.currentTarget, mouseToolInterface.toolType);

                var i;

                // now check to see if there is a handle we can move
                var distanceSq = 25;

                if (toolData !== undefined) {
                    for (i = 0; i < toolData.data.length; i++) {
                        data = toolData.data[i];
                        var handle = cornerstoneTools.getHandleNearImagePoint(eventData.element, data.handles, coords, distanceSq);
                        if (handle !== undefined) {
                            $(eventData.element).off('CornerstoneToolsMouseMove', mouseMoveCallback);
                            data.active = true;
                            cornerstoneTools.moveHandle(eventData, mouseToolInterface.toolType, data, handle, handleDoneMove, preventHandleOutsideImage);
                            e.stopImmediatePropagation();
                            return false;
                        }
                    }
                }

                // Now check to see if there is a line we can move
                // now check to see if we have a tool that we can move
                var options = {
                    deleteIfHandleOutsideImage: true,
                    preventHandleOutsideImage: preventHandleOutsideImage
                };
                
                if (toolData !== undefined && mouseToolInterface.pointInsideRect !== undefined) {
                    for (i = 0; i < toolData.data.length; i++) {
                        data = toolData.data[i];
                        if (mouseToolInterface.pointInsideRect(eventData.element, data, coords)) {
                            $(eventData.element).off('CornerstoneToolsMouseMove', mouseMoveCallback);
                            cornerstoneTools.moveAllHandles(e, data, toolData, mouseToolInterface.toolType, options, handleDoneMove);
                            $(eventData.element).on('CornerstoneToolsMouseMove', mouseMoveCallback);
                            e.stopImmediatePropagation();
                            return false;
                        }
                    }
                }
            }
        }
        ///////// END DEACTIVE TOOL ///////

        // not visible, not interactive
        function disable(element) {
            $(element).off('CornerstoneImageRendered', mouseToolInterface.onImageRendered);
            $(element).off('CornerstoneToolsMouseMove', mouseMoveCallback);
            $(element).off('CornerstoneToolsMouseDown', mouseDownCallback);
            $(element).off('CornerstoneToolsMouseDownActivate', mouseDownActivateCallback);

            cornerstone.updateImage(element);
        }

        // visible but not interactive
        function enable(element) {
            $(element).off('CornerstoneImageRendered', mouseToolInterface.onImageRendered);
            $(element).off('CornerstoneToolsMouseMove', mouseMoveCallback);
            $(element).off('CornerstoneToolsMouseDown', mouseDownCallback);
            $(element).off('CornerstoneToolsMouseDownActivate', mouseDownActivateCallback);

            $(element).on('CornerstoneImageRendered', mouseToolInterface.onImageRendered);

            cornerstone.updateImage(element);
        }

        // visible, interactive and can create
        function activate(element, mouseButtonMask) {
            var eventData = {
                mouseButtonMask: mouseButtonMask
            };

            $(element).off('CornerstoneImageRendered', mouseToolInterface.onImageRendered);
            $(element).off('CornerstoneToolsMouseMove', mouseMoveCallback);
            $(element).off('CornerstoneToolsMouseDown', mouseDownCallback);
            $(element).off('CornerstoneToolsMouseDownActivate', mouseDownActivateCallback);

            $(element).on('CornerstoneImageRendered', mouseToolInterface.onImageRendered);
            $(element).on('CornerstoneToolsMouseMove', eventData, mouseMoveCallback);
            $(element).on('CornerstoneToolsMouseDown', eventData, mouseDownCallback);
            $(element).on('CornerstoneToolsMouseDownActivate', eventData, mouseDownActivateCallback);

            cornerstone.updateImage(element);
        }

        // visible, interactive
        function deactivate(element, mouseButtonMask) {
            var eventData = {
                mouseButtonMask: mouseButtonMask
            };

            $(element).off('CornerstoneImageRendered', mouseToolInterface.onImageRendered);
            $(element).off('CornerstoneToolsMouseMove', mouseMoveCallback);
            $(element).off('CornerstoneToolsMouseDown', mouseDownCallback);
            $(element).off('CornerstoneToolsMouseDownActivate', mouseDownActivateCallback);

            $(element).on('CornerstoneImageRendered', mouseToolInterface.onImageRendered);
            $(element).on('CornerstoneToolsMouseMove', eventData, mouseMoveCallback);
            $(element).on('CornerstoneToolsMouseDown', eventData, mouseDownCallback);

            cornerstone.updateImage(element);
        }

        var toolInterface = {
            enable: enable,
            disable: disable,
            activate: activate,
            deactivate: deactivate
        };

        return toolInterface;
    }

    // module exports
    cornerstoneTools.mouseButtonRectangleTool = mouseButtonRectangleTool;

})($, cornerstone, cornerstoneMath, cornerstoneTools);
 
// End Source; src/imageTools/mouseButtonRectangleTool.js

// Begin Source: src/imageTools/mouseWheelTool.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    function mouseWheelTool(mouseWheelCallback) {
        var toolInterface = {
            activate: function(element) {
                $(element).off('CornerstoneToolsMouseWheel', mouseWheelCallback);
                var eventData = {
                };
                $(element).on('CornerstoneToolsMouseWheel', eventData, mouseWheelCallback);
            },
            disable: function(element) {$(element).off('CornerstoneToolsMouseWheel', mouseWheelCallback);},
            enable: function(element) {$(element).off('CornerstoneToolsMouseWheel', mouseWheelCallback);},
            deactivate: function(element) {$(element).off('CornerstoneToolsMouseWheel', mouseWheelCallback);}
        };
        return toolInterface;
    }

    // module exports
    cornerstoneTools.mouseWheelTool = mouseWheelTool;

})($, cornerstone, cornerstoneTools);
 
// End Source; src/imageTools/mouseWheelTool.js

// Begin Source: src/imageTools/touchDragTool.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    function touchDragTool(touchDragCallback, options) {
        var events = 'CornerstoneToolsTouchDrag';
        if (options && options.fireOnTouchStart === true) {
            events += ' CornerstoneToolsTouchStart';
        }

        var toolInterface = {
            activate: function(element) {
                $(element).off(events, touchDragCallback);

                if (options && options.eventData) {
                    $(element).on(events, options.eventData, touchDragCallback);
                } else {
                    $(element).on(events, touchDragCallback);
                }

                if (options && options.activateCallback) {
                    options.activateCallback(element);
                }
            },
            disable: function(element) {
                $(element).off(events, touchDragCallback);
                if (options && options.disableCallback) {
                    options.disableCallback(element);
                }
            },
            enable: function(element) {
                $(element).off(events, touchDragCallback);
                if (options && options.enableCallback) {
                    options.enableCallback(element);
                }
            },
            deactivate: function(element) {
                $(element).off(events, touchDragCallback);
                if (options && options.deactivateCallback) {
                    options.deactivateCallback(element);
                }
            }
        };
        return toolInterface;
    }

    // module exports
    cornerstoneTools.touchDragTool = touchDragTool;

})($, cornerstone, cornerstoneTools);
 
// End Source; src/imageTools/touchDragTool.js

// Begin Source: src/imageTools/touchPinchTool.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    /*jshint newcap: false */

    function touchPinchTool(touchPinchCallback) {
        var toolInterface = {
            activate: function(element) {
                $(element).off('CornerstoneToolsTouchPinch', touchPinchCallback);
                var eventData = {
                };
                $(element).on('CornerstoneToolsTouchPinch', eventData, touchPinchCallback);
            },
            disable: function(element) {$(element).off('CornerstoneToolsTouchPinch', touchPinchCallback);},
            enable: function(element) {$(element).off('CornerstoneToolsTouchPinch', touchPinchCallback);},
            deactivate: function(element) {$(element).off('CornerstoneToolsTouchPinch', touchPinchCallback);}
        };
        return toolInterface;
    }

    // module exports
    cornerstoneTools.touchPinchTool = touchPinchTool;

})($, cornerstone, cornerstoneTools);
 
// End Source; src/imageTools/touchPinchTool.js

// Begin Source: src/imageTools/touchTool.js
(function($, cornerstone, cornerstoneMath, cornerstoneTools) {

    'use strict';

    function deactivateAllHandles(handles) {
        Object.keys(handles).forEach(function(name) {
            var handle = handles[name];
            handle.active = false;
        });
    }

    function deactivateAllToolInstances(toolData) {
        if (!toolData) {
            return;
        }

        for (var i = 0; i < toolData.data.length; i++) {
            var data = toolData.data[i];
            data.active = false;
            if (!data.handles) {
                continue;
            }

            deactivateAllHandles(data.handles);
        }
    }

    function touchTool(touchToolInterface) {
        ///////// BEGIN ACTIVE TOOL ///////

        function addNewMeasurement(touchEventData) {
            //console.log('touchTool addNewMeasurement');
            var element = touchEventData.element;

            var measurementData = touchToolInterface.createNewMeasurement(touchEventData);
            if (!measurementData) {
                return;
            }

            cornerstoneTools.addToolState(element, touchToolInterface.toolType, measurementData);

            if (Object.keys(measurementData.handles).length === 1 && touchEventData.type === 'CornerstoneToolsTap') {
                measurementData.active = false;
                measurementData.handles.end.active = false;
                measurementData.handles.end.highlight = false;
                measurementData.invalidated = true;
                if (cornerstoneTools.anyHandlesOutsideImage(touchEventData, measurementData.handles)) {
                    // delete the measurement
                    cornerstoneTools.removeToolState(element, touchToolInterface.toolType, measurementData);
                }

                cornerstone.updateImage(element);
                return;
            }

            $(element).off('CornerstoneToolsTouchStartActive', touchToolInterface.touchDownActivateCallback || touchDownActivateCallback);
            $(element).off('CornerstoneToolsTap', touchToolInterface.tapCallback || tapCallback);

            cornerstone.updateImage(element);
            cornerstoneTools.moveNewHandleTouch(touchEventData, touchToolInterface.toolType, measurementData, measurementData.handles.end, function() {
                measurementData.active = false;
                measurementData.invalidated = true;
                if (cornerstoneTools.anyHandlesOutsideImage(touchEventData, measurementData.handles)) {
                    // delete the measurement
                    cornerstoneTools.removeToolState(element, touchToolInterface.toolType, measurementData);
                }

                $(element).on('CornerstoneToolsTouchStartActive', touchToolInterface.touchDownActivateCallback || touchDownActivateCallback);
                $(element).on('CornerstoneToolsTap', touchToolInterface.tapCallback || tapCallback);
                cornerstone.updateImage(element);
            });
        }

        function touchDownActivateCallback(e, eventData) {
            //console.log('touchTool touchDownActivateCallback');
            if (touchToolInterface.addNewMeasurement) {
                touchToolInterface.addNewMeasurement(eventData);
            } else {
                addNewMeasurement(eventData);
            }

            return false; // false = causes jquery to preventDefault() and stopPropagation() this event
        }
        ///////// END ACTIVE TOOL ///////

        ///////// BEGIN INACTIVE TOOL ///////
        function tapCallback(e, eventData) {
            //console.log('touchTool tapCallback');
            var element = eventData.element;
            var coords = eventData.currentPoints.canvas;
            var toolData = cornerstoneTools.getToolState(e.currentTarget, touchToolInterface.toolType);
            var data;
            var i;

            // Deactivate everything
            deactivateAllToolInstances(toolData);

            function doneMovingCallback() {
                console.log('touchTool tapCallback doneMovingCallback');
                deactivateAllToolInstances(toolData);
                if (cornerstoneTools.anyHandlesOutsideImage(eventData, data.handles)) {
                    // delete the measurement
                    cornerstoneTools.removeToolState(element, touchToolInterface.toolType, data);
                }

                cornerstone.updateImage(element);
                $(element).on('CornerstoneToolsTouchStartActive', touchToolInterface.touchDownActivateCallback || touchDownActivateCallback);
                $(element).on('CornerstoneToolsTap', touchToolInterface.tapCallback || tapCallback);
            }

            // now check to see if there is a handle we can move
            if (toolData) {
                for (i = 0; i < toolData.data.length; i++) {
                    data = toolData.data[i];
                    var distanceSq = 75; // Should probably make this a settable property later
                    var handle = cornerstoneTools.getHandleNearImagePoint(element, data.handles, coords, distanceSq);
                    if (handle) {
                        $(element).off('CornerstoneToolsTouchStartActive', touchToolInterface.touchDownActivateCallback || touchDownActivateCallback);
                        $(element).off('CornerstoneToolsTap', touchToolInterface.tapCallback || tapCallback);
                        data.active = true;
                        handle.active = true;
                        cornerstone.updateImage(element);
                        cornerstoneTools.touchMoveHandle(e, touchToolInterface.toolType, data, handle, doneMovingCallback);
                        e.stopImmediatePropagation();
                        return false; // false = causes jquery to preventDefault() and stopPropagation() this event
                    }
                }
            }

            // Now check to see if we have a tool that we can move
            if (toolData && touchToolInterface.pointNearTool) {
                for (i = 0; i < toolData.data.length; i++) {
                    data = toolData.data[i];
                    if (touchToolInterface.pointNearTool(element, data, coords)) {
                        $(element).off('CornerstoneToolsTouchStartActive', touchToolInterface.touchDownActivateCallback || touchDownActivateCallback);
                        $(element).off('CornerstoneToolsTap', touchToolInterface.tapCallback || tapCallback);
                        data.active = true;
                        cornerstone.updateImage(element);
                        cornerstoneTools.touchMoveAllHandles(e, data, toolData, touchToolInterface.toolType, true, doneMovingCallback);
                        e.stopImmediatePropagation();
                        return false; // false = causes jquery to preventDefault() and stopPropagation() this event
                    }
                }
            }

            // If there is nothing to move, add a new instance of the tool
            // Need to check here to see if activation is allowed!
            if (touchToolInterface.touchDownActivateCallback) {
                touchToolInterface.touchDownActivateCallback(e, eventData);
            } else {
                touchDownActivateCallback(e, eventData);
            }

            return false;
        }

        function touchStartCallback(e, eventData) {
            //console.log('touchTool touchStartCallback');
            var element = eventData.element;
            var coords = eventData.startPoints.canvas;
            var data;
            var toolData = cornerstoneTools.getToolState(e.currentTarget, touchToolInterface.toolType);
            var i;

            function doneMovingCallback() {
                //console.log('touchTool touchStartCallback doneMovingCallback');
                data.active = false;
                data.invalidated = true;
                if (cornerstoneTools.anyHandlesOutsideImage(eventData, data.handles)) {
                    // delete the measurement
                    cornerstoneTools.removeToolState(eventData.element, touchToolInterface.toolType, data);
                }

                cornerstone.updateImage(eventData.element);
                $(element).on('CornerstoneToolsTouchStartActive', touchToolInterface.touchDownActivateCallback || touchDownActivateCallback);
                $(element).on('CornerstoneToolsTap', touchToolInterface.tapCallback || tapCallback);
            }

            // now check to see if there is a handle we can move
            var distanceFromTouch = cornerstoneTools.touchSettings.getToolDistanceFromTouch();
            var distanceSq = Math.pow(Math.max(Math.abs(distanceFromTouch.x), Math.abs(distanceFromTouch.y)), 2);
            if (toolData) {
                for (i = 0; i < toolData.data.length; i++) {
                    data = toolData.data[i];

                    var handle = cornerstoneTools.getHandleNearImagePoint(eventData.element, data.handles, coords, distanceSq);
                    if (handle) {
                        $(element).off('CornerstoneToolsTouchStartActive', touchToolInterface.touchDownActivateCallback || touchDownActivateCallback);
                        $(element).off('CornerstoneToolsTap', touchToolInterface.tapCallback || tapCallback);
                        data.active = true;
                        cornerstoneTools.touchMoveHandle(e, touchToolInterface.toolType, data, handle, doneMovingCallback);
                        e.stopImmediatePropagation();
                        return false; // false = causes jquery to preventDefault() and stopPropagation() this event
                    }
                }
            }

            // Now check to see if we have a tool that we can move
            if (toolData && touchToolInterface.pointNearTool) {
                for (i = 0; i < toolData.data.length; i++) {
                    data = toolData.data[i];
                    if (touchToolInterface.pointNearTool(eventData.element, data, coords)) {
                        $(element).off('CornerstoneToolsTouchStartActive', touchToolInterface.touchDownActivateCallback || touchDownActivateCallback);
                        $(element).off('CornerstoneToolsTap', touchToolInterface.tapCallback || tapCallback);
                        cornerstoneTools.touchMoveAllHandles(e, data, toolData, touchToolInterface.toolType, true, doneMovingCallback);
                        e.stopImmediatePropagation();
                        return false; // false = causes jquery to preventDefault() and stopPropagation() this event
                    }
                }
            }
        }
        ///////// END INACTIVE TOOL ///////

        // not visible, not interactive
        function disable(element) {
            $(element).off('CornerstoneImageRendered', touchToolInterface.onImageRendered);
            $(element).off('CornerstoneToolsTouchStart', touchToolInterface.touchStartCallback || touchStartCallback);
            $(element).off('CornerstoneToolsTouchStartActive', touchToolInterface.touchDownActivateCallback || touchDownActivateCallback);
            $(element).off('CornerstoneToolsTap', touchToolInterface.tapCallback || tapCallback);

            if (touchToolInterface.doubleTapCallback) {
                $(element).off('CornerstoneToolsDoubleTap', touchToolInterface.doubleTapCallback);
            }
            
            if (touchToolInterface.pressCallback) {
                $(element).off('CornerstoneToolsTouchPress', touchToolInterface.pressCallback);
            }

            cornerstone.updateImage(element);
        }

        // visible but not interactive
        function enable(element) {
            $(element).off('CornerstoneImageRendered', touchToolInterface.onImageRendered);
            $(element).off('CornerstoneToolsTouchStart', touchToolInterface.touchStartCallback || touchStartCallback);
            $(element).off('CornerstoneToolsTouchStartActive', touchToolInterface.touchDownActivateCallback || touchDownActivateCallback);
            $(element).off('CornerstoneToolsTap', touchToolInterface.tapCallback || tapCallback);

            $(element).on('CornerstoneImageRendered', touchToolInterface.onImageRendered);

            if (touchToolInterface.doubleTapCallback) {
                $(element).off('CornerstoneToolsDoubleTap', touchToolInterface.doubleTapCallback);
            }

            if (touchToolInterface.pressCallback) {
                $(element).off('CornerstoneToolsTouchPress', touchToolInterface.pressCallback);
            }

            cornerstone.updateImage(element);
        }

        // visible, interactive and can create
        function activate(element) {
            //console.log('activate touchTool');

            $(element).off('CornerstoneImageRendered', touchToolInterface.onImageRendered);
            $(element).off('CornerstoneToolsTouchStart', touchToolInterface.touchStartCallback || touchStartCallback);
            $(element).off('CornerstoneToolsTouchStartActive', touchToolInterface.touchDownActivateCallback || touchDownActivateCallback);
            $(element).off('CornerstoneToolsTap', touchToolInterface.tapCallback || tapCallback);

            $(element).on('CornerstoneImageRendered', touchToolInterface.onImageRendered);
            $(element).on('CornerstoneToolsTouchStart', touchToolInterface.touchStartCallback || touchStartCallback);
            $(element).on('CornerstoneToolsTouchStartActive', touchToolInterface.touchDownActivateCallback || touchDownActivateCallback);
            $(element).on('CornerstoneToolsTap', touchToolInterface.tapCallback || tapCallback);

            if (touchToolInterface.doubleTapCallback) {
                $(element).off('CornerstoneToolsDoubleTap', touchToolInterface.doubleTapCallback);
                $(element).on('CornerstoneToolsDoubleTap', touchToolInterface.doubleTapCallback);
            }

            if (touchToolInterface.pressCallback) {
                $(element).off('CornerstoneToolsTouchPress', touchToolInterface.pressCallback);
                $(element).on('CornerstoneToolsTouchPress', touchToolInterface.pressCallback);
            }

            cornerstone.updateImage(element);
        }

        // visible, interactive
        function deactivate(element) {
            //console.log('deactivate touchTool');
            
            $(element).off('CornerstoneImageRendered', touchToolInterface.onImageRendered);
            $(element).off('CornerstoneToolsTouchStart', touchToolInterface.touchStartCallback || touchStartCallback);
            $(element).off('CornerstoneToolsTouchStartActive', touchToolInterface.touchDownActivateCallback || touchDownActivateCallback);
            $(element).off('CornerstoneToolsTap', touchToolInterface.tapCallback || tapCallback);

            $(element).on('CornerstoneImageRendered', touchToolInterface.onImageRendered);
            //$(element).on('CornerstoneToolsTap', touchToolInterface.tapCallback || tapCallback);

            if (touchToolInterface.doubleTapCallback) {
                $(element).off('CornerstoneToolsDoubleTap', touchToolInterface.doubleTapCallback);
                $(element).on('CornerstoneToolsDoubleTap', touchToolInterface.doubleTapCallback);
            }

            if (touchToolInterface.pressCallback) {
                $(element).off('CornerstoneToolsTouchPress', touchToolInterface.pressCallback);
                $(element).on('CornerstoneToolsTouchPress', touchToolInterface.pressCallback);
            }

            cornerstone.updateImage(element);
        }

        var toolInterface = {
            enable: enable,
            disable: disable,
            activate: activate,
            deactivate: deactivate,
            touchStartCallback: touchToolInterface.touchStartCallback || touchStartCallback,
            touchDownActivateCallback: touchToolInterface.touchDownActivateCallback || touchDownActivateCallback,
            tapCallback: touchToolInterface.tapCallback || tapCallback
        };

        // Expose pointNearTool if available
        if (touchToolInterface.pointNearTool) {
            toolInterface.pointNearTool = touchToolInterface.pointNearTool;
        }

        if (touchToolInterface.doubleTapCallback) {
            toolInterface.doubleTapCallback = touchToolInterface.doubleTapCallback;
        }

        if (touchToolInterface.pressCallback) {
            toolInterface.pressCallback = touchToolInterface.pressCallback;
        }

        if (touchToolInterface.addNewMeasurement) {
            toolInterface.addNewMeasurement = touchToolInterface.addNewMeasurement;
        }

        return toolInterface;
    }

    // module exports
    cornerstoneTools.touchTool = touchTool;

})($, cornerstone, cornerstoneMath, cornerstoneTools);
 
// End Source; src/imageTools/touchTool.js

// Begin Source: src/imageTools/AngleTool.js
(function($, cornerstone, cornerstoneMath, cornerstoneTools) {

    'use strict';

    var toolType = 'angle';

    ///////// BEGIN ACTIVE TOOL ///////
    function createNewMeasurement(mouseEventData) {
        // create the measurement data for this tool with the end handle activated
        var angleData = {
            visible: true,
            active: true,
            handles: {
                start: {
                    x: mouseEventData.currentPoints.image.x - 20,
                    y: mouseEventData.currentPoints.image.y + 10,
                    highlight: true,
                    active: false
                },
                end: {
                    x: mouseEventData.currentPoints.image.x,
                    y: mouseEventData.currentPoints.image.y,
                    highlight: true,
                    active: true
                },
                start2: {
                    x: mouseEventData.currentPoints.image.x - 20,
                    y: mouseEventData.currentPoints.image.y + 10,
                    highlight: true,
                    active: false
                },
                end2: {
                    x: mouseEventData.currentPoints.image.x,
                    y: mouseEventData.currentPoints.image.y + 20,
                    highlight: true,
                    active: false
                }
            }
        };

        return angleData;
    }
    ///////// END ACTIVE TOOL ///////

    function pointNearTool(element, data, coords) {
        var lineSegment = {
            start: cornerstone.pixelToCanvas(element, data.handles.start),
            end: cornerstone.pixelToCanvas(element, data.handles.end)
        };
        
        var distanceToPoint = cornerstoneMath.lineSegment.distanceToPoint(lineSegment, coords);
        if (distanceToPoint < 5) {
            return true;
        }

        lineSegment.start = cornerstone.pixelToCanvas(element, data.handles.start2);
        lineSegment.end = cornerstone.pixelToCanvas(element, data.handles.end2);

        distanceToPoint = cornerstoneMath.lineSegment.distanceToPoint(lineSegment, coords);
        return (distanceToPoint < 5);
    }

    ///////// BEGIN IMAGE RENDERING ///////
    function onImageRendered(e, eventData) {

        // if we have no toolData for this element, return immediately as there is nothing to do
        var toolData = cornerstoneTools.getToolState(e.currentTarget, toolType);
        if (toolData === undefined) {
            return;
        }

        // we have tool data for this element - iterate over each one and draw it
        var context = eventData.canvasContext.canvas.getContext('2d');
        context.setTransform(1, 0, 0, 1, 0, 0);
        
        //activation color 
        var color;
        var lineWidth = cornerstoneTools.toolStyle.getToolWidth();
        var font = cornerstoneTools.textStyle.getFont();
        var config = cornerstoneTools.angle.getConfiguration();

        for (var i = 0; i < toolData.data.length; i++) {
            context.save();

            // configurable shadow
            if (config && config.shadow) {
                context.shadowColor = config.shadowColor || '#000000';
                context.shadowOffsetX = config.shadowOffsetX || 1;
                context.shadowOffsetY = config.shadowOffsetY || 1;
            }

            var data = toolData.data[i];

            //differentiate the color of activation tool
            if (data.active) {
                color = cornerstoneTools.toolColors.getActiveColor();
            } else {
                color = cornerstoneTools.toolColors.getToolColor();
            }

            // draw the line
            context.beginPath();
            context.strokeStyle = color;
            context.lineWidth = lineWidth;

            var handleStartCanvas = cornerstone.pixelToCanvas(eventData.element, data.handles.start);
            var handleEndCanvas = cornerstone.pixelToCanvas(eventData.element, data.handles.end);

            context.moveTo(handleStartCanvas.x, handleStartCanvas.y);
            context.lineTo(handleEndCanvas.x, handleEndCanvas.y);

            handleStartCanvas = cornerstone.pixelToCanvas(eventData.element, data.handles.start2);
            handleEndCanvas = cornerstone.pixelToCanvas(eventData.element, data.handles.end2);

            context.moveTo(handleStartCanvas.x, handleStartCanvas.y);
            context.lineTo(handleEndCanvas.x, handleEndCanvas.y);
            context.stroke();

            // draw the handles
            cornerstoneTools.drawHandles(context, eventData, data.handles);

            // Draw the text
            context.fillStyle = color;

            // Need to work on correct angle to measure.  This is a cobb angle and we need to determine
            // where lines cross to measure angle. For now it will show smallest angle. 
            var dx1 = (Math.ceil(data.handles.start.x) - Math.ceil(data.handles.end.x)) * eventData.image.columnPixelSpacing;
            var dy1 = (Math.ceil(data.handles.start.y) - Math.ceil(data.handles.end.y)) * eventData.image.rowPixelSpacing;
            var dx2 = (Math.ceil(data.handles.start2.x) - Math.ceil(data.handles.end2.x)) * eventData.image.columnPixelSpacing;
            var dy2 = (Math.ceil(data.handles.start2.y) - Math.ceil(data.handles.end2.y)) * eventData.image.rowPixelSpacing;

            var angle = Math.acos(Math.abs(((dx1 * dx2) + (dy1 * dy2)) / (Math.sqrt((dx1 * dx1) + (dy1 * dy1)) * Math.sqrt((dx2 * dx2) + (dy2 * dy2)))));
            angle = angle * (180 / Math.PI);

            var rAngle = cornerstoneTools.roundToDecimal(angle, 2);
            var str = '00B0'; // degrees symbol
            var text = rAngle.toString() + String.fromCharCode(parseInt(str, 16));

            var textX = (handleStartCanvas.x + handleEndCanvas.x) / 2;
            var textY = (handleStartCanvas.y + handleEndCanvas.y) / 2;

            context.font = font;
            cornerstoneTools.drawTextBox(context, text, textX, textY, color);
            context.restore();
        }
    }
    ///////// END IMAGE RENDERING ///////

    // module exports
    cornerstoneTools.angle = cornerstoneTools.mouseButtonTool({
        createNewMeasurement: createNewMeasurement,
        onImageRendered: onImageRendered,
        pointNearTool: pointNearTool,
        toolType: toolType
    });
    
    cornerstoneTools.angleTouch = cornerstoneTools.touchTool({
        createNewMeasurement: createNewMeasurement,
        onImageRendered: onImageRendered,
        pointNearTool: pointNearTool,
        toolType: toolType
    });

})($, cornerstone, cornerstoneMath, cornerstoneTools);
 
// End Source; src/imageTools/AngleTool.js

// Begin Source: src/imageTools/annotation.js
(function($, cornerstone, cornerstoneMath, cornerstoneTools) {

    'use strict';

    var toolType = 'arrowAnnotate';

    // Define a callback to get your text annotation
    // This could be used, e.g. to open a modal
    function getTextCallback(doneChangingTextCallback) {
        doneChangingTextCallback(prompt('Enter your annotation:'));
    }

    function changeTextCallback(data, doneChangingTextCallback) {
        doneChangingTextCallback(prompt('Change your annotation:'));
    }

    var configuration = {
        getTextCallback: getTextCallback,
        changeTextCallback: changeTextCallback,
        drawHandles: false,
        drawHandlesOnHover: true,
        arrowFirst: true
    };

    /// --- Mouse Tool --- ///

    ///////// BEGIN ACTIVE TOOL ///////
    function addNewMeasurement(mouseEventData) {

        function doneChangingTextCallback(text) {
            if (text !== null) {
                measurementData.text = text;
            } else {
                cornerstoneTools.removeToolState(mouseEventData.element, toolType, measurementData);
            }

            measurementData.active = false;
            cornerstone.updateImage(mouseEventData.element);
        }

        var measurementData = createNewMeasurement(mouseEventData);

        var eventData = {
            mouseButtonMask: mouseEventData.which,
        };
        
        // associate this data with this imageId so we can render it and manipulate it
        cornerstoneTools.addToolState(mouseEventData.element, toolType, measurementData);
       
        // since we are dragging to another place to drop the end point, we can just activate
        // the end point and let the moveHandle move it for us.
        $(mouseEventData.element).off('CornerstoneToolsMouseMove', cornerstoneTools.arrowAnnotate.mouseMoveCallback);
        $(mouseEventData.element).off('CornerstoneToolsMouseDown', cornerstoneTools.arrowAnnotate.mouseDownCallback);
        $(mouseEventData.element).off('CornerstoneToolsMouseDownActivate', cornerstoneTools.arrowAnnotate.mouseDownActivateCallback);

        cornerstone.updateImage(mouseEventData.element);
        cornerstoneTools.moveNewHandle(mouseEventData, measurementData.handles.end, function() {
            if (cornerstoneTools.anyHandlesOutsideImage(mouseEventData, measurementData.handles)) {
                // delete the measurement
                cornerstoneTools.removeToolState(mouseEventData.element, toolType, measurementData);
            }

            var config = cornerstoneTools.arrowAnnotate.getConfiguration();
            if (measurementData.text === undefined) {
                config.getTextCallback(doneChangingTextCallback);
            }

            $(mouseEventData.element).on('CornerstoneToolsMouseMove', eventData, cornerstoneTools.arrowAnnotate.mouseMoveCallback);
            $(mouseEventData.element).on('CornerstoneToolsMouseDown', eventData, cornerstoneTools.arrowAnnotate.mouseDownCallback);
            $(mouseEventData.element).on('CornerstoneToolsMouseDownActivate', eventData, cornerstoneTools.arrowAnnotate.mouseDownActivateCallback);
            cornerstone.updateImage(mouseEventData.element);
        });
    }

    function createNewMeasurement(mouseEventData) {
        // create the measurement data for this tool with the end handle activated
        var measurementData = {
            visible: true,
            active: true,
            handles: {
                start: {
                    x: mouseEventData.currentPoints.image.x,
                    y: mouseEventData.currentPoints.image.y,
                    highlight: true,
                    active: false
                },
                end: {
                    x: mouseEventData.currentPoints.image.x,
                    y: mouseEventData.currentPoints.image.y,
                    highlight: true,
                    active: false
                }
            }
        };

        return measurementData;
    }
    ///////// END ACTIVE TOOL ///////

    function pointNearTool(element, data, coords) {
        var lineSegment = {
            start: cornerstone.pixelToCanvas(element, data.handles.start),
            end: cornerstone.pixelToCanvas(element, data.handles.end)
        };

        var distanceToPoint = cornerstoneMath.lineSegment.distanceToPoint(lineSegment, coords);
        if (distanceToPoint < 25) {
            return true;
        }

        if (data.textCoords) {
            var padding = 5;
            var fontSize = cornerstoneTools.textStyle.getFontSize();
            
            var rect = {
                left: data.textCoords.x,
                top: data.textCoords.y,
                width: data.textWidth + (padding * 2),
                height: fontSize + (padding * 2)
            };

            var distanceToTextRect = cornerstoneMath.rect.distanceToPoint(rect, coords);
            return (distanceToTextRect < 25);
        }
    }

    ///////// BEGIN IMAGE RENDERING ///////
    function onImageRendered(e, eventData) {
        // if we have no toolData for this element, return immediately as there is nothing to do
        var toolData = cornerstoneTools.getToolState(e.currentTarget, toolType);
        if (toolData === undefined) {
            return;
        }

        // we have tool data for this element - iterate over each one and draw it
        var context = eventData.canvasContext.canvas.getContext('2d');
        context.setTransform(1, 0, 0, 1, 0, 0);

        var color;
        var lineWidth = cornerstoneTools.toolStyle.getToolWidth();
        var font = cornerstoneTools.textStyle.getFont();
        var config = cornerstoneTools.arrowAnnotate.getConfiguration();

        for (var i = 0; i < toolData.data.length; i++) {
            context.save();

            if (config && config.shadow) {
                context.shadowColor = config.shadowColor || '#000000';
                context.shadowOffsetX = config.shadowOffsetX || 1;
                context.shadowOffsetY = config.shadowOffsetY || 1;
            }

            var data = toolData.data[i];

            if (data.active) {
                color = cornerstoneTools.toolColors.getActiveColor();
            } else {
                color = cornerstoneTools.toolColors.getToolColor();
            }
            
            // Draw the arrow
            var handleStartCanvas = cornerstone.pixelToCanvas(eventData.element, data.handles.start);
            var handleEndCanvas = cornerstone.pixelToCanvas(eventData.element, data.handles.end);

            if (config.arrowFirst) {
                cornerstoneTools.drawArrow(context, handleEndCanvas, handleStartCanvas, color, lineWidth);
            } else {
                cornerstoneTools.drawArrow(context, handleStartCanvas, handleEndCanvas, color, lineWidth);
            }

            if (config.drawHandles) {
                cornerstoneTools.drawHandles(context, eventData, data.handles, color);
            } else if (config.drawHandlesOnHover && data.handles.start.active) {
                cornerstoneTools.drawHandles(context, eventData, [ data.handles.start ], color);
            } else if (config.drawHandlesOnHover && data.handles.end.active) {
                cornerstoneTools.drawHandles(context, eventData, [ data.handles.end ], color);
            }

            // Draw the text
            if (data.text && data.text !== '') {
                context.font = font;
                
                var distance = 13;

                // TODO: add 2 dimensional vector operations to cornerstoneMath
                var vector;
                
                var displacement = {
                    x: distance,
                    y: distance / 2
                };

                vector = {
                    x: handleEndCanvas.x - handleStartCanvas.x,
                    y: handleEndCanvas.y - handleStartCanvas.y
                };

                var textWidth = context.measureText(data.text).width;

                var textCoords;
                if (config.arrowFirst) {
                    // Fix text placement if arrow faces right
                    if (vector.x < 0) {
                        displacement.x = -displacement.x - textWidth;
                    }

                    textCoords = {
                        x: vector.x + handleStartCanvas.x + displacement.x,
                        y: vector.y + handleStartCanvas.y + displacement.y
                    };
                } else {
                    // Fix text placement if arrow faces right
                    if (vector.x > 0) {
                        displacement.x = -displacement.x - textWidth;
                    }

                    textCoords = {
                        x: -vector.x + handleEndCanvas.x + displacement.x,
                        y: -vector.y + handleEndCanvas.y + displacement.y
                    };
                }

                data.textCoords = textCoords;
                data.textWidth = textWidth;
                cornerstoneTools.drawTextBox(context, data.text, textCoords.x, textCoords.y, color);
            }

            context.restore();
        }
    }
    // ---- Touch tool ----

    ///////// BEGIN ACTIVE TOOL ///////
    function addNewMeasurementTouch(touchEventData) {
        var element = touchEventData.element;

        function doneChangingTextCallback(text) {
            if (text !== null) {
                measurementData.text = text;
            } else {
                cornerstoneTools.removeToolState(element, toolType, measurementData);
            }

            measurementData.active = false;
            cornerstone.updateImage(element);
        }

        var measurementData = createNewMeasurement(touchEventData);
        cornerstoneTools.addToolState(element, toolType, measurementData);
        $(element).off('CornerstoneToolsTouchStartActive', cornerstoneTools.arrowAnnotateTouch.touchDownActivateCallback);
        $(element).off('CornerstoneToolsTap', cornerstoneTools.arrowAnnotateTouch.tapCallback);
        cornerstone.updateImage(element);

        cornerstoneTools.moveNewHandleTouch(touchEventData, measurementData.handles.end, function() {
            cornerstone.updateImage(element);

            if (cornerstoneTools.anyHandlesOutsideImage(touchEventData, measurementData.handles)) {
                // delete the measurement
                cornerstoneTools.removeToolState(element, toolType, measurementData);
            }

            var config = cornerstoneTools.arrowAnnotate.getConfiguration();
            if (measurementData.text === undefined) {
                config.getTextCallback(doneChangingTextCallback);
            }

            $(element).on('CornerstoneToolsTouchStartActive', cornerstoneTools.arrowAnnotateTouch.touchDownActivateCallback);
            $(element).on('CornerstoneToolsTap', cornerstoneTools.arrowAnnotateTouch.tapCallback);
        });
    }

    function doubleClickCallback(e, eventData) {
        var element = eventData.element;
        var data;

        function doneChangingTextCallback(data, updatedText, deleteTool) {
            if (deleteTool === true) {
                cornerstoneTools.removeToolState(element, toolType, data);
            } else {
                data.text = updatedText;
            }

            data.active = false;
            cornerstone.updateImage(element);
        }

        if (e.data && e.data.mouseButtonMask && !cornerstoneTools.isMouseButtonEnabled(eventData.which, e.data.mouseButtonMask)) {
            return false;
        }

        var config = cornerstoneTools.arrowAnnotate.getConfiguration();

        var coords = eventData.currentPoints.canvas;
        var toolData = cornerstoneTools.getToolState(element, toolType);

        // now check to see if there is a handle we can move
        if (!toolData) {
            return false;
        }

        for (var i = 0; i < toolData.data.length; i++) {
            data = toolData.data[i];
            if (pointNearTool(element, data, coords)) {
                data.active = true;
                cornerstone.updateImage(element);
                // Allow relabelling via a callback
                config.changeTextCallback(data, doneChangingTextCallback);
                
                e.stopImmediatePropagation();
                return false;
            }
        }

        return false; // false = causes jquery to preventDefault() and stopPropagation() this event
    }

    function pressCallback(e, eventData) {
        var element = eventData.element;
        var data;

        function doneChangingTextCallback(data, updatedText, deleteTool) {
            if (deleteTool === true) {
                cornerstoneTools.removeToolState(element, toolType, data);
            } else {
                data.text = updatedText;
            }

            data.active = false;
            cornerstone.updateImage(element);
            $(element).on('CornerstoneToolsTouchStart', cornerstoneTools.arrowAnnotateTouch.touchStartCallback);
            $(element).on('CornerstoneToolsTouchStartActive', cornerstoneTools.arrowAnnotateTouch.touchDownActivateCallback);
        }

        if (e.data && e.data.mouseButtonMask && !cornerstoneTools.isMouseButtonEnabled(eventData.which, e.data.mouseButtonMask)) {
            return false;
        }

        var config = cornerstoneTools.arrowAnnotate.getConfiguration();

        var coords = eventData.currentPoints.canvas;
        var toolData = cornerstoneTools.getToolState(element, toolType);

        // now check to see if there is a handle we can move
        if (!toolData) {
            return false;
        }

        for (var i = 0; i < toolData.data.length; i++) {
            data = toolData.data[i];
            if (pointNearTool(element, data, coords)) {
                data.active = true;
                cornerstone.updateImage(element);
                // Allow relabelling via a callback
                $(element).off('CornerstoneToolsTouchStart', cornerstoneTools.arrowAnnotateTouch.touchStartCallback);
                $(element).off('CornerstoneToolsTouchStartActive', cornerstoneTools.arrowAnnotateTouch.touchDownActivateCallback);
                config.changeTextCallback(data, doneChangingTextCallback);
                
                e.stopImmediatePropagation();
                return false;
            }
        }

        return false; // false = causes jquery to preventDefault() and stopPropagation() this event
    }

    cornerstoneTools.arrowAnnotate = cornerstoneTools.mouseButtonTool({
        addNewMeasurement: addNewMeasurement,
        createNewMeasurement: createNewMeasurement,
        onImageRendered: onImageRendered,
        pointNearTool: pointNearTool,
        toolType: toolType,
        mouseDoubleClickCallback: doubleClickCallback
    });

    cornerstoneTools.arrowAnnotate.setConfiguration(configuration);

    cornerstoneTools.arrowAnnotateTouch = cornerstoneTools.touchTool({
        addNewMeasurement: addNewMeasurementTouch,
        createNewMeasurement: createNewMeasurement,
        onImageRendered: onImageRendered,
        pointNearTool: pointNearTool,
        toolType: toolType,
        pressCallback: pressCallback
    });

})($, cornerstone, cornerstoneMath, cornerstoneTools);
 
// End Source; src/imageTools/annotation.js

// Begin Source: src/imageTools/crosshairs.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    var toolType = 'crosshairs';

    function chooseLocation(e, eventData) {
        e.stopImmediatePropagation(); // Prevent CornerstoneToolsTouchStartActive from killing any press events
        
        // if we have no toolData for this element, return immediately as there is nothing to do
        var toolData = cornerstoneTools.getToolState(e.currentTarget, toolType);
        if (!toolData) {
            return;
        }

        // Get current element target information
        var sourceElement = e.currentTarget;
        var sourceEnabledElement = cornerstone.getEnabledElement(sourceElement);
        var sourceImageId = sourceEnabledElement.image.imageId;
        var sourceImagePlane = cornerstoneTools.metaData.get('imagePlane', sourceImageId);

        // Get currentPoints from mouse cursor on selected element
        var sourceImagePoint = eventData.currentPoints.image;

        // Transfer this to a patientPoint given imagePlane metadata
        var patientPoint = cornerstoneTools.imagePointToPatientPoint(sourceImagePoint, sourceImagePlane);

        // Get the enabled elements associated with this synchronization context
        var syncContext = toolData.data[0].synchronizationContext;
        var enabledElements = syncContext.getSourceElements();

        // Iterate over each synchronized element
        $.each(enabledElements, function(index, targetElement) {
            // don't do anything if the target is the same as the source
            if (targetElement === sourceElement) {
                return; // Same as 'continue' in a normal for loop
            }

            var minDistance = Number.MAX_VALUE;
            var newImageIdIndex = -1;

            var stackToolDataSource = cornerstoneTools.getToolState(targetElement, 'stack');
            if (stackToolDataSource === undefined) {
                return; // Same as 'continue' in a normal for loop
            }

            var stackData = stackToolDataSource.data[0];

            // Find within the element's stack the closest image plane to selected location
            $.each(stackData.imageIds, function(index, imageId) {
                var imagePlane = cornerstoneTools.metaData.get('imagePlane', imageId);
                var imagePosition = imagePlane.imagePositionPatient;
                var row = imagePlane.rowCosines.clone();
                var column = imagePlane.columnCosines.clone();
                var normal = column.clone().cross(row.clone());
                var distance = Math.abs(normal.clone().dot(imagePosition) - normal.clone().dot(patientPoint));
                //console.log(index + '=' + distance);
                if (distance < minDistance) {
                    minDistance = distance;
                    newImageIdIndex = index;
                }
            });

            if (newImageIdIndex === stackData.currentImageIdIndex) {
                return;
            }

            // Switch the loaded image to the required image
            if (newImageIdIndex !== -1 && stackData.imageIds[newImageIdIndex] !== undefined) {
                var startLoadingHandler = cornerstoneTools.loadHandlerManager.getStartLoadHandler();
                var endLoadingHandler = cornerstoneTools.loadHandlerManager.getEndLoadHandler();
                var errorLoadingHandler = cornerstoneTools.loadHandlerManager.getErrorLoadingHandler();

                if (startLoadingHandler) {
                    startLoadingHandler(targetElement);
                }

                cornerstone.loadAndCacheImage(stackData.imageIds[newImageIdIndex]).then(function(image) {
                    var viewport = cornerstone.getViewport(targetElement);
                    stackData.currentImageIdIndex = newImageIdIndex;
                    cornerstone.displayImage(targetElement, image, viewport);
                    if (endLoadingHandler) {
                        endLoadingHandler(targetElement);
                    }
                }, function(error) {
                    var imageId = stackData.imageIds[newImageIdIndex];
                    if (errorLoadingHandler) {
                        errorLoadingHandler(targetElement, imageId, error);
                    }
                });
            }
        });
    }

    function mouseUpCallback(e, eventData) {
        $(eventData.element).off('CornerstoneToolsMouseDrag', mouseDragCallback);
        $(eventData.element).off('CornerstoneToolsMouseUp', mouseUpCallback);
    }

    function mouseDownCallback(e, eventData) {
        if (cornerstoneTools.isMouseButtonEnabled(eventData.which, e.data.mouseButtonMask)) {
            $(eventData.element).on('CornerstoneToolsMouseDrag', mouseDragCallback);
            $(eventData.element).on('CornerstoneToolsMouseUp', mouseUpCallback);
            chooseLocation(e, eventData);
            return false; // false = cases jquery to preventDefault() and stopPropagation() this event
        }
    }

    function mouseDragCallback(e, eventData) {
        chooseLocation(e, eventData);
        return false; // false = causes jquery to preventDefault() and stopPropagation() this event
    }

    function enable(element, mouseButtonMask, synchronizationContext) {
        var eventData = {
            mouseButtonMask: mouseButtonMask,
        };
        
        // Clear any currently existing toolData
        var toolData = cornerstoneTools.getToolState(element, toolType);
        toolData = [];

        cornerstoneTools.addToolState(element, toolType, {
            synchronizationContext: synchronizationContext,
        });

        $(element).off('CornerstoneToolsMouseDown', mouseDownCallback);

        $(element).on('CornerstoneToolsMouseDown', eventData, mouseDownCallback);
    }

    // disables the reference line tool for the given element
    function disable(element) {
        $(element).off('CornerstoneToolsMouseDown', mouseDownCallback);
    }

    // module/private exports
    cornerstoneTools.crosshairs = {
        activate: enable,
        deactivate: disable,
        enable: enable,
        disable: disable
    };

    function dragEndCallback(e, eventData) {
        $(eventData.element).off('CornerstoneToolsTouchDrag', dragCallback);
        $(eventData.element).off('CornerstoneToolsDragEnd', dragEndCallback);
    }

    function dragStartCallback(e, eventData) {
        $(eventData.element).on('CornerstoneToolsTouchDrag', dragCallback);
        $(eventData.element).on('CornerstoneToolsDragEnd', dragEndCallback);
        chooseLocation(e, eventData);
        return false;
    }

    function dragCallback(e, eventData) {
        chooseLocation(e, eventData);
        return false; // false = causes jquery to preventDefault() and stopPropagation() this event
    }

    function enableTouch(element, synchronizationContext) {
        // Clear any currently existing toolData
        var toolData = cornerstoneTools.getToolState(element, toolType);
        toolData = [];

        cornerstoneTools.addToolState(element, toolType, {
            synchronizationContext: synchronizationContext,
        });

        $(element).off('CornerstoneToolsTouchStart', dragStartCallback);

        $(element).on('CornerstoneToolsTouchStart', dragStartCallback);
    }

    // disables the reference line tool for the given element
    function disableTouch(element) {
        $(element).off('CornerstoneToolsTouchStart', dragStartCallback);
    }

    cornerstoneTools.crosshairsTouch = {
        activate: enableTouch,
        deactivate: disableTouch,
        enable: enableTouch,
        disable: disableTouch
    };

})($, cornerstone, cornerstoneTools);
 
// End Source; src/imageTools/crosshairs.js

// Begin Source: src/imageTools/displayTool.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    function displayTool(onImageRendered) {
        var configuration = {};

        var toolInterface = {
            disable: function(element) {$(element).off('CornerstoneImageRendered', onImageRendered);},
            enable: function(element) {
                $(element).off('CornerstoneImageRendered', onImageRendered);
                $(element).on('CornerstoneImageRendered', onImageRendered);
                cornerstone.updateImage(element);
            },
            getConfiguration: function() { return configuration; },
            setConfiguration: function(config) {configuration = config;}
        };

        return toolInterface;
    }

    // module exports
    cornerstoneTools.displayTool = displayTool;

})($, cornerstone, cornerstoneTools);
 
// End Source; src/imageTools/displayTool.js

// Begin Source: src/imageTools/dragProbe.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    function defaultStrategy(eventData) {
        var enabledElement = cornerstone.getEnabledElement(eventData.element);

        cornerstone.updateImage(eventData.element);

        var context = enabledElement.canvas.getContext('2d');
        context.setTransform(1, 0, 0, 1, 0, 0);

        var color = cornerstoneTools.toolColors.getActiveColor();
        var font = cornerstoneTools.textStyle.getFont();
        var fontHeight = cornerstoneTools.textStyle.getFontSize();
        var config = cornerstoneTools.dragProbe.getConfiguration();

        context.save();

        if (config && config.shadow) {
            context.shadowColor = config.shadowColor || '#000000';
            context.shadowOffsetX = config.shadowOffsetX || 1;
            context.shadowOffsetY = config.shadowOffsetY || 1;
        }

        var x = Math.round(eventData.currentPoints.image.x);
        var y = Math.round(eventData.currentPoints.image.y);

        var storedPixels;
        var text,
            str;

        if (x < 0 || y < 0 || x >= eventData.image.columns || y >= eventData.image.rows) {
            return;
        }

        if (eventData.image.color) {
            storedPixels = cornerstoneTools.getRGBPixels(eventData.element, x, y, 1, 1);
            text = '' + x + ', ' + y;
            str = 'R: ' + storedPixels[0] + ' G: ' + storedPixels[1] + ' B: ' + storedPixels[2] + ' A: ' + storedPixels[3];
        } else {
            storedPixels = cornerstone.getStoredPixels(eventData.element, x, y, 1, 1);
            var sp = storedPixels[0];
            var mo = sp * eventData.image.slope + eventData.image.intercept;
            var suv = cornerstoneTools.calculateSUV(eventData.image, sp);

            // Draw text
            text = '' + x + ', ' + y;
            str = 'SP: ' + sp + ' MO: ' + parseFloat(mo.toFixed(3));
            if (suv) {
                str += ' SUV: ' + parseFloat(suv.toFixed(3));
            }
        }

        // Draw text
        var coords = {
            // translate the x/y away from the cursor
            x: eventData.currentPoints.image.x + 3,
            y: eventData.currentPoints.image.y - 3
        };
        var textCoords = cornerstone.pixelToCanvas(eventData.element, coords);
        
        context.font = font;
        context.fillStyle = color;

        cornerstoneTools.drawTextBox(context, str, textCoords.x, textCoords.y + fontHeight + 5, color);
        cornerstoneTools.drawTextBox(context, text, textCoords.x, textCoords.y, color);
        context.restore();
    }

    function minimalStrategy(eventData) {
        var element = eventData.element;
        var enabledElement = cornerstone.getEnabledElement(element);
        var image = enabledElement.image;

        cornerstone.updateImage(element);

        var context = enabledElement.canvas.getContext('2d');
        context.setTransform(1, 0, 0, 1, 0, 0);

        var color = cornerstoneTools.toolColors.getActiveColor();
        var font = cornerstoneTools.textStyle.getFont();
        var config = cornerstoneTools.dragProbe.getConfiguration();
        
        context.save();

        if (config && config.shadow) {
            context.shadowColor = config.shadowColor || '#000000';
            context.shadowOffsetX = config.shadowOffsetX || 1;
            context.shadowOffsetY = config.shadowOffsetY || 1;
        }

        var toolCoords;
        if (eventData.isTouchEvent === true) {
            toolCoords = cornerstone.pageToPixel(element, eventData.currentPoints.page.x,
                eventData.currentPoints.page.y - cornerstoneTools.textStyle.getFontSize() * 4);
        } else {
            toolCoords = eventData.currentPoints.image;
        }

        var storedPixels;
        var text;

        if (toolCoords.x < 0 || toolCoords.y < 0 ||
            toolCoords.x >= image.columns || toolCoords.y >= image.rows) {
            return;
        }
        
        if (image.color) {
            storedPixels = cornerstone.getStoredPixels(element, toolCoords.x, toolCoords.y, 3, 1);
            text = 'R: ' + storedPixels[0] + ' G: ' + storedPixels[1] + ' B: ' + storedPixels[2];
        } else {
            storedPixels = cornerstone.getStoredPixels(element, toolCoords.x, toolCoords.y, 1, 1);
            var huValue = storedPixels[0] * image.slope + image.intercept;
            text = parseFloat(huValue.toFixed(3));
        }

        // Prepare text
        var textCoords = cornerstone.pixelToCanvas(element, toolCoords);
        context.font = font;
        context.fillStyle = color;

        // Translate the x/y away from the cursor
        var translation;
        if (eventData.isTouchEvent === true) {
            var width = context.measureText(text).width;
            translation = {
                x: -width / 2 - 5,
                y: -cornerstoneTools.textStyle.getFontSize() * 1.5
            };

            var handleRadius = 6;

            context.beginPath();
            context.strokeStyle = color;
            context.arc(textCoords.x, textCoords.y, handleRadius, 0, 2 * Math.PI);
            context.stroke();
        } else {
            translation = {
                x: 4,
                y: -4
            };
        }

        cornerstoneTools.drawTextBox(context, text, textCoords.x + translation.x, textCoords.y + translation.y, color);
        context.restore();
    }

    function mouseUpCallback(e, eventData) {
        $(eventData.element).off('CornerstoneToolsMouseDrag', dragCallback);
        $(eventData.element).off('CornerstoneToolsMouseUp', mouseUpCallback);
        cornerstone.updateImage(eventData.element);
    }

    function mouseDownCallback(e, eventData) {
        if (cornerstoneTools.isMouseButtonEnabled(eventData.which, e.data.mouseButtonMask)) {
            $(eventData.element).on('CornerstoneToolsMouseDrag', dragCallback);
            $(eventData.element).on('CornerstoneToolsMouseUp', mouseUpCallback);
            cornerstoneTools.dragProbe.strategy(eventData);
            return false; // false = causes jquery to preventDefault() and stopPropagation() this event
        }
    }

    function dragCallback(e, eventData) {
        cornerstoneTools.dragProbe.strategy(eventData);
        return false; // false = causes jquery to preventDefault() and stopPropagation() this event
    }

    cornerstoneTools.dragProbe = cornerstoneTools.simpleMouseButtonTool(mouseDownCallback);
    
    cornerstoneTools.dragProbe.strategies = {
        default: defaultStrategy,
        minimal: minimalStrategy
    };
    cornerstoneTools.dragProbe.strategy = defaultStrategy;

    var options = {
        fireOnTouchStart: true
    };
    cornerstoneTools.dragProbeTouch = cornerstoneTools.touchDragTool(dragCallback, options);

})($, cornerstone, cornerstoneTools);
 
// End Source; src/imageTools/dragProbe.js

// Begin Source: src/imageTools/ellipticalRoi.js
(function($, cornerstone, cornerstoneMath, cornerstoneTools) {

    'use strict';

    var toolType = 'ellipticalRoi';

    ///////// BEGIN ACTIVE TOOL ///////
    function createNewMeasurement(mouseEventData) {
        // create the measurement data for this tool with the end handle activated
        var measurementData = {
            visible: true,
            active: true,
            invalidated: true,
            handles: {
                start: {
                    x: mouseEventData.currentPoints.image.x,
                    y: mouseEventData.currentPoints.image.y,
                    highlight: true,
                    active: false
                },
                end: {
                    x: mouseEventData.currentPoints.image.x,
                    y: mouseEventData.currentPoints.image.y,
                    highlight: true,
                    active: true
                }
            }
        };

        return measurementData;
    }
    ///////// END ACTIVE TOOL ///////

    ///////// BEGIN IMAGE RENDERING ///////
    function pointInEllipse(ellipse, location) {
        var xRadius = ellipse.width / 2;
        var yRadius = ellipse.height / 2;

        if (xRadius <= 0.0 || yRadius <= 0.0) {
            return false;
        }

        var center = {
            x: ellipse.left + xRadius,
            y: ellipse.top + yRadius
        };

        /* This is a more general form of the circle equation
         *
         * X^2/a^2 + Y^2/b^2 <= 1
         */

        var normalized = {
            x: location.x - center.x,
            y: location.y - center.y
        };

        var inEllipse = ((normalized.x * normalized.x) / (xRadius * xRadius)) + ((normalized.y * normalized.y) / (yRadius * yRadius)) <= 1.0;
        return inEllipse;
    }

    function calculateMeanStdDev(sp, ellipse) {
        // TODO: Get a real statistics library here that supports large counts

        var sum = 0;
        var sumSquared = 0;
        var count = 0;
        var index = 0;

        for (var y = ellipse.top; y < ellipse.top + ellipse.height; y++) {
            for (var x = ellipse.left; x < ellipse.left + ellipse.width; x++) {
                if (pointInEllipse(ellipse, {
                    x: x,
                    y: y
                }) === true) {
                    sum += sp[index];
                    sumSquared += sp[index] * sp[index];
                    count++;
                }

                index++;
            }
        }

        if (count === 0) {
            return {
                count: count,
                mean: 0.0,
                variance: 0.0,
                stdDev: 0.0
            };
        }

        var mean = sum / count;
        var variance = sumSquared / count - mean * mean;

        return {
            count: count,
            mean: mean,
            variance: variance,
            stdDev: Math.sqrt(variance)
        };
    }

    function pointNearEllipse(element, data, coords, distance) {
        var startCanvas = cornerstone.pixelToCanvas(element, data.handles.start);
        var endCanvas = cornerstone.pixelToCanvas(element, data.handles.end);

        var minorEllipse = {
            left: Math.min(startCanvas.x, endCanvas.x) + distance / 2,
            top: Math.min(startCanvas.y, endCanvas.y) + distance / 2 ,
            width: Math.abs(startCanvas.x - endCanvas.x) - distance,
            height: Math.abs(startCanvas.y - endCanvas.y) - distance
        };
        
        var majorEllipse = {
            left: Math.min(startCanvas.x, endCanvas.x) - distance / 2,
            top: Math.min(startCanvas.y, endCanvas.y) - distance / 2 ,
            width: Math.abs(startCanvas.x - endCanvas.x) + distance,
            height: Math.abs(startCanvas.y - endCanvas.y) + distance
        };

        var pointInMinorEllipse = pointInEllipse(minorEllipse, coords);
        var pointInMajorEllipse = pointInEllipse(majorEllipse, coords);

        if (pointInMajorEllipse && !pointInMinorEllipse) {
            return true;
        }

        return false;
    }

    function pointNearTool(element, data, coords) {
        return pointNearEllipse(element, data, coords, 15);
    }

    function pointNearToolTouch(element, data, coords) {
        return pointNearEllipse(element, data, coords, 25);
    }

    function onImageRendered(e, eventData) {

        // if we have no toolData for this element, return immediately as there is nothing to do
        var toolData = cornerstoneTools.getToolState(e.currentTarget, toolType);
        if (toolData === undefined) {
            return;
        }

        // we have tool data for this element - iterate over each one and draw it
        var context = eventData.canvasContext.canvas.getContext('2d');
        context.setTransform(1, 0, 0, 1, 0, 0);

        //activation color 
        var color;
        var lineWidth = cornerstoneTools.toolStyle.getToolWidth();
        var font = cornerstoneTools.textStyle.getFont();
        var fontHeight = cornerstoneTools.textStyle.getFontSize();
        var config = cornerstoneTools.ellipticalRoi.getConfiguration();

        for (var i = 0; i < toolData.data.length; i++) {
            context.save();
            
            if (config && config.shadow) {
                context.shadowColor = config.shadowColor || '#000000';
                context.shadowOffsetX = config.shadowOffsetX || 1;
                context.shadowOffsetY = config.shadowOffsetY || 1;
            }

            var data = toolData.data[i];

            //differentiate the color of activation tool
            if (data.active) {
                color = cornerstoneTools.toolColors.getActiveColor();
            } else {
                color = cornerstoneTools.toolColors.getToolColor();
            }

            // draw the ellipse
            var handleStartCanvas = cornerstone.pixelToCanvas(eventData.element, data.handles.start);
            var handleEndCanvas = cornerstone.pixelToCanvas(eventData.element, data.handles.end);

            var widthCanvas = Math.abs(handleStartCanvas.x - handleEndCanvas.x);
            var heightCanvas = Math.abs(handleStartCanvas.y - handleEndCanvas.y);
            var leftCanvas = Math.min(handleStartCanvas.x, handleEndCanvas.x);
            var topCanvas = Math.min(handleStartCanvas.y, handleEndCanvas.y);
            var centerX = (handleStartCanvas.x + handleEndCanvas.x) / 2;
            var centerY = (handleStartCanvas.y + handleEndCanvas.y) / 2;

            context.beginPath();
            context.strokeStyle = color;
            context.lineWidth = lineWidth;
            cornerstoneTools.drawEllipse(context, leftCanvas, topCanvas, widthCanvas, heightCanvas);
            context.closePath();

            // draw the handles
            cornerstoneTools.drawHandles(context, eventData, data.handles, color);
            
            context.font = font;

            var textX,
                textY,
                area,
                meanStdDev;

            if (!data.invalidated) {
                textX = data.textX;
                textY = data.textY;
                meanStdDev = data.meanStdDev;
                area = data.area;
            } else {
                // TODO: calculate this in web worker for large pixel counts...
                var width = Math.abs(data.handles.start.x - data.handles.end.x);
                var height = Math.abs(data.handles.start.y - data.handles.end.y);
                var left = Math.min(data.handles.start.x, data.handles.end.x);
                var top = Math.min(data.handles.start.y, data.handles.end.y);

                var pixels = cornerstone.getPixels(eventData.element, left, top, width, height);

                var ellipse = {
                    left: left,
                    top: top,
                    width: width,
                    height: height
                };

                // Calculate the mean, stddev, and area
                meanStdDev = calculateMeanStdDev(pixels, ellipse);
                area = Math.PI * (width * eventData.image.columnPixelSpacing / 2) * (height * eventData.image.rowPixelSpacing / 2);

                data.invalidated = false;
                if (!isNaN(area)) {
                    data.area = area;
                }

                if (!isNaN(meanStdDev.mean) && !isNaN(meanStdDev.stdDev)) {
                    data.meanStdDev = meanStdDev;
                }
            }

            // Draw text

            var areaText,
                areaTextWidth = 0;
            if (area !== undefined) {
                areaText = 'Area: ' + area.toFixed(2) + ' mm' + String.fromCharCode(178);
                areaTextWidth = context.measureText(areaText).width;
            }

            var meanText = 'Mean: ' + meanStdDev.mean.toFixed(2);
            var meanTextWidth = context.measureText(meanText).width;

            var stdDevText = 'StdDev: ' + meanStdDev.stdDev.toFixed(2);
            var stdDevTextWidth = context.measureText(stdDevText).width;

            var longestTextWidth = Math.max(meanTextWidth, areaTextWidth, stdDevTextWidth);

            textX = centerX < (eventData.image.columns / 2) ? centerX + (widthCanvas / 2) + longestTextWidth: centerX - (widthCanvas / 2) - longestTextWidth - 15;
            textY = centerY < (eventData.image.rows / 2) ? centerY + (heightCanvas / 2): centerY - (heightCanvas / 2);

            context.fillStyle = color;
            if (meanStdDev) {
                cornerstoneTools.drawTextBox(context, meanText, textX, textY - fontHeight - 5, color);
                cornerstoneTools.drawTextBox(context, stdDevText, textX, textY, color);
            }
            
            // Char code 178 is a superscript 2 for mm^2
            if (area !== undefined && !isNaN(area)) {
                cornerstoneTools.drawTextBox(context, areaText, textX, textY + fontHeight + 5, color);
            }

            context.restore();
        }
    }
    ///////// END IMAGE RENDERING ///////

    // module exports
    cornerstoneTools.ellipticalRoi = cornerstoneTools.mouseButtonTool({
        createNewMeasurement: createNewMeasurement,
        onImageRendered: onImageRendered,
        pointNearTool: pointNearTool,
        toolType: toolType
    });
    cornerstoneTools.ellipticalRoiTouch = cornerstoneTools.touchTool({
        createNewMeasurement: createNewMeasurement,
        onImageRendered: onImageRendered,
        pointNearTool: pointNearToolTouch,
        toolType: toolType
    });

})($, cornerstone, cornerstoneMath, cornerstoneTools);
 
// End Source; src/imageTools/ellipticalRoi.js

// Begin Source: src/imageTools/freehand.js
(function($, cornerstone, cornerstoneMath, cornerstoneTools) {

    'use strict';

    var toolType = 'freehand';
    var configuration = {
        mouseLocation: {
            handles: {
                start: {
                    highlight: true,
                    active: true,
                }
            }
        },
        freehand: false,
        modifying: false,
        currentHandle: 0,
        currentTool: -1
    };

    ///////// BEGIN ACTIVE TOOL ///////
    function addPoint(eventData) {
        var toolData = cornerstoneTools.getToolState(eventData.element, toolType);
        if (toolData === undefined) {
            return;
        }

        var config = cornerstoneTools.freehand.getConfiguration();

        // Get the toolData from the last-drawn drawing
        // (this should change when modification is added)
        var data = toolData.data[config.currentTool];

        var handleData = {
            x: eventData.currentPoints.image.x,
            y: eventData.currentPoints.image.y,
            highlight: true,
            active: true,
            lines: []
        };

        // If this is not the first handle
        if (data.handles.length){
            // Add the line from the current handle to the new handle
            data.handles[config.currentHandle - 1].lines.push(eventData.currentPoints.image);
        }

        // Add the new handle
        data.handles.push(handleData);

        // Increment the current handle value
        config.currentHandle += 1;

        // Reset freehand value
        config.freehand = false;

        // Force onImageRendered to fire
        cornerstone.updateImage(eventData.element);
    }

    function pointNearHandle(eventData, toolIndex) {
        var toolData = cornerstoneTools.getToolState(eventData.element, toolType);
        if (toolData === undefined) {
            return;
        }

        var data = toolData.data[toolIndex];
        if (data.handles === undefined) {
            return;
        }

        var mousePoint = eventData.currentPoints.canvas;
        for (var i = 0; i < data.handles.length; i++) {
            var handleCanvas = cornerstone.pixelToCanvas(eventData.element, data.handles[i]);
            if (cornerstoneMath.point.distance(handleCanvas, mousePoint) < 5) {
                return i;
            }
        }

        return;
    }

    function pointNearHandleAllTools(eventData) {
        var toolData = cornerstoneTools.getToolState(eventData.element, toolType);
        if (!toolData) {
            return;
        }

        var handleNearby;
        for (var toolIndex = 0; toolIndex < toolData.data.length; toolIndex++) {
            handleNearby = pointNearHandle(eventData, toolIndex);
            if (handleNearby !== undefined) {
                return {
                    handleNearby: handleNearby,
                    toolIndex: toolIndex
                };
            }
        }
    }

    // --- Drawing loop ---
    // On first click, add point
    // After first click, on mouse move, record location
    // If mouse comes close to previous point, snap to it
    // On next click, add another point -- continuously
    // On each click, if it intersects with a current point, end drawing loop

    function mouseUpCallback(e, eventData) {
        $(eventData.element).off('CornerstoneToolsMouseUp', mouseUpCallback);

        // Check if drawing is finished
        var toolData = cornerstoneTools.getToolState(eventData.element, toolType);
        if (toolData === undefined) {
            return;
        }

        var config = cornerstoneTools.freehand.getConfiguration();

        if (!eventData.event.shiftKey) {
            config.freehand = false;
        }

        cornerstone.updateImage(eventData.element);
    }

    function mouseMoveCallback(e, eventData) {
        var toolData = cornerstoneTools.getToolState(eventData.element, toolType);
        if (!toolData) {
            return;
        }

        var config = cornerstoneTools.freehand.getConfiguration();

        var data = toolData.data[config.currentTool];

        // Set the mouseLocation handle
        config.mouseLocation.handles.start.x = eventData.currentPoints.image.x;
        config.mouseLocation.handles.start.y = eventData.currentPoints.image.y;

        var currentHandle = config.currentHandle;

        if (config.modifying) {
            // Move the handle
            data.active = true;
            data.highlight = true;
            data.handles[currentHandle].x = config.mouseLocation.handles.start.x;
            data.handles[currentHandle].y = config.mouseLocation.handles.start.y;
            if (currentHandle) {
                var lastLineIndex = data.handles[currentHandle - 1].lines.length - 1;
                var lastLine = data.handles[currentHandle - 1].lines[lastLineIndex];
                lastLine.x = config.mouseLocation.handles.start.x;
                lastLine.y = config.mouseLocation.handles.start.y;
            }
        }

        if (config.freehand) {
            data.handles[currentHandle - 1].lines.push(eventData.currentPoints.image);
        } else {
            // No snapping in freehand mode
            var handleNearby = pointNearHandle(eventData, config.currentTool);

            // If there is a handle nearby to snap to
            // (and it's not the actual mouse handle)
            if (handleNearby !== undefined && handleNearby < (data.handles.length - 1)) {
                config.mouseLocation.handles.start.x = data.handles[handleNearby].x;
                config.mouseLocation.handles.start.y = data.handles[handleNearby].y;
            }
        }

        // Force onImageRendered
        cornerstone.updateImage(eventData.element);
    }

    function startDrawing(eventData) {
        $(eventData.element).on('CornerstoneToolsMouseMove', mouseMoveCallback);
        $(eventData.element).on('CornerstoneToolsMouseUp', mouseUpCallback);

        var measurementData = {
            visible: true,
            active: true,
            handles: []
        };

        var config = cornerstoneTools.freehand.getConfiguration();
        config.mouseLocation.handles.start.x = eventData.currentPoints.image.x;
        config.mouseLocation.handles.start.y = eventData.currentPoints.image.y;

        cornerstoneTools.addToolState(eventData.element, toolType, measurementData);

        var toolData = cornerstoneTools.getToolState(eventData.element, toolType);
        config.currentTool = toolData.data.length - 1;
    }

    function endDrawing(eventData, handleNearby) {
        var toolData = cornerstoneTools.getToolState(eventData.element, toolType);
        if (!toolData) {
            return;
        }

        var config = cornerstoneTools.freehand.getConfiguration();

        var data = toolData.data[config.currentTool];

        data.active = false;
        data.highlight = false;

        // Connect the end of the drawing to the handle nearest to the click
        if (handleNearby !== undefined){
            data.handles[config.currentHandle - 1].lines.push(data.handles[handleNearby]);
        }

        if (config.modifying) {
            config.modifying = false;
        }

        // Reset the current handle
        config.currentHandle = 0;
        config.currentTool = -1;

        $(eventData.element).off('CornerstoneToolsMouseMove', mouseMoveCallback);

        cornerstone.updateImage(eventData.element);
    }

    function mouseDownCallback(e, eventData) {
        if (cornerstoneTools.isMouseButtonEnabled(eventData.which, e.data.mouseButtonMask)) {
            var toolData = cornerstoneTools.getToolState(eventData.element, toolType);

            var handleNearby, toolIndex;

            var config = cornerstoneTools.freehand.getConfiguration();
            var currentTool = config.currentTool;

            if (config.modifying) {
                endDrawing(eventData);
                return;
            }

            if (currentTool < 0) {
                var nearby = pointNearHandleAllTools(eventData);
                if (nearby) {
                    handleNearby = nearby.handleNearby;
                    toolIndex = nearby.toolIndex;
                    // This means the user is trying to modify a point
                    if (handleNearby !== undefined) {
                        $(eventData.element).on('CornerstoneToolsMouseMove', mouseMoveCallback);
                        $(eventData.element).on('CornerstoneToolsMouseUp', mouseUpCallback);
                        config.modifying = true;
                        config.currentHandle = handleNearby;
                        config.currentTool = toolIndex;
                    }
                } else {
                    startDrawing(eventData);
                    addPoint(eventData);
                }
            } else if (currentTool >= 0 && toolData.data[currentTool].active) {
                handleNearby = pointNearHandle(eventData, currentTool);
                if (handleNearby !== undefined) {
                    endDrawing(eventData, handleNearby);
                } else if (eventData.event.shiftKey) {
                    config.freehand = true;
                } else {
                    addPoint(eventData);
                }
            }

            return false; // false = causes jquery to preventDefault() and stopPropagation() this event
        }
    }

    ///////// END ACTIVE TOOL ///////

    ///////// BEGIN IMAGE RENDERING ///////
    function onImageRendered(e, eventData) {
        // if we have no toolData for this element, return immediately as there is nothing to do
        var toolData = cornerstoneTools.getToolState(e.currentTarget, toolType);
        if (toolData === undefined) {
            return;
        }

        var config = cornerstoneTools.freehand.getConfiguration();

        // we have tool data for this element - iterate over each one and draw it
        var context = eventData.canvasContext.canvas.getContext('2d');
        context.setTransform(1, 0, 0, 1, 0, 0);

        var color;
        var lineWidth = cornerstoneTools.toolStyle.getToolWidth();
        var fillColor = cornerstoneTools.toolColors.getFillColor();

        for (var i = 0; i < toolData.data.length; i++) {
            context.save();

            var data = toolData.data[i];

            if (data.active) {
                color = cornerstoneTools.toolColors.getActiveColor();
                fillColor = cornerstoneTools.toolColors.getFillColor();
            } else {
                color = cornerstoneTools.toolColors.getToolColor();
                fillColor = cornerstoneTools.toolColors.getToolColor();
            }

            var handleStart;

            if (data.handles.length) {
                for (var j = 0; j < data.handles.length; j++) {
                    // Draw a line between handle j and j+1
                    handleStart = data.handles[j];
                    var handleStartCanvas = cornerstone.pixelToCanvas(eventData.element, handleStart);

                    context.beginPath();
                    context.strokeStyle = color;
                    context.lineWidth = lineWidth;
                    context.moveTo(handleStartCanvas.x, handleStartCanvas.y);

                    for (var k = 0; k < data.handles[j].lines.length; k++) {
                        var lineCanvas = cornerstone.pixelToCanvas(eventData.element, data.handles[j].lines[k]);
                        context.lineTo(lineCanvas.x, lineCanvas.y);
                        context.stroke();
                    }

                    var mouseLocationCanvas = cornerstone.pixelToCanvas(eventData.element, config.mouseLocation.handles.start);
                    if (j === (data.handles.length - 1)) {
                        if (data.active && !config.freehand && !config.modifying) {
                            // If it's still being actively drawn, keep the last line to 
                            // the mouse location
                            context.lineTo(mouseLocationCanvas.x, mouseLocationCanvas.y);
                            context.stroke();
                        }
                    }
                }
            }
            
            // If the tool is active, draw a handle at the cursor location
            if (data.active){
                cornerstoneTools.drawHandles(context, eventData, config.mouseLocation.handles, color, fillColor);
            }
            // draw the handles
            cornerstoneTools.drawHandles(context, eventData, data.handles, color, fillColor);

            context.restore();
        }
    }
    ///////// END IMAGE RENDERING ///////
    function enable(element) {
        $(element).off('CornerstoneToolsMouseDown', mouseDownCallback);
        $(element).off('CornerstoneToolsMouseUp', mouseUpCallback);
        $(element).off('CornerstoneToolsMouseMove', mouseMoveCallback);
        $(element).off('CornerstoneImageRendered', onImageRendered);

        $(element).on('CornerstoneImageRendered', onImageRendered);
        cornerstone.updateImage(element);
    }

    // disables the reference line tool for the given element
    function disable(element) {
        $(element).off('CornerstoneToolsMouseDown', mouseDownCallback);
        $(element).off('CornerstoneToolsMouseUp', mouseUpCallback);
        $(element).off('CornerstoneToolsMouseMove', mouseMoveCallback);
        $(element).off('CornerstoneImageRendered', onImageRendered);
        cornerstone.updateImage(element);
    }

    // visible and interactive
    function activate(element, mouseButtonMask) {
        var eventData = {
            mouseButtonMask: mouseButtonMask,
        };

        $(element).off('CornerstoneToolsMouseDown', eventData, mouseDownCallback);
        $(element).off('CornerstoneToolsMouseUp', mouseUpCallback);
        $(element).off('CornerstoneToolsMouseMove', mouseMoveCallback);
        $(element).off('CornerstoneImageRendered', onImageRendered);

        $(element).on('CornerstoneImageRendered', onImageRendered);
        $(element).on('CornerstoneToolsMouseDown', eventData, mouseDownCallback);

        cornerstone.updateImage(element);
    }

    // visible, but not interactive
    function deactivate(element) {
        $(element).off('CornerstoneToolsMouseDown', mouseDownCallback);
        $(element).off('CornerstoneToolsMouseUp', mouseUpCallback);
        $(element).off('CornerstoneToolsMouseMove', mouseMoveCallback);
        $(element).off('CornerstoneImageRendered', onImageRendered);

        $(element).on('CornerstoneImageRendered', onImageRendered);

        cornerstone.updateImage(element);
    }

    function getConfiguration() {
        return configuration;
    }

    function setConfiguration(config) {
        configuration = config;
    }

    // module/private exports
    cornerstoneTools.freehand = {
        enable: enable,
        disable: disable,
        activate: activate,
        deactivate: deactivate,
        getConfiguration: getConfiguration,
        setConfiguration: setConfiguration
    };

})($, cornerstone, cornerstoneMath, cornerstoneTools);
 
// End Source; src/imageTools/freehand.js

// Begin Source: src/imageTools/highlight.js
(function($, cornerstone, cornerstoneMath, cornerstoneTools) {

    'use strict';

    var toolType = 'highlight';

    ///////// BEGIN ACTIVE TOOL ///////
    function createNewMeasurement(mouseEventData) {
        //if already a highlight measurement, creating a new one will be useless
        var existingToolData = cornerstoneTools.getToolState(mouseEventData.event.currentTarget, toolType);
        if (existingToolData && existingToolData.data && existingToolData.data.length > 0) {
            return;
        }
    
        // create the measurement data for this tool with the end handle activated
        var measurementData = {
            visible: true,
            active: true,
            handles: {
                start: {
                    x: mouseEventData.currentPoints.image.x,
                    y: mouseEventData.currentPoints.image.y,
                    highlight: true,
                    active: false
                },
                end: {
                    x: mouseEventData.currentPoints.image.x,
                    y: mouseEventData.currentPoints.image.y,
                    highlight: true,
                    active: true
                }
            }
        };

        return measurementData;
    }
    ///////// END ACTIVE TOOL ///////

    function pointInsideRect(element, data, coords) {
        var startCanvas = cornerstone.pixelToCanvas(element, data.handles.start);
        var endCanvas = cornerstone.pixelToCanvas(element, data.handles.end);

        var rect = {
            left: Math.min(startCanvas.x, endCanvas.x),
            top: Math.min(startCanvas.y, endCanvas.y),
            width: Math.abs(startCanvas.x - endCanvas.x),
            height: Math.abs(startCanvas.y - endCanvas.y)
        };

        var insideBox = false;
        if ((coords.x >= rect.left && coords.x <= (rect.left + rect.width)) && coords.y >= rect.top && coords.y <= (rect.top + rect.height)) {
            insideBox = true;
        }

        return insideBox;
    }

    function pointNearTool(element, data, coords) {
        var startCanvas = cornerstone.pixelToCanvas(element, data.handles.start);
        var endCanvas = cornerstone.pixelToCanvas(element, data.handles.end);

        var rect = {
            left: Math.min(startCanvas.x, endCanvas.x),
            top: Math.min(startCanvas.y, endCanvas.y),
            width: Math.abs(startCanvas.x - endCanvas.x),
            height: Math.abs(startCanvas.y - endCanvas.y)
        };

        var distanceToPoint = cornerstoneMath.rect.distanceToPoint(rect, coords);
        return (distanceToPoint < 5);
    }

    ///////// BEGIN IMAGE RENDERING ///////

    function onImageRendered(e, eventData) {

        // if we have no toolData for this element, return immediately as there is nothing to do
        var toolData = cornerstoneTools.getToolState(e.currentTarget, toolType);
        if (toolData === undefined) {
            return;
        }

        // we have tool data for this elemen
        var context = eventData.canvasContext.canvas.getContext('2d');
        context.setTransform(1, 0, 0, 1, 0, 0);

        var color;
        var lineWidth = cornerstoneTools.toolStyle.getToolWidth();

        context.save();

        var data = toolData.data[0];

        if (!data) {
            return;
        }

        if (data.active) {
            color = cornerstoneTools.toolColors.getActiveColor();
        } else {
            color = cornerstoneTools.toolColors.getToolColor();
        }

        var handleStartCanvas = cornerstone.pixelToCanvas(eventData.element, data.handles.start);
        var handleEndCanvas = cornerstone.pixelToCanvas(eventData.element, data.handles.end);

        var rect = {
            left: Math.min(handleStartCanvas.x, handleEndCanvas.x),
            top: Math.min(handleStartCanvas.y, handleEndCanvas.y),
            width: Math.abs(handleStartCanvas.x - handleEndCanvas.x),
            height: Math.abs(handleStartCanvas.y - handleEndCanvas.y)
        };

        // draw dark fill outside the rectangle
        context.beginPath();
        context.strokeStyle = 'transparent';

        context.rect(0, 0, context.canvas.clientWidth, context.canvas.clientHeight);

        context.rect(rect.width + rect.left, rect.top, -rect.width, rect.height);
        context.stroke();
        context.fillStyle = 'rgba(0,0,0,0.7)';
        context.fill();
        context.closePath();

        // draw dashed stroke rectangle
        context.beginPath();
        context.strokeStyle = color;
        context.lineWidth = lineWidth;
        context.setLineDash([ 4 ]);
        context.strokeRect(rect.left, rect.top, rect.width, rect.height);

        // Strange fix, but restore doesn't seem to reset the line dashes?
        context.setLineDash([]);
        
        // draw the handles last, so they will be on top of the overlay
        cornerstoneTools.drawHandles(context, eventData, data.handles, color);
        context.restore();
    }
    ///////// END IMAGE RENDERING ///////

    // module exports
    var preventHandleOutsideImage = true;

    cornerstoneTools.highlight = cornerstoneTools.mouseButtonRectangleTool({
        createNewMeasurement: createNewMeasurement,
        onImageRendered: onImageRendered,
        pointNearTool: pointNearTool,
        pointInsideRect: pointInsideRect,
        toolType: toolType
    }, preventHandleOutsideImage);
    
    cornerstoneTools.highlightTouch = cornerstoneTools.touchTool({
        createNewMeasurement: createNewMeasurement,
        onImageRendered: onImageRendered,
        pointNearTool: pointNearTool,
        pointInsideRect: pointInsideRect,
        toolType: toolType
    }, preventHandleOutsideImage);

})($, cornerstone, cornerstoneMath, cornerstoneTools);
 
// End Source; src/imageTools/highlight.js

// Begin Source: src/imageTools/keyboardTool.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    function keyboardTool(keyDownCallback) {
        var configuration = {};

        var toolInterface = {
            activate: function(element) {
                $(element).off('CornerstoneToolsKeyDown', keyDownCallback);
                $(element).on('CornerstoneToolsKeyDown', keyDownCallback);
            },
            disable: function(element) {$(element).off('CornerstoneToolsKeyDown', keyDownCallback);},
            enable: function(element) {$(element).off('CornerstoneToolsKeyDown', keyDownCallback);},
            deactivate: function(element) {$(element).off('CornerstoneToolsKeyDown', keyDownCallback);},
            getConfiguration: function() { return configuration; },
            setConfiguration: function(config) {configuration = config;}
        };
        return toolInterface;
    }

    // module exports
    cornerstoneTools.keyboardTool = keyboardTool;

})($, cornerstone, cornerstoneTools);
 
// End Source; src/imageTools/keyboardTool.js

// Begin Source: src/imageTools/lengthTool.js
(function($, cornerstone, cornerstoneMath, cornerstoneTools) {

    'use strict';

    var toolType = 'length';

    ///////// BEGIN ACTIVE TOOL ///////
    function createNewMeasurement(mouseEventData) {
        // create the measurement data for this tool with the end handle activated
        var measurementData = {
            visible: true,
            active: true,
            handles: {
                start: {
                    x: mouseEventData.currentPoints.image.x,
                    y: mouseEventData.currentPoints.image.y,
                    highlight: true,
                    active: false
                },
                end: {
                    x: mouseEventData.currentPoints.image.x,
                    y: mouseEventData.currentPoints.image.y,
                    highlight: true,
                    active: true
                }
            }
        };

        return measurementData;
    }
    ///////// END ACTIVE TOOL ///////

    function pointNearTool(element, data, coords) {
        var lineSegment = {
            start: cornerstone.pixelToCanvas(element, data.handles.start),
            end: cornerstone.pixelToCanvas(element, data.handles.end)
        };
        var distanceToPoint = cornerstoneMath.lineSegment.distanceToPoint(lineSegment, coords);
        return (distanceToPoint < 25);
    }

    ///////// BEGIN IMAGE RENDERING ///////
    function onImageRendered(e, eventData) {

        // if we have no toolData for this element, return immediately as there is nothing to do
        var toolData = cornerstoneTools.getToolState(e.currentTarget, toolType);
        if (toolData === undefined) {
            return;
        }

        // we have tool data for this element - iterate over each one and draw it
        var context = eventData.canvasContext.canvas.getContext('2d');
        context.setTransform(1, 0, 0, 1, 0, 0);

        var color;
        var lineWidth = cornerstoneTools.toolStyle.getToolWidth();
        var font = cornerstoneTools.textStyle.getFont();
        var config = cornerstoneTools.length.getConfiguration();

        for (var i = 0; i < toolData.data.length; i++) {
            context.save();
            
            // configurable shadow
            if (config && config.shadow) {
                context.shadowColor = config.shadowColor || '#000000';
                context.shadowOffsetX = config.shadowOffsetX || 1;
                context.shadowOffsetY = config.shadowOffsetY || 1;
            }
            
            var data = toolData.data[i];

            if (data.active) {
                color = cornerstoneTools.toolColors.getActiveColor();
            } else {
                color = cornerstoneTools.toolColors.getToolColor();
            }

            // draw the line
            var handleStartCanvas = cornerstone.pixelToCanvas(eventData.element, data.handles.start);
            var handleEndCanvas = cornerstone.pixelToCanvas(eventData.element, data.handles.end);

            context.beginPath();
            context.strokeStyle = color;
            context.lineWidth = lineWidth;
            context.moveTo(handleStartCanvas.x, handleStartCanvas.y);
            context.lineTo(handleEndCanvas.x, handleEndCanvas.y);
            context.stroke();

            // draw the handles
            cornerstoneTools.drawHandles(context, eventData, data.handles, color);

            // Draw the text
            context.fillStyle = color;
            context.font = font;

            var suffix = ' mm';
            if (!eventData.image.rowPixelSpacing || !eventData.image.columnPixelSpacing) {
                suffix = ' pixels';
            }

            var vector = {
                x: handleStartCanvas.x - handleEndCanvas.x,
                y: handleStartCanvas.y - handleEndCanvas.y,
            };

            var midpoint = {
                x: (handleStartCanvas.x + handleEndCanvas.x) / 2,
                y: (handleStartCanvas.y + handleEndCanvas.y) / 2
            };

            var magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);

            var normal = {
                x: -vector.y / magnitude,
                y: vector.x / magnitude
            };

            // Set rowPixelSpacing and columnPixelSpacing to 1 if they are undefined (or zero)
            var dx = (data.handles.end.x - data.handles.start.x) * (eventData.image.columnPixelSpacing || 1);
            var dy = (data.handles.end.y - data.handles.start.y) * (eventData.image.rowPixelSpacing || 1);
            
            var length = Math.sqrt(dx * dx + dy * dy);
            var text = '' + length.toFixed(2) + suffix;

            var fontSize = cornerstoneTools.textStyle.getFontSize();
            var textWidth = context.measureText(text).width;

            var distance = {
                x: Math.min(10, textWidth / 2),
                y: Math.min(25, fontSize),
            };

            if (handleEndCanvas.y < handleStartCanvas.y) {
                distance.x = -distance.x;
                distance.y = -distance.y;
            }
        
            var textCoords = {
                x: midpoint.x + normal.x * distance.x,
                y: midpoint.y + normal.y * distance.y
            };

            cornerstoneTools.drawTextBox(context, text, textCoords.x, textCoords.y, color);
            context.restore();
        }
    }
    ///////// END IMAGE RENDERING ///////

    // module exports
    cornerstoneTools.length = cornerstoneTools.mouseButtonTool({
        createNewMeasurement: createNewMeasurement,
        onImageRendered: onImageRendered,
        pointNearTool: pointNearTool,
        toolType: toolType
    });
    cornerstoneTools.lengthTouch = cornerstoneTools.touchTool({
        createNewMeasurement: createNewMeasurement,
        onImageRendered: onImageRendered,
        pointNearTool: pointNearTool,
        toolType: toolType
    });

})($, cornerstone, cornerstoneMath, cornerstoneTools);
 
// End Source; src/imageTools/lengthTool.js

// Begin Source: src/imageTools/magnify.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    var configuration = {
        magnifySize: 100,
        magnificationLevel: 2,
    };

    var browserName;

    /** Remove the magnifying glass when the mouse event ends */
    function mouseUpCallback(e, eventData) {
        $(eventData.element).off('CornerstoneToolsMouseDrag', dragCallback);
        $(eventData.element).off('CornerstoneToolsMouseUp', mouseUpCallback);
        hideTool(eventData);
    }

    function hideTool(eventData) {
        $(eventData.element).find('.magnifyTool').hide();
        // Re-enable the mouse cursor
        document.body.style.cursor = 'default';
    }

    /** Draw the magnifying glass on mouseDown, and begin tracking mouse movements */
    function mouseDownCallback(e, eventData) {
        if (cornerstoneTools.isMouseButtonEnabled(eventData.which, e.data.mouseButtonMask)) {
            $(eventData.element).on('CornerstoneToolsMouseDrag', eventData, dragCallback);
            $(eventData.element).on('CornerstoneToolsMouseUp', eventData, mouseUpCallback);
            drawMagnificationTool(eventData);
            return false; // false = causes jquery to preventDefault() and stopPropagation() this event
        }
    }

    function dragEndCallback(e, eventData) {
        $(eventData.element).off('CornerstoneToolsDragEnd', dragEndCallback);
        $(eventData.element).off('CornerstoneToolsTouchEnd', dragEndCallback);
        hideTool(eventData);
    }

    /** Drag callback is triggered by both the touch and mouse magnify tools */
    function dragCallback(e, eventData) {
        drawMagnificationTool(eventData);
        if (eventData.isTouchEvent === true) {
            $(eventData.element).on('CornerstoneToolsDragEnd', dragEndCallback);
            $(eventData.element).on('CornerstoneToolsTouchEnd', dragEndCallback);
        }

        return false; // false = causes jquery to preventDefault() and stopPropagation() this event
    }

    /** Draws the magnifying glass */
    function drawMagnificationTool(eventData) {
        var magnify = $(eventData.element).find('.magnifyTool').get(0);

        if (!magnify) {
            createMagnificationCanvas(eventData.element);
        }

        var config = cornerstoneTools.magnify.getConfiguration();

        var magnifySize = config.magnifySize;
        var magnificationLevel = config.magnificationLevel;

        // The 'not' magnifyTool class here is necessary because cornerstone places
        // no classes of it's own on the canvas we want to select
        var canvas = $(eventData.element).find('canvas').not('.magnifyTool').get(0);
        var context = canvas.getContext('2d');
        context.setTransform(1, 0, 0, 1, 0, 0);

        var zoomCtx = magnify.getContext('2d');
        zoomCtx.setTransform(1, 0, 0, 1, 0, 0);

        var getSize = magnifySize / magnificationLevel;

        // Calculate the on-canvas location of the mouse pointer / touch
        var canvasLocation = cornerstone.pixelToCanvas(eventData.element, eventData.currentPoints.image);

        if (eventData.isTouchEvent === true) {
            canvasLocation.y -= 1.25 * getSize;
        }

        canvasLocation.x = Math.max(canvasLocation.x, 0);
        canvasLocation.x = Math.min(canvasLocation.x, canvas.width);

        canvasLocation.y = Math.max(canvasLocation.y, 0);
        canvasLocation.y = Math.min(canvasLocation.y, canvas.height);

        // Clear the rectangle
        zoomCtx.clearRect(0, 0, magnifySize, magnifySize);
        zoomCtx.fillStyle = 'transparent';

        // Fill it with the pixels that the mouse is clicking on
        zoomCtx.fillRect(0, 0, magnifySize, magnifySize);
        
        var copyFrom = {
            x: canvasLocation.x - 0.5 * getSize,
            y: canvasLocation.y - 0.5 * getSize
        };

        if (browserName === 'Safari') {
            // Safari breaks when trying to copy pixels with negative indices
            // This prevents proper Magnify usage
            copyFrom.x = Math.max(copyFrom.x, 0);
            copyFrom.y = Math.max(copyFrom.y, 0);
        }

        copyFrom.x = Math.min(copyFrom.x, canvas.width);
        copyFrom.y = Math.min(copyFrom.y, canvas.height);

        var scaledMagnify = {
            x: (canvas.width - copyFrom.x) * magnificationLevel,
            y: (canvas.height - copyFrom.y) * magnificationLevel
        };
        zoomCtx.drawImage(canvas, copyFrom.x, copyFrom.y, canvas.width - copyFrom.x, canvas.height - copyFrom.y, 0, 0, scaledMagnify.x, scaledMagnify.y);

        // Place the magnification tool at the same location as the pointer
        magnify.style.top = canvasLocation.y - 0.5 * magnifySize + 'px';
        magnify.style.left = canvasLocation.x - 0.5 * magnifySize + 'px';

        magnify.style.display = 'block';

        // Hide the mouse cursor, so the user can see better
        document.body.style.cursor = 'none';
    }

    /** Creates the magnifying glass canvas */
    function createMagnificationCanvas(element) {
        // If the magnifying glass canvas doesn't already exist
        if ($(element).find('.magnifyTool').length === 0) {
            // Create a canvas and append it as a child to the element
            var magnify = document.createElement('canvas');
            // The magnifyTool class is used to find the canvas later on
            magnify.classList.add('magnifyTool');

            var config = cornerstoneTools.magnify.getConfiguration();
            magnify.width = config.magnifySize;
            magnify.height = config.magnifySize;

            // Make sure position is absolute so the canvas can follow the mouse / touch
            magnify.style.position = 'absolute';
            element.appendChild(magnify);
        }
    }

    /** Find the magnifying glass canvas and remove it */
    function removeMagnificationCanvas(element) {
        $(element).find('.magnifyTool').remove();
    }

    // --- Mouse tool activate / disable --- //
    function disable(element) {
        $(element).off('CornerstoneToolsMouseDown', mouseDownCallback);
        removeMagnificationCanvas(element);
    }

    function enable(element) {
        var config = cornerstoneTools.magnify.getConfiguration(config);

        if (!browserName) {
            var infoString = cornerstoneTools.getBrowserInfo();
            var info = infoString.split(' ');
            browserName = info[0];
        }

        createMagnificationCanvas(element);
    }

    function activate(element, mouseButtonMask) {
        var eventData = {
            mouseButtonMask: mouseButtonMask,
        };

        $(element).off('CornerstoneToolsMouseDown', mouseDownCallback);

        $(element).on('CornerstoneToolsMouseDown', eventData, mouseDownCallback);
        createMagnificationCanvas(element);
    }

    // --- Touch tool activate / disable --- //
    function getConfiguration() {
        return configuration;
    }

    function setConfiguration(config) {
        configuration = config;
    }

    // module exports
    cornerstoneTools.magnify = {
        enable: enable,
        activate: activate,
        deactivate: disable,
        disable: disable,
        getConfiguration: getConfiguration,
        setConfiguration: setConfiguration
    };

    var options = {
        fireOnTouchStart: true,
        activateCallback: createMagnificationCanvas,
        disableCallback: removeMagnificationCanvas
    };
    cornerstoneTools.magnifyTouchDrag = cornerstoneTools.touchDragTool(dragCallback, options);

})($, cornerstone, cornerstoneTools);
 
// End Source; src/imageTools/magnify.js

// Begin Source: src/imageTools/multiTouchDragTool.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    function multiTouchDragTool(touchDragCallback) {
        var configuration = {};
        var events = 'CornerstoneToolsMultiTouchDrag';
        
        var toolInterface = {
            activate: function(element) {
                $(element).off(events, touchDragCallback);
                $(element).on(events, touchDragCallback);
            },
            disable: function(element) {
                $(element).off(events, touchDragCallback);
            },
            enable: function(element) {
                $(element).off(events, touchDragCallback);
            },
            deactivate: function(element) {
                $(element).off(events, touchDragCallback);
            },
            getConfiguration: function() {
                return configuration;
            },
            setConfiguration: function(config) {
                configuration = config;
            }
        };
        return toolInterface;
    }

    // module exports
    cornerstoneTools.multiTouchDragTool = multiTouchDragTool;

})($, cornerstone, cornerstoneTools);
 
// End Source; src/imageTools/multiTouchDragTool.js

// Begin Source: src/imageTools/orientationMarkers.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    function getOrientationMarkers(element) {
        var enabledElement = cornerstone.getEnabledElement(element);
        var imagePlaneMetaData = cornerstoneTools.metaData.get('imagePlane', enabledElement.image.imageId);

        if (!imagePlaneMetaData || !imagePlaneMetaData.rowCosines || !imagePlaneMetaData.columnCosines) {
            return;
        }

        var rowString = cornerstoneTools.orientation.getOrientationString(imagePlaneMetaData.rowCosines);
        var columnString = cornerstoneTools.orientation.getOrientationString(imagePlaneMetaData.columnCosines);

        var oppositeRowString = cornerstoneTools.orientation.invertOrientationString(rowString);
        var oppositeColumnString = cornerstoneTools.orientation.invertOrientationString(columnString);

        return {
            top: oppositeColumnString,
            bottom: columnString,
            left: oppositeRowString,
            right: rowString
        };
    }

    function getOrientationMarkerPositions(element) {
        var enabledElement = cornerstone.getEnabledElement(element);
        var coords;

        coords = {
            x: enabledElement.image.width / 2,
            y: 5
        };
        var topCoords = cornerstone.pixelToCanvas(element, coords);

        coords = {
            x: enabledElement.image.width / 2,
            y: enabledElement.image.height - 5
        };
        var bottomCoords = cornerstone.pixelToCanvas(element, coords);

        coords = {
            x: 5,
            y: enabledElement.image.height / 2
        };
        var leftCoords = cornerstone.pixelToCanvas(element, coords);

        coords = {
            x: enabledElement.image.width - 10,
            y: enabledElement.image.height / 2
        };
        var rightCoords = cornerstone.pixelToCanvas(element, coords);

        return {
            top: topCoords,
            bottom: bottomCoords,
            left: leftCoords,
            right: rightCoords
        };
    }

    function onImageRendered(e, eventData) {
        var element = eventData.element;

        var markers = getOrientationMarkers(element);

        if (!markers) {
            return;
        }

        var coords = getOrientationMarkerPositions(element, markers);

        var context = eventData.canvasContext.canvas.getContext('2d');
        context.setTransform(1, 0, 0, 1, 0, 0);

        var color = cornerstoneTools.toolColors.getToolColor();

        var textWidths = {
            top: context.measureText(markers.top).width,
            left: context.measureText(markers.left).width,
            right: context.measureText(markers.right).width,
            bottom: context.measureText(markers.bottom).width
        };

        cornerstoneTools.drawTextBox(context, markers.top, coords.top.x - textWidths.top / 2, coords.top.y, color);
        cornerstoneTools.drawTextBox(context, markers.left, coords.left.x - textWidths.left / 2, coords.left.y, color);

        var config = cornerstoneTools.orientationMarkers.getConfiguration();
        if (config && config.drawAllMarkers) {
            cornerstoneTools.drawTextBox(context, markers.right, coords.right.x - textWidths.right / 2, coords.right.y, color);
            cornerstoneTools.drawTextBox(context, markers.bottom, coords.bottom.x - textWidths.bottom / 2, coords.bottom.y, color);
        }
    }
    ///////// END IMAGE RENDERING ///////

    // module exports
    cornerstoneTools.orientationMarkers = cornerstoneTools.displayTool(onImageRendered);

})($, cornerstone, cornerstoneTools);
 
// End Source; src/imageTools/orientationMarkers.js

// Begin Source: src/imageTools/pan.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    function mouseUpCallback(e, eventData) {
        $(eventData.element).off('CornerstoneToolsMouseDrag', dragCallback);
        $(eventData.element).off('CornerstoneToolsMouseUp', mouseUpCallback);
    }

    function mouseDownCallback(e, eventData) {
        if (cornerstoneTools.isMouseButtonEnabled(eventData.which, e.data.mouseButtonMask)) {
            $(eventData.element).on('CornerstoneToolsMouseDrag', dragCallback);
            $(eventData.element).on('CornerstoneToolsMouseUp', mouseUpCallback);
            return false; // false = causes jquery to preventDefault() and stopPropagation() this event
        }
    }
    
    function dragCallback(e, eventData) {
        eventData.viewport.translation.x += (eventData.deltaPoints.page.x / eventData.viewport.scale);
        eventData.viewport.translation.y += (eventData.deltaPoints.page.y / eventData.viewport.scale);
        cornerstone.setViewport(eventData.element, eventData.viewport);
        return false; // false = causes jquery to preventDefault() and stopPropagation() this event
    }

    cornerstoneTools.pan = cornerstoneTools.simpleMouseButtonTool(mouseDownCallback);
    cornerstoneTools.panTouchDrag = cornerstoneTools.touchDragTool(dragCallback);

})($, cornerstone, cornerstoneTools);
 
// End Source; src/imageTools/pan.js

// Begin Source: src/imageTools/panMultiTouch.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    function touchPanCallback(e, eventData) {
        var config = cornerstoneTools.panMultiTouch.getConfiguration();
        if (config && config.testPointers(eventData)) {
            eventData.viewport.translation.x += (eventData.deltaPoints.page.x / eventData.viewport.scale);
            eventData.viewport.translation.y += (eventData.deltaPoints.page.y / eventData.viewport.scale);
            cornerstone.setViewport(eventData.element, eventData.viewport);
            return false; // false = causes jquery to preventDefault() and stopPropagation() this event
        }
    }

    var configuration = {
        testPointers: function(eventData) {
            return (eventData.numPointers >= 2);
        }
    };

    cornerstoneTools.panMultiTouch = cornerstoneTools.multiTouchDragTool(touchPanCallback);
    cornerstoneTools.panMultiTouch.setConfiguration(configuration);

})($, cornerstone, cornerstoneTools);
 
// End Source; src/imageTools/panMultiTouch.js

// Begin Source: src/imageTools/probe.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    var toolType = 'probe';

    ///////// BEGIN ACTIVE TOOL ///////
    function createNewMeasurement(mouseEventData) {
        // create the measurement data for this tool with the end handle activated
        var measurementData = {
            visible: true,
            active: true,
            handles: {
                end: {
                    x: mouseEventData.currentPoints.image.x,
                    y: mouseEventData.currentPoints.image.y,
                    highlight: true,
                    active: true
                }
            }
        };
        return measurementData;
    }
    ///////// END ACTIVE TOOL ///////

    ///////// BEGIN IMAGE RENDERING ///////
    function pointNearTool(element, data, coords) {
        var endCanvas = cornerstone.pixelToCanvas(element, data.handles.end);
        return cornerstoneMath.point.distance(endCanvas, coords) < 5;
    }

    function onImageRendered(e, eventData) {
        // if we have no toolData for this element, return immediately as there is nothing to do
        var toolData = cornerstoneTools.getToolState(e.currentTarget, toolType);
        if (!toolData) {
            return;
        }

        // we have tool data for this element - iterate over each one and draw it
        var context = eventData.canvasContext.canvas.getContext('2d');
        context.setTransform(1, 0, 0, 1, 0, 0);

        var color;
        var font = cornerstoneTools.textStyle.getFont();
        var fontHeight = cornerstoneTools.textStyle.getFontSize();

        for (var i = 0; i < toolData.data.length; i++) {

            context.save();
            var data = toolData.data[i];
            
            if (data.active) {
                color = cornerstoneTools.toolColors.getActiveColor();
            } else {
                color = cornerstoneTools.toolColors.getToolColor();
            }

            // draw the handles
            cornerstoneTools.drawHandles(context, eventData, data.handles, color);

            var x = Math.round(data.handles.end.x);
            var y = Math.round(data.handles.end.y);
            var storedPixels;

            var text,
                str;

            if (x < 0 || y < 0 || x >= eventData.image.columns || y >= eventData.image.rows) {
                return;
            }

            if (eventData.image.color) {
                text = '' + x + ', ' + y;
                storedPixels = cornerstoneTools.getRGBPixels(eventData.element, x, y, 1, 1);
                str = 'R: ' + storedPixels[0] + ' G: ' + storedPixels[1] + ' B: ' + storedPixels[2];
            } else {
                storedPixels = cornerstone.getStoredPixels(eventData.element, x, y, 1, 1);
                var sp = storedPixels[0];
                var mo = sp * eventData.image.slope + eventData.image.intercept;
                var suv = cornerstoneTools.calculateSUV(eventData.image, sp);

                // Draw text
                text = '' + x + ', ' + y;
                str = 'SP: ' + sp + ' MO: ' + parseFloat(mo.toFixed(3));
                if (suv) {
                    str += ' SUV: ' + parseFloat(suv.toFixed(3));
                }
            }

            var coords = {
                // translate the x/y away from the cursor
                x: data.handles.end.x + 3,
                y: data.handles.end.y - 3
            };
            var textCoords = cornerstone.pixelToCanvas(eventData.element, coords);
            
            context.font = font;
            context.fillStyle = color;

            cornerstoneTools.drawTextBox(context, str, textCoords.x, textCoords.y + fontHeight + 5, color);
            cornerstoneTools.drawTextBox(context, text, textCoords.x, textCoords.y, color);
            context.restore();
        }
    }
    ///////// END IMAGE RENDERING ///////

    // module exports
    cornerstoneTools.probe = cornerstoneTools.mouseButtonTool({
        createNewMeasurement: createNewMeasurement,
        onImageRendered: onImageRendered,
        pointNearTool: pointNearTool,
        toolType: toolType
    });
    cornerstoneTools.probeTouch = cornerstoneTools.touchTool({
        createNewMeasurement: createNewMeasurement,
        onImageRendered: onImageRendered,
        pointNearTool: pointNearTool,
        toolType: toolType
    });

})($, cornerstone, cornerstoneTools);
 
// End Source; src/imageTools/probe.js

// Begin Source: src/imageTools/rectangleRoi.js
(function($, cornerstone, cornerstoneMath, cornerstoneTools) {

    'use strict';

    var toolType = 'rectangleRoi';

    ///////// BEGIN ACTIVE TOOL ///////
    function createNewMeasurement(mouseEventData) {
        // create the measurement data for this tool with the end handle activated
        var measurementData = {
            visible: true,
            active: true,
            handles: {
                start: {
                    x: mouseEventData.currentPoints.image.x,
                    y: mouseEventData.currentPoints.image.y,
                    highlight: true,
                    active: false
                },
                end: {
                    x: mouseEventData.currentPoints.image.x,
                    y: mouseEventData.currentPoints.image.y,
                    highlight: true,
                    active: true
                }
            }
        };

        return measurementData;
    }
    ///////// END ACTIVE TOOL ///////

    function pointNearTool(element, data, coords) {
        var startCanvas = cornerstone.pixelToCanvas(element, data.handles.start);
        var endCanvas = cornerstone.pixelToCanvas(element, data.handles.end);

        var rect = {
            left: Math.min(startCanvas.x, endCanvas.x),
            top: Math.min(startCanvas.y, endCanvas.y),
            width: Math.abs(startCanvas.x - endCanvas.x),
            height: Math.abs(startCanvas.y - endCanvas.y)
        };

        var distanceToPoint = cornerstoneMath.rect.distanceToPoint(rect, coords);
        return (distanceToPoint < 5);
    }

    ///////// BEGIN IMAGE RENDERING ///////

    function calculateMeanStdDev(sp, ellipse) {
        // TODO: Get a real statistics library here that supports large counts

        var sum = 0;
        var sumSquared = 0;
        var count = 0;
        var index = 0;

        for (var y = ellipse.top; y < ellipse.top + ellipse.height; y++) {
            for (var x = ellipse.left; x < ellipse.left + ellipse.width; x++) {
                sum += sp[index];
                sumSquared += sp[index] * sp[index];
                count++;
                index++;
            }
        }

        if (count === 0) {
            return {
                count: count,
                mean: 0.0,
                variance: 0.0,
                stdDev: 0.0
            };
        }

        var mean = sum / count;
        var variance = sumSquared / count - mean * mean;

        return {
            count: count,
            mean: mean,
            variance: variance,
            stdDev: Math.sqrt(variance)
        };
    }

    function onImageRendered(e, eventData) {

        // if we have no toolData for this element, return immediately as there is nothing to do
        var toolData = cornerstoneTools.getToolState(e.currentTarget, toolType);
        if (toolData === undefined) {
            return;
        }

        // we have tool data for this element - iterate over each one and draw it
        var context = eventData.canvasContext.canvas.getContext('2d');
        context.setTransform(1, 0, 0, 1, 0, 0);

        //activation color 
        var color;
        var lineWidth = cornerstoneTools.toolStyle.getToolWidth();
        var font = cornerstoneTools.textStyle.getFont();
        var fontHeight = cornerstoneTools.textStyle.getFontSize();
        
        for (var i = 0; i < toolData.data.length; i++) {
            context.save();

            var data = toolData.data[i];

            //differentiate the color of activation tool
            if (data.active) {
                color = cornerstoneTools.toolColors.getActiveColor();
            } else {
                color = cornerstoneTools.toolColors.getToolColor();
            }

            // draw the rectangle
            var handleStartCanvas = cornerstone.pixelToCanvas(eventData.element, data.handles.start);
            var handleEndCanvas = cornerstone.pixelToCanvas(eventData.element, data.handles.end);

            var widthCanvas = Math.abs(handleStartCanvas.x - handleEndCanvas.x);
            var heightCanvas = Math.abs(handleStartCanvas.y - handleEndCanvas.y);
            var leftCanvas = Math.min(handleStartCanvas.x, handleEndCanvas.x);
            var topCanvas = Math.min(handleStartCanvas.y, handleEndCanvas.y);
            var centerX = (handleStartCanvas.x + handleEndCanvas.x) / 2;
            var centerY = (handleStartCanvas.y + handleEndCanvas.y) / 2;

            context.beginPath();
            context.strokeStyle = color;
            context.lineWidth = lineWidth;
            context.rect(leftCanvas, topCanvas, widthCanvas, heightCanvas);
            context.stroke();

            // draw the handles
            cornerstoneTools.drawHandles(context, eventData, data.handles, color);

            // Calculate the mean, stddev, and area
            // TODO: calculate this in web worker for large pixel counts...

            var width = Math.abs(data.handles.start.x - data.handles.end.x);
            var height = Math.abs(data.handles.start.y - data.handles.end.y);
            var left = Math.min(data.handles.start.x, data.handles.end.x);
            var top = Math.min(data.handles.start.y, data.handles.end.y);
            var pixels = cornerstone.getPixels(eventData.element, left, top, width, height);

            var ellipse = {
                left: left,
                top: top,
                width: width,
                height: height
            };

            var meanStdDev = calculateMeanStdDev(pixels, ellipse);
            var area = (width * eventData.image.columnPixelSpacing) * (height * eventData.image.rowPixelSpacing);
            var areaText = 'Area: ' + area.toFixed(2) + ' mm^2';

            // Draw text
            context.font = font;

            var textSize = context.measureText(area);

            var textX = centerX < (eventData.image.columns / 2) ? centerX + (widthCanvas / 2): centerX - (widthCanvas / 2) - textSize.width;
            var textY = centerY < (eventData.image.rows / 2) ? centerY + (heightCanvas / 2): centerY - (heightCanvas / 2);

            context.fillStyle = color;
            cornerstoneTools.drawTextBox(context, 'Mean: ' + meanStdDev.mean.toFixed(2), textX, textY - fontHeight - 5, color);
            cornerstoneTools.drawTextBox(context, 'StdDev: ' + meanStdDev.stdDev.toFixed(2), textX, textY, color);
            cornerstoneTools.drawTextBox(context, areaText, textX, textY + fontHeight + 5, color);
            context.restore();
        }
    }
    ///////// END IMAGE RENDERING ///////

    // module exports
    cornerstoneTools.rectangleRoi = cornerstoneTools.mouseButtonTool({
        createNewMeasurement: createNewMeasurement,
        onImageRendered: onImageRendered,
        pointNearTool: pointNearTool,
        toolType: toolType
    });
    cornerstoneTools.rectangleRoiTouch = cornerstoneTools.touchTool({
        createNewMeasurement: createNewMeasurement,
        onImageRendered: onImageRendered,
        pointNearTool: pointNearTool,
        toolType: toolType
    });

})($, cornerstone, cornerstoneMath, cornerstoneTools);
 
// End Source; src/imageTools/rectangleRoi.js

// Begin Source: src/imageTools/rotate.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    // --- Strategies --- //
    function defaultStrategy(eventData) {
        // Calculate distance from the center of the image
        var rect = eventData.element.getBoundingClientRect(eventData.element);

        var points = {
            x: eventData.currentPoints.client.x,
            y: eventData.currentPoints.client.y
        };

        var width = eventData.element.clientWidth;
        var height = eventData.element.clientHeight;

        var pointsFromCenter = {
            x: points.x - rect.left - width / 2,
            // Invert the coordinate system so that up is positive
            y: -1 * (points.y - rect.top - height / 2)
        };

        var rotationRadians = Math.atan2(pointsFromCenter.y, pointsFromCenter.x);
        var rotationDegrees = rotationRadians * (180 / Math.PI);
        var rotation = -1 * rotationDegrees + 90;
        eventData.viewport.rotation = rotation;
        cornerstone.setViewport(eventData.element, eventData.viewport);
    }

    function horizontalStrategy(eventData) {
        eventData.viewport.rotation += (eventData.deltaPoints.page.x / eventData.viewport.scale);
        cornerstone.setViewport(eventData.element, eventData.viewport);
    }

    function verticalStrategy(eventData) {
        eventData.viewport.rotation += (eventData.deltaPoints.page.y / eventData.viewport.scale);
        cornerstone.setViewport(eventData.element, eventData.viewport);
    }

    // --- Mouse event callbacks --- //
    function mouseUpCallback(e, eventData) {
        $(eventData.element).off('CornerstoneToolsMouseDrag', dragCallback);
        $(eventData.element).off('CornerstoneToolsMouseUp', mouseUpCallback);
    }

    function mouseDownCallback(e, eventData) {
        if (cornerstoneTools.isMouseButtonEnabled(eventData.which, e.data.mouseButtonMask)) {
            $(eventData.element).on('CornerstoneToolsMouseDrag', dragCallback);
            $(eventData.element).on('CornerstoneToolsMouseUp', mouseUpCallback);
            return false; // false = causes jquery to preventDefault() and stopPropagation() this event
        }
    }

    function dragCallback(e, eventData) {
        cornerstoneTools.rotate.strategy(eventData);
        cornerstone.setViewport(eventData.element, eventData.viewport);
        return false; // false = causes jquery to preventDefault() and stopPropagation() this event
    }

    cornerstoneTools.rotate = cornerstoneTools.simpleMouseButtonTool(mouseDownCallback);
    cornerstoneTools.rotate.strategies = {
        default: defaultStrategy,
        horizontal: horizontalStrategy,
        vertical: verticalStrategy
    };
    
    cornerstoneTools.rotate.strategy = defaultStrategy;

    cornerstoneTools.rotateTouchDrag = cornerstoneTools.touchDragTool(dragCallback);

})($, cornerstone, cornerstoneTools);
 
// End Source; src/imageTools/rotate.js

// Begin Source: src/imageTools/rotateTouch.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    function touchRotateCallback(e, eventData) {
        eventData.viewport.rotation += eventData.rotation;
        cornerstone.setViewport(eventData.element, eventData.viewport);
        return false;
    }

    function disable(element) {
        $(element).off('CornerstoneToolsTouchRotate', touchRotateCallback);
    }

    function activate(element) {
        $(element).off('CornerstoneToolsTouchRotate', touchRotateCallback);
        $(element).on('CornerstoneToolsTouchRotate', touchRotateCallback);
    }

    cornerstoneTools.rotateTouch = {
        activate: activate,
        disable: disable
    };

})($, cornerstone, cornerstoneTools);
 
// End Source; src/imageTools/rotateTouch.js

// Begin Source: src/imageTools/saveImage.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    function saveAs(element, filename) {
        var canvas = $(element).find('canvas').get(0);

        // Thanks to Ken Fyrstenber
        // http://stackoverflow.com/questions/18480474/how-to-save-an-image-from-canvas
        var lnk = document.createElement('a');

        /// the key here is to set the download attribute of the a tag
        lnk.download = filename;

        /// convert canvas content to data-uri for link. When download
        /// attribute is set the content pointed to by link will be
        /// pushed as 'download' in HTML5 capable browsers
        lnk.href = canvas.toDataURL();

        /// create a 'fake' click-event to trigger the download
        if (document.createEvent) {

            var e = document.createEvent('MouseEvents');
            e.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

            lnk.dispatchEvent(e);

        } else if (lnk.fireEvent) {

            lnk.fireEvent('onclick');
        }
    }

    cornerstoneTools.saveAs = saveAs;

})($, cornerstone, cornerstoneTools);
 
// End Source; src/imageTools/saveImage.js

// Begin Source: src/imageTools/simpleAngle.js
(function($, cornerstone, cornerstoneMath, cornerstoneTools) {

    'use strict';

    var toolType = 'simpleAngle';

    ///////// BEGIN ACTIVE TOOL ///////
    function createNewMeasurement(mouseEventData) {
        // create the measurement data for this tool with the end handle activated
        var angleData = {
            visible: true,
            active: true,
            handles: {
                start: {
                    x: mouseEventData.currentPoints.image.x,
                    y: mouseEventData.currentPoints.image.y,
                    highlight: true,
                    active: false
                },
                middle: {
                    x: mouseEventData.currentPoints.image.x,
                    y: mouseEventData.currentPoints.image.y,
                    highlight: true,
                    active: true
                },
                end: {
                    x: mouseEventData.currentPoints.image.x,
                    y: mouseEventData.currentPoints.image.y,
                    highlight: true,
                    active: false
                }
            }
        };

        return angleData;
    }
    ///////// END ACTIVE TOOL ///////

    function pointNearTool(element, data, coords) {
        var lineSegment = {
            start: cornerstone.pixelToCanvas(element, data.handles.start),
            end: cornerstone.pixelToCanvas(element, data.handles.middle)
        };

        var distanceToPoint = cornerstoneMath.lineSegment.distanceToPoint(lineSegment, coords);
        if (distanceToPoint < 25) {
            return true;
        }

        lineSegment.start = cornerstone.pixelToCanvas(element, data.handles.middle);
        lineSegment.end = cornerstone.pixelToCanvas(element, data.handles.end);

        distanceToPoint = cornerstoneMath.lineSegment.distanceToPoint(lineSegment, coords);
        return (distanceToPoint < 25);
    }

    function length(vector) {
        return Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));
    }

    ///////// BEGIN IMAGE RENDERING ///////
    function onImageRendered(e, eventData) {

        // if we have no toolData for this element, return immediately as there is nothing to do
        var toolData = cornerstoneTools.getToolState(e.currentTarget, toolType);
        if (toolData === undefined) {
            return;
        }

        // we have tool data for this element - iterate over each one and draw it
        var context = eventData.canvasContext.canvas.getContext('2d');
        context.setTransform(1, 0, 0, 1, 0, 0);
        
        //activation color 
        var color;
        var lineWidth = cornerstoneTools.toolStyle.getToolWidth();
        var font = cornerstoneTools.textStyle.getFont();
        var config = cornerstoneTools.simpleAngle.getConfiguration();

        for (var i = 0; i < toolData.data.length; i++) {
            context.save();

            if (config && config.shadow) {
                context.shadowColor = config.shadowColor || '#000000';
                context.shadowOffsetX = config.shadowOffsetX || 1;
                context.shadowOffsetY = config.shadowOffsetY || 1;
            }

            var data = toolData.data[i];

            //differentiate the color of activation tool
            if (data.active) {
                color = cornerstoneTools.toolColors.getActiveColor();
            } else {
                color = cornerstoneTools.toolColors.getToolColor();
            }

            // draw the line
            context.beginPath();
            context.strokeStyle = color;
            context.lineWidth = lineWidth;

            var handleStartCanvas = cornerstone.pixelToCanvas(eventData.element, data.handles.start);
            var handleMiddleCanvas = cornerstone.pixelToCanvas(eventData.element, data.handles.middle);

            context.moveTo(handleStartCanvas.x, handleStartCanvas.y);
            context.lineTo(handleMiddleCanvas.x, handleMiddleCanvas.y);

            var handleEndCanvas = cornerstone.pixelToCanvas(eventData.element, data.handles.end);

            context.lineTo(handleEndCanvas.x, handleEndCanvas.y);
            context.stroke();

            // draw the handles
            cornerstoneTools.drawHandles(context, eventData, data.handles, color);

            // Draw the text
            context.fillStyle = color;

            // Default to isotropic pixel size, update suffix to reflect this
            var columnPixelSpacing = eventData.image.columnPixelSpacing || 1;
            var rowPixelSpacing = eventData.image.rowPixelSpacing || 1;
            var suffix = '';
            if (!eventData.image.rowPixelSpacing || !eventData.image.columnPixelSpacing) {
                suffix = ' (isotropic)';
            }

            var sideA = {
                x: (Math.ceil(data.handles.middle.x) - Math.ceil(data.handles.start.x)) * columnPixelSpacing,
                y: (Math.ceil(data.handles.middle.y) - Math.ceil(data.handles.start.y)) * rowPixelSpacing
            };

            var sideB = {
                x: (Math.ceil(data.handles.end.x) - Math.ceil(data.handles.middle.x)) * columnPixelSpacing,
                y: (Math.ceil(data.handles.end.y) - Math.ceil(data.handles.middle.y)) * rowPixelSpacing
            };

            var sideC = {
                x: (Math.ceil(data.handles.end.x) - Math.ceil(data.handles.start.x)) * columnPixelSpacing,
                y: (Math.ceil(data.handles.end.y) - Math.ceil(data.handles.start.y)) * rowPixelSpacing
            };

            var sideALength = length(sideA);
            var sideBLength = length(sideB);
            var sideCLength = length(sideC);

            // Cosine law
            var angle = Math.acos((Math.pow(sideALength, 2) + Math.pow(sideBLength, 2) - Math.pow(sideCLength, 2)) / (2 * sideALength * sideBLength));
            angle = angle * (180 / Math.PI);

            var rAngle = cornerstoneTools.roundToDecimal(angle, 2);

            if (rAngle) {
                var str = '00B0'; // degrees symbol
                var text = rAngle.toString() + String.fromCharCode(parseInt(str, 16)) + suffix;
                
                var distance = 15;

                var textX = handleMiddleCanvas.x + distance;
                var textY = handleMiddleCanvas.y + distance;

                context.font = font;
                var textWidth = context.measureText(text).width;

                if ((handleMiddleCanvas.x - handleStartCanvas.x) < 0) {
                    textX = handleMiddleCanvas.x - distance - textWidth - 10;
                } else {
                    textX = handleMiddleCanvas.x + distance;
                }

                textY = handleMiddleCanvas.y;
                cornerstoneTools.drawTextBox(context, text, textX, textY, color);
            }

            context.restore();
        }
    }
    ///////// END IMAGE RENDERING ///////

    ///////// BEGIN ACTIVE TOOL ///////
    function addNewMeasurement(mouseEventData) {
        var measurementData = createNewMeasurement(mouseEventData);
        var element = mouseEventData.element;

        var eventData = {
            mouseButtonMask: mouseEventData.which,
        };

        // associate this data with this imageId so we can render it and manipulate it
        cornerstoneTools.addToolState(element, toolType, measurementData);

        // since we are dragging to another place to drop the end point, we can just activate
        // the end point and let the moveHandle move it for us.
        $(element).off('CornerstoneToolsMouseMove', cornerstoneTools.simpleAngle.mouseMoveCallback);
        $(element).off('CornerstoneToolsMouseDrag', cornerstoneTools.simpleAngle.mouseMoveCallback);
        $(element).off('CornerstoneToolsMouseDown', cornerstoneTools.simpleAngle.mouseDownCallback);
        $(element).off('CornerstoneToolsMouseDownActivate', cornerstoneTools.simpleAngle.mouseDownActivateCallback);
        cornerstone.updateImage(element);

        cornerstoneTools.moveNewHandle(mouseEventData, measurementData.handles.middle, function() {
            measurementData.active = false;
            if (cornerstoneTools.anyHandlesOutsideImage(mouseEventData, measurementData.handles)) {
                // delete the measurement
                cornerstoneTools.removeToolState(element, toolType, measurementData);
            }

            measurementData.handles.end.active = true;
            cornerstone.updateImage(element);

            cornerstoneTools.moveNewHandle(mouseEventData, measurementData.handles.end, function() {
                measurementData.active = false;
                if (cornerstoneTools.anyHandlesOutsideImage(mouseEventData, measurementData.handles)) {
                    // delete the measurement
                    cornerstoneTools.removeToolState(element, toolType, measurementData);
                }

                $(element).on('CornerstoneToolsMouseMove', cornerstoneTools.simpleAngle.mouseMoveCallback);
                $(element).on('CornerstoneToolsMouseDrag', cornerstoneTools.simpleAngle.mouseMoveCallback);
                $(element).on('CornerstoneToolsMouseDown', eventData, cornerstoneTools.simpleAngle.mouseDownCallback);
                $(element).on('CornerstoneToolsMouseDownActivate', eventData, cornerstoneTools.simpleAngle.mouseDownActivateCallback);
                cornerstone.updateImage(element);
            });
        });
    }

    function addNewMeasurementTouch(touchEventData) {
        var measurementData = createNewMeasurement(touchEventData);
        var element = touchEventData.element;

        // associate this data with this imageId so we can render it and manipulate it
        cornerstoneTools.addToolState(element, toolType, measurementData);

        // since we are dragging to another place to drop the end point, we can just activate
        // the end point and let the moveHandle move it for us.
        $(element).off('CornerstoneToolsTouchDrag', cornerstoneTools.simpleAngleTouch.touchMoveCallback);
        $(element).off('CornerstoneToolsTouchStartActive', cornerstoneTools.simpleAngleTouch.touchDownActivateCallback);
        $(element).off('CornerstoneToolsTouchStart', cornerstoneTools.simpleAngleTouch.touchStartCallback);
        $(element).off('CornerstoneToolsTap', cornerstoneTools.simpleAngleTouch.tapCallback);
        cornerstone.updateImage(element);

        cornerstoneTools.moveNewHandleTouch(touchEventData, measurementData.handles.middle, function() {
            measurementData.active = false;
            if (cornerstoneTools.anyHandlesOutsideImage(touchEventData, measurementData.handles)) {
                // delete the measurement
                cornerstoneTools.removeToolState(element, toolType, measurementData);
            }

            measurementData.handles.end.active = true;
            cornerstone.updateImage(element);

            cornerstoneTools.moveNewHandleTouch(touchEventData, measurementData.handles.end, function() {
                measurementData.active = false;
                if (cornerstoneTools.anyHandlesOutsideImage(touchEventData, measurementData.handles)) {
                    // delete the measurement
                    cornerstoneTools.removeToolState(element, toolType, measurementData);
                }

                $(element).on('CornerstoneToolsTouchDrag', cornerstoneTools.simpleAngleTouch.touchMoveCallback);
                $(element).on('CornerstoneToolsTouchStart', cornerstoneTools.simpleAngleTouch.touchStartCallback);
                $(element).on('CornerstoneToolsTouchStartActive', cornerstoneTools.simpleAngleTouch.touchDownActivateCallback);
                $(element).on('CornerstoneToolsTap', cornerstoneTools.simpleAngleTouch.tapCallback);
                cornerstone.updateImage(element);
            });
        });
    }

    cornerstoneTools.simpleAngle = cornerstoneTools.mouseButtonTool({
        createNewMeasurement: createNewMeasurement,
        addNewMeasurement: addNewMeasurement,
        onImageRendered: onImageRendered,
        pointNearTool: pointNearTool,
        toolType: toolType
    });

    cornerstoneTools.simpleAngleTouch = cornerstoneTools.touchTool({
        createNewMeasurement: createNewMeasurement,
        addNewMeasurement: addNewMeasurementTouch,
        onImageRendered: onImageRendered,
        pointNearTool: pointNearTool,
        toolType: toolType
    });

})($, cornerstone, cornerstoneMath, cornerstoneTools);
 
// End Source; src/imageTools/simpleAngle.js

// Begin Source: src/imageTools/textMarker.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    var toolType = 'textMarker';

    ///////// BEGIN ACTIVE TOOL ///////
    function createNewMeasurement(mouseEventData) {
        var config = cornerstoneTools.textMarker.getConfiguration();

        if (!config.current) {
            return;
        }

        // create the measurement data for this tool with the end handle activated
        var measurementData = {
            visible: true,
            active: true,
            text: config.current,
            handles: {
                end: {
                    x: mouseEventData.currentPoints.image.x,
                    y: mouseEventData.currentPoints.image.y,
                    highlight: true,
                    active: true
                }
            }
        };

        // Update the current marker for the next marker
        var currentIndex = config.markers.indexOf(config.current);
        if (config.ascending) {
            currentIndex += 1;
            if (currentIndex >= config.markers.length) {
                if (!config.loop) {
                    currentIndex = -1;
                } else {
                    currentIndex -= config.markers.length;
                }
            }
        } else {
            currentIndex -= 1;
            if (currentIndex < 0) {
                if (!config.loop) {
                    currentIndex = -1;
                } else {
                    currentIndex += config.markers.length;
                }
            }
        }

        config.current = config.markers[currentIndex];

        return measurementData;
    }
    ///////// END ACTIVE TOOL ///////

    ///////// BEGIN IMAGE RENDERING ///////
    function pointNearTool(element, data, coords) {
        var endCanvas = cornerstone.pixelToCanvas(element, data.handles.end);

        var rect = {
            left: endCanvas.x - data.textWidth / 2,
            top: endCanvas.y,
            width: data.textWidth,
            height: data.textHeight
        };

        var distanceToPoint = cornerstoneMath.rect.distanceToPoint(rect, coords);
        return (distanceToPoint < 10);
    }

    function onImageRendered(e, eventData) {
        // if we have no toolData for this element, return immediately as there is nothing to do
        var toolData = cornerstoneTools.getToolState(eventData.element, toolType);
        if (!toolData) {
            return;
        }

        // we have tool data for this element - iterate over each one and draw it
        var context = eventData.canvasContext.canvas.getContext('2d');
        context.setTransform(1, 0, 0, 1, 0, 0);

        var font = cornerstoneTools.textStyle.getFont();
        var fontSize = cornerstoneTools.textStyle.getFontSize();
        var config = cornerstoneTools.textMarker.getConfiguration();

        for (var i = 0; i < toolData.data.length; i++) {
            var data = toolData.data[i];

            var color = cornerstoneTools.toolColors.getToolColor();
            if (data.active) {
                color = cornerstoneTools.toolColors.getActiveColor();
            }

            context.save();

            if (config && config.shadow) {
                context.shadowColor = config.shadowColor || '#000000';
                context.shadowOffsetX = config.shadowOffsetX || 1;
                context.shadowOffsetY = config.shadowOffsetY || 1;
            }

            // Draw text
            context.font = font;
            context.fillStyle = color;

            var measureText = context.measureText(data.text);
            data.textWidth = measureText.width;
            data.textHeight = fontSize;

            var coords = {
                x: data.handles.end.x,
                y: data.handles.end.y
            };

            var textCoords = cornerstone.pixelToCanvas(eventData.element, coords);

            cornerstoneTools.drawTextBox(context, data.text, textCoords.x - data.textWidth / 2, textCoords.y, color);

            context.restore();
        }
    }

    function doubleClickCallback(e, eventData) {
        var element = eventData.element;
        var data;

        function doneChangingTextCallback(data, updatedText, deleteTool) {
            if (deleteTool === true) {
                cornerstoneTools.removeToolState(element, toolType, data);
            } else {
                data.text = updatedText;
            }

            data.active = false;
            cornerstone.updateImage(element);
            $(element).on('CornerstoneToolsMouseMove', eventData, cornerstoneTools.textMarker.mouseMoveCallback);
            $(element).on('CornerstoneToolsMouseDown', eventData, cornerstoneTools.textMarker.mouseDownCallback);
            $(element).on('CornerstoneToolsMouseDownActivate', eventData, cornerstoneTools.textMarker.mouseDownActivateCallback);
            $(element).on('CornerstoneToolsMouseDoubleClick', eventData, cornerstoneTools.textMarker.mouseDoubleClickCallback);
        }

        if (e.data && e.data.mouseButtonMask && !cornerstoneTools.isMouseButtonEnabled(eventData.which, e.data.mouseButtonMask)) {
            return false;
        }

        var config = cornerstoneTools.textMarker.getConfiguration();

        var coords = eventData.currentPoints.canvas;
        var toolData = cornerstoneTools.getToolState(element, toolType);

        // now check to see if there is a handle we can move
        if (!toolData) {
            return false;
        }

        for (var i = 0; i < toolData.data.length; i++) {
            data = toolData.data[i];
            if (pointNearTool(element, data, coords)) {
                data.active = true;
                cornerstone.updateImage(element);

                $(element).off('CornerstoneToolsMouseMove', cornerstoneTools.textMarker.mouseMoveCallback);
                $(element).off('CornerstoneToolsMouseDown', cornerstoneTools.textMarker.mouseDownCallback);
                $(element).off('CornerstoneToolsMouseDownActivate', cornerstoneTools.textMarker.mouseDownActivateCallback);
                $(element).off('CornerstoneToolsMouseDoubleClick', cornerstoneTools.textMarker.mouseDoubleClickCallback);
                // Allow relabelling via a callback
                config.changeTextCallback(data, doneChangingTextCallback);
                
                e.stopImmediatePropagation();
                return false;
            }
        }

        return false; // false = causes jquery to preventDefault() and stopPropagation() this event
    }

    function touchPressCallback(e, eventData) {
        var element = eventData.element;
        var data;

        function doneChangingTextCallback(data, updatedText, deleteTool) {
            if (deleteTool === true) {
                cornerstoneTools.removeToolState(element, toolType, data);
            } else {
                data.text = updatedText;
            }

            data.active = false;
            cornerstone.updateImage(element);
            $(element).off('CornerstoneToolsTouchDrag', cornerstoneTools.textMarkerTouch.touchMoveCallback);
            $(element).off('CornerstoneToolsTouchStartActive', cornerstoneTools.textMarkerTouch.touchDownActivateCallback);
            $(element).off('CornerstoneToolsTouchStart', cornerstoneTools.textMarkerTouch.touchStartCallback);
            $(element).off('CornerstoneToolsTap', cornerstoneTools.textMarkerTouch.tapCallback);
            $(element).off('CornerstoneToolsTouchPress', cornerstoneTools.textMarkerTouch.pressCallback);

            $(element).on('CornerstoneToolsTouchDrag', cornerstoneTools.textMarkerTouch.touchMoveCallback);
            $(element).on('CornerstoneToolsTouchStartActive', cornerstoneTools.textMarkerTouch.touchDownActivateCallback);
            $(element).on('CornerstoneToolsTouchStart', cornerstoneTools.textMarkerTouch.touchStartCallback);
            $(element).on('CornerstoneToolsTap', cornerstoneTools.textMarkerTouch.tapCallback);
            $(element).on('CornerstoneToolsTouchPress', cornerstoneTools.textMarkerTouch.pressCallback);
        }

        if (e.data && e.data.mouseButtonMask && !cornerstoneTools.isMouseButtonEnabled(eventData.which, e.data.mouseButtonMask)) {
            return false;
        }

        var config = cornerstoneTools.textMarker.getConfiguration();

        var coords = eventData.currentPoints.canvas;
        var toolData = cornerstoneTools.getToolState(element, toolType);

        // now check to see if there is a handle we can move
        if (!toolData) {
            return false;
        }

        for (var i = 0; i < toolData.data.length; i++) {
            data = toolData.data[i];
            if (pointNearTool(element, data, coords)) {
                data.active = true;
                cornerstone.updateImage(element);

                $(element).off('CornerstoneToolsTouchDrag', cornerstoneTools.textMarkerTouch.touchMoveCallback);
                $(element).off('CornerstoneToolsTouchStartActive', cornerstoneTools.textMarkerTouch.touchDownActivateCallback);
                $(element).off('CornerstoneToolsTouchStart', cornerstoneTools.textMarkerTouch.touchStartCallback);
                $(element).off('CornerstoneToolsTap', cornerstoneTools.textMarkerTouch.tapCallback);
                $(element).off('CornerstoneToolsTouchPress', cornerstoneTools.textMarkerTouch.pressCallback);
                // Allow relabelling via a callback
                config.changeTextCallback(data, doneChangingTextCallback);
                
                e.stopImmediatePropagation();
                return false;
            }
        }

        return false; // false = causes jquery to preventDefault() and stopPropagation() this event
    }

    cornerstoneTools.textMarker = cornerstoneTools.mouseButtonTool({
        createNewMeasurement: createNewMeasurement,
        onImageRendered: onImageRendered,
        pointNearTool: pointNearTool,
        toolType: toolType,
        mouseDoubleClickCallback: doubleClickCallback
    });

    cornerstoneTools.textMarkerTouch = cornerstoneTools.touchTool({
        createNewMeasurement: createNewMeasurement,
        onImageRendered: onImageRendered,
        pointNearTool: pointNearTool,
        toolType: toolType,
        pressCallback: touchPressCallback
    });

    ///////// END IMAGE RENDERING ///////

})($, cornerstone, cornerstoneTools);
 
// End Source; src/imageTools/textMarker.js

// Begin Source: src/imageTools/wwwc.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    function mouseUpCallback(e, eventData) {
        $(eventData.element).off('CornerstoneToolsMouseDrag', mouseDragCallback);
        $(eventData.element).off('CornerstoneToolsMouseUp', mouseUpCallback);
    }

    function mouseDownCallback(e, eventData) {
        if (cornerstoneTools.isMouseButtonEnabled(eventData.which, e.data.mouseButtonMask)) {
            $(eventData.element).on('CornerstoneToolsMouseDrag', mouseDragCallback);
            $(eventData.element).on('CornerstoneToolsMouseUp', mouseUpCallback);
            return false; // false = cases jquery to preventDefault() and stopPropagation() this event
        }
    }

    function defaultStrategy(eventData) {
        // here we normalize the ww/wc adjustments so the same number of on screen pixels
        // adjusts the same percentage of the dynamic range of the image.  This is needed to
        // provide consistency for the ww/wc tool regardless of the dynamic range (e.g. an 8 bit
        // image will feel the same as a 16 bit image would)
        var maxVOI = eventData.image.maxPixelValue * eventData.image.slope + eventData.image.intercept;
        var minVOI = eventData.image.minPixelValue * eventData.image.slope + eventData.image.intercept;
        var imageDynamicRange = maxVOI - minVOI;
        var multiplier = imageDynamicRange / 1024;

        var deltaX = eventData.deltaPoints.page.x * multiplier;
        var deltaY = eventData.deltaPoints.page.y * multiplier;

        eventData.viewport.voi.windowWidth += (deltaX);
        eventData.viewport.voi.windowCenter += (deltaY);
    }

    function mouseDragCallback(e, eventData) {
        cornerstoneTools.wwwc.strategy(eventData);
        cornerstone.setViewport(eventData.element, eventData.viewport);
        return false; // false = cases jquery to preventDefault() and stopPropagation() this event
    }

    function touchDragCallback(e, eventData) {
        e.stopImmediatePropagation(); // Prevent CornerstoneToolsTouchStartActive from killing any press events
        var dragData = eventData;

        var maxVOI = dragData.image.maxPixelValue * dragData.image.slope + dragData.image.intercept;
        var minVOI = dragData.image.minPixelValue * dragData.image.slope + dragData.image.intercept;
        var imageDynamicRange = maxVOI - minVOI;
        var multiplier = imageDynamicRange / 1024;
        var deltaX = dragData.deltaPoints.page.x * multiplier;
        var deltaY = dragData.deltaPoints.page.y * multiplier;

        var config = cornerstoneTools.wwwc.getConfiguration();
        if (config.orientation) {
            if (config.orientation === 0) {
                dragData.viewport.voi.windowWidth += (deltaX);
                dragData.viewport.voi.windowCenter += (deltaY);
            } else {
                dragData.viewport.voi.windowWidth += (deltaY);
                dragData.viewport.voi.windowCenter += (deltaX);
            }
        } else {
            dragData.viewport.voi.windowWidth += (deltaX);
            dragData.viewport.voi.windowCenter += (deltaY);
        }

        cornerstone.setViewport(dragData.element, dragData.viewport);
    }

    cornerstoneTools.wwwc = cornerstoneTools.simpleMouseButtonTool(mouseDownCallback);
    cornerstoneTools.wwwc.strategies = {
        default: defaultStrategy
    };
    cornerstoneTools.wwwc.strategy = defaultStrategy;
    cornerstoneTools.wwwcTouchDrag = cornerstoneTools.touchDragTool(touchDragCallback);

})($, cornerstone, cornerstoneTools);
 
// End Source; src/imageTools/wwwc.js

// Begin Source: src/imageTools/wwwcRegion.js
(function($, cornerstone, cornerstoneMath, cornerstoneTools) {

    'use strict';

    var toolType = 'wwwcRegion';

    var configuration = {
        minWindowWidth: 10
    };

    /** Calculates the minimum, maximum, and mean value in the given pixel array */
    function calculateMinMaxMean(storedPixelLuminanceData, globalMin, globalMax) {
        var numPixels = storedPixelLuminanceData.length;

        if (numPixels < 2) {
            return {
                min: globalMin,
                max: globalMax,
                mean: globalMin
            };
        }

        var min = globalMax;
        var max = globalMin;
        var sum = 0;

        for (var index = 0; index < numPixels; index++) {
            var spv = storedPixelLuminanceData[index];
            min = Math.min(min, spv);
            max = Math.max(max, spv);
            sum += spv;
        }

        return {
            min: min,
            max: max,
            mean: sum / numPixels
        };
    }

    /* Applies the windowing procedure when the mouse drag ends */
    function dragEndCallback(e, eventData) {
        $(eventData.element).off('CornerstoneToolsMouseMove', dragCallback);
        $(eventData.element).off('CornerstoneToolsMouseDrag', dragCallback);
        $(eventData.element).off('CornerstoneToolsMouseUp', dragEndCallback);
        $(eventData.element).off('CornerstoneToolsMouseClick', dragEndCallback);
        
        var toolData = cornerstoneTools.getToolState(eventData.element, toolType);
        if (!toolData) {
            return;
        }

        if (!toolData.data.length) {
            return;
        }

        // Update the endpoint as the mouse/touch is dragged
        var endPoint = {
            x: eventData.currentPoints.image.x,
            y: eventData.currentPoints.image.y
        };

        toolData.data[0].endPoint = endPoint;

        applyWWWCRegion(eventData);

        var mouseData = {
            mouseButtonMask: eventData.which
        };

        $(eventData.element).on('CornerstoneToolsMouseDown', mouseData, mouseDownCallback);
    }

    /** Calculates the minimum and maximum value in the given pixel array */
    function applyWWWCRegion(eventData) {
        var toolData = cornerstoneTools.getToolState(eventData.element, toolType);
        if (!toolData) {
            return;
        }

        if (!toolData.data.length) {
            return;
        }

        var startPoint = toolData.data[0].startPoint;
        var endPoint = toolData.data[0].endPoint;

        // Get the rectangular region defined by the handles
        var width = Math.abs(startPoint.x - endPoint.x);
        var height = Math.abs(startPoint.y - endPoint.y);

        var left = Math.min(startPoint.x, endPoint.x);
        var top = Math.min(startPoint.y, endPoint.y);

        // Bound the rectangle so we don't get undefined pixels
        left = Math.max(left, 0);
        left = Math.min(left, eventData.image.width);
        top = Math.max(top, 0);
        top = Math.min(top, eventData.image.height);
        width = Math.floor(Math.min(width, Math.abs(eventData.image.width - left)));
        height = Math.floor(Math.min(height, Math.abs(eventData.image.height - top)));

        // Get the pixel data in the rectangular region
        var pixelLuminanceData = cornerstoneTools.getLuminance(eventData.element, left, top, width, height);

        // Calculate the minimum and maximum pixel values
        var minMaxMean = calculateMinMaxMean(pixelLuminanceData, eventData.image.minPixelValue, eventData.image.maxPixelValue);

        // Adjust the viewport window width and center based on the calculated values
        var config = cornerstoneTools.wwwcRegion.getConfiguration();
        var viewport = cornerstone.getViewport(eventData.element);
        if (config.minWindowWidth === undefined) {
            config.minWindowWidth = 10;
        }

        viewport.voi.windowWidth = Math.max(Math.abs(minMaxMean.max - minMaxMean.min), config.minWindowWidth);
        viewport.voi.windowCenter = minMaxMean.mean;
        cornerstone.setViewport(eventData.element, viewport);

        // Clear the toolData
        toolData.data = [];

        cornerstone.updateImage(eventData.element);
    }

    function whichMovement(e, eventData) {
        var element = eventData.element;

        $(element).off('CornerstoneToolsMouseMove');
        $(element).off('CornerstoneToolsMouseDrag');

        $(element).on('CornerstoneToolsMouseMove', dragCallback);
        $(element).on('CornerstoneToolsMouseDrag', dragCallback);

        $(element).on('CornerstoneToolsMouseClick', dragEndCallback);
        if (e.type === 'CornerstoneToolsMouseDrag') {
            $(element).on('CornerstoneToolsMouseUp', dragEndCallback);
        }
    }

    /** Records the start point and attaches the drag event handler */
    function mouseDownCallback(e, eventData) {
        if (cornerstoneTools.isMouseButtonEnabled(eventData.which, e.data.mouseButtonMask)) {
            $(eventData.element).on('CornerstoneToolsMouseDrag', eventData, whichMovement);
            $(eventData.element).on('CornerstoneToolsMouseMove', eventData, whichMovement);
            $(eventData.element).on('CornerstoneToolsMouseUp', dragEndCallback);

            $(eventData.element).off('CornerstoneToolsMouseDown');
            recordStartPoint(eventData);
            return false;
        }
    }

    /** Records the start point of the click or touch */
    function recordStartPoint(eventData) {
        var toolData = cornerstoneTools.getToolState(eventData.element, toolType);
        if (toolData && toolData.data) {
            toolData.data = [];
        }

        var measurementData = {
            startPoint: {
                x: eventData.currentPoints.image.x,
                y: eventData.currentPoints.image.y
            }
        };

        cornerstoneTools.addToolState(eventData.element, toolType, measurementData);
    }

    /** Draws the rectangular region while the touch or mouse event drag occurs */
    function dragCallback(e, eventData) {
        // if we have no toolData for this element, return immediately as there is nothing to do
        var toolData = cornerstoneTools.getToolState(eventData.element, toolType);
        if (toolData === undefined) {
            return;
        }

        if (!toolData.data.length) {
            return;
        }

        // Update the endpoint as the mouse/touch is dragged
        var endPoint = {
            x: eventData.currentPoints.image.x,
            y: eventData.currentPoints.image.y
        };

        toolData.data[0].endPoint = endPoint;
        cornerstone.updateImage(eventData.element);
    }

    function onImageRendered(e, eventData) {
        var toolData = cornerstoneTools.getToolState(eventData.element, toolType);
        if (!toolData) {
            return;
        }

        if (!toolData.data.length) {
            return;
        }

        var startPoint = toolData.data[0].startPoint;
        var endPoint = toolData.data[0].endPoint;

        if (!startPoint || !endPoint) {
            return;
        }

        // Get the current element's canvas
        var canvas = $(eventData.element).find('canvas').get(0);
        var context = canvas.getContext('2d');
        context.setTransform(1, 0, 0, 1, 0, 0);

        // Set to the active tool color
        var color = cornerstoneTools.toolColors.getActiveColor();
        
        // Calculate the rectangle parameters
        var startPointCanvas = cornerstone.pixelToCanvas(eventData.element, startPoint);
        var endPointCanvas = cornerstone.pixelToCanvas(eventData.element, endPoint);

        var left = Math.min(startPointCanvas.x, endPointCanvas.x);
        var top = Math.min(startPointCanvas.y, endPointCanvas.y);
        var width = Math.abs(startPointCanvas.x - endPointCanvas.x);
        var height = Math.abs(startPointCanvas.y - endPointCanvas.y);

        var lineWidth = cornerstoneTools.toolStyle.getToolWidth();
        var config = cornerstoneTools.wwwcRegion.getConfiguration();

        // Draw the rectangle
        context.save();

        if (config && config.shadow) {
            context.shadowColor = config.shadowColor || '#000000';
            context.shadowOffsetX = config.shadowOffsetX || 1;
            context.shadowOffsetY = config.shadowOffsetY || 1;
        }

        context.beginPath();
        context.strokeStyle = color;
        context.lineWidth = lineWidth;
        context.rect(left, top, width, height);
        context.stroke();

        context.restore();
    }

    // --- Mouse tool enable / disable --- ///
    function disable(element) {
        $(element).off('CornerstoneToolsMouseDown', mouseDownCallback);
        $(element).off('CornerstoneImageRendered', onImageRendered);

        cornerstone.updateImage(element);
    }

    function activate(element, mouseButtonMask) {
        var eventData = {
            mouseButtonMask: mouseButtonMask,
        };

        var toolData = cornerstoneTools.getToolState(element, toolType);
        if (!toolData) {
            var data = [];
            cornerstoneTools.addToolState(element, toolType, data);
        }

        $(element).off('CornerstoneToolsMouseDown', mouseDownCallback);
        $(element).off('CornerstoneToolsMouseUp', dragEndCallback);
        $(element).off('CornerstoneToolsMouseDrag', dragCallback);
        $(element).off('CornerstoneImageRendered', onImageRendered);

        $(element).on('CornerstoneToolsMouseDown', eventData, mouseDownCallback);
        $(element).on('CornerstoneImageRendered', onImageRendered);
        cornerstone.updateImage(element);
    }

    // --- Touch tool enable / disable --- //
    function disableTouchDrag(element) {
        $(element).off('CornerstoneToolsTouchDrag', dragCallback);
        $(element).off('CornerstoneToolsTouchStart', recordStartPoint);
        $(element).off('CornerstoneToolsDragEnd', applyWWWCRegion);
        $(element).off('CornerstoneImageRendered', onImageRendered);
    }

    function activateTouchDrag(element) {
        var toolData = cornerstoneTools.getToolState(element, toolType);
        if (toolData === undefined) {
            var data = [];
            cornerstoneTools.addToolState(element, toolType, data);
        }

        $(element).off('CornerstoneToolsTouchDrag', dragCallback);
        $(element).off('CornerstoneToolsTouchStart', recordStartPoint);
        $(element).off('CornerstoneToolsDragEnd', applyWWWCRegion);
        $(element).off('CornerstoneImageRendered', onImageRendered);

        $(element).on('CornerstoneToolsTouchDrag', dragCallback);
        $(element).on('CornerstoneToolsTouchStart', recordStartPoint);
        $(element).on('CornerstoneToolsDragEnd', applyWWWCRegion);
        $(element).on('CornerstoneImageRendered', onImageRendered);
    }

    function getConfiguration() {
        return configuration;
    }

    function setConfiguration(config) {
        configuration = config;
    }

    // module exports
    cornerstoneTools.wwwcRegion = {
        activate: activate,
        deactivate: disable,
        disable: disable,
        setConfiguration: setConfiguration,
        getConfiguration: getConfiguration
    };

    cornerstoneTools.wwwcRegionTouch = {
        activate: activateTouchDrag,
        deactivate: disableTouchDrag,
        disable: disableTouchDrag
    };

})($, cornerstone, cornerstoneMath, cornerstoneTools);
 
// End Source; src/imageTools/wwwcRegion.js

// Begin Source: src/imageTools/zoom.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    var startPoints;

    function changeViewportScale(viewport, ticks) {
        var config = cornerstoneTools.zoom.getConfiguration();
        var pow = 1.7;
        
        var oldFactor = Math.log(viewport.scale) / Math.log(pow);
        var factor = oldFactor + ticks;
        
        var scale = Math.pow(pow, factor);
        if (config.maxScale && scale > config.maxScale) {
            viewport.scale = config.maxScale;
        } else if (config.minScale && scale < config.minScale) {
            viewport.scale = config.minScale;
        } else {
            viewport.scale = scale;
        }

        return viewport;
    }

    function boundPosition(position, width, height) {
        position.x = Math.max(position.x, 0);
        position.y = Math.max(position.y, 0);
        position.x = Math.min(position.x, width);
        position.y = Math.min(position.y, height);
        return position;
    }

    function correctShift(shift, viewport) {
        // Apply rotations
        if (viewport.rotation !== 0) {
            var angle = viewport.rotation * Math.PI / 180;
    
            var cosA = Math.cos(angle);
            var sinA = Math.sin(angle);
    
            var newX = shift.x * cosA - shift.y * sinA;
            var newY = shift.x * sinA + shift.y * cosA;

            shift.x = newX;
            shift.y = newY;
        }

        // Apply Flips        
        if (viewport.hflip) {
            shift.x *= -1;
        }

        if (viewport.vflip) {
            shift.y *= -1;
        }

        return shift;
    }

    function defaultStrategy(eventData, ticks) {
        var element = eventData.element;

        // Calculate the new scale factor based on how far the mouse has changed
        var viewport = changeViewportScale(eventData.viewport, ticks);
        cornerstone.setViewport(element, viewport);

        // Now that the scale has been updated, determine the offset we need to apply to the center so we can
        // keep the original start location in the same position
        var newCoords = cornerstone.pageToPixel(element, eventData.startPoints.page.x, eventData.startPoints.page.y);
        var shift = {
            x: eventData.startPoints.image.x - newCoords.x,
            y: eventData.startPoints.image.y - newCoords.y
        };

        shift = correctShift(shift, viewport);
        viewport.translation.x -= shift.x;
        viewport.translation.y -= shift.y;
        cornerstone.setViewport(element, viewport);
    }

    function translateStrategy(eventData, ticks) {
        var element = eventData.element;
        var image = eventData.image;

        // Calculate the new scale factor based on how far the mouse has changed
        var viewport = changeViewportScale(eventData.viewport, ticks);
        cornerstone.setViewport(element, viewport);

        var config = cornerstoneTools.zoom.getConfiguration();
        var shift,
            newCoords;

        var outwardsTranslateSpeed = 8;
        var inwardsTranslateSpeed = 8;
        var outwardsMinScaleToTranslate = 3;
        var minTranslation = 0.01;

        if (ticks < 0) {
            // Zoom outwards from the image center
            shift = {
                x: viewport.scale < outwardsMinScaleToTranslate ? viewport.translation.x / outwardsTranslateSpeed : 0,
                y: viewport.scale < outwardsMinScaleToTranslate ? viewport.translation.y / outwardsTranslateSpeed : 0
            };
            
            if (Math.abs(viewport.translation.x) < minTranslation) {
                viewport.translation.x = 0;
                shift.x = 0;
            } else if (Math.abs(viewport.translation.y) < minTranslation) {
                viewport.translation.y = 0;
                shift.y = 0;
            } else if (Math.abs(viewport.translation.x) < minTranslation &&
                       Math.abs(viewport.translation.y) < minTranslation) {
                cornerstone.setViewport(element, viewport);
                return false;
            }
        } else {
            newCoords = cornerstone.pageToPixel(element, startPoints.page.x, startPoints.page.y);
            if (config && config.preventZoomOutsideImage) {
                startPoints.image = boundPosition(startPoints.image, image.width, image.height);
                newCoords = boundPosition(newCoords, image.width, image.height);
            }
            // Zoom inwards to the current image point
            var desiredTranslation = {
                x: image.width / 2 - startPoints.image.x,
                y: image.height / 2 - startPoints.image.y
            };

            var distanceToDesired = {
                x: viewport.translation.x - desiredTranslation.x,
                y: viewport.translation.y - desiredTranslation.y
            };

            shift = {
                x: distanceToDesired.x / inwardsTranslateSpeed,
                y: distanceToDesired.y / inwardsTranslateSpeed
            };

            if (Math.abs(distanceToDesired.x) < minTranslation) {
                viewport.translation.x = desiredTranslation.x;
                shift.x = 0;
            } else if (Math.abs(distanceToDesired.y) < minTranslation) {
                viewport.translation.y = desiredTranslation.y;
                shift.y = 0;
            } else if (Math.abs(distanceToDesired.x) < minTranslation &&
                       Math.abs(distanceToDesired.y) < minTranslation) {
                cornerstone.setViewport(element, viewport);
                return false;
            }
        }

        shift = correctShift(shift, viewport);
        if (!shift.x && !shift.y) {
            return false;
        }

        viewport.translation.x -= shift.x;
        viewport.translation.y -= shift.y;
        cornerstone.setViewport(element, viewport);
    }

    function mouseUpCallback(e, eventData) {
        $(eventData.element).off('CornerstoneToolsMouseDrag', dragCallback);
        $(eventData.element).off('CornerstoneToolsMouseUp', mouseUpCallback);
    }

    function mouseDownCallback(e, eventData) {
        if (cornerstoneTools.isMouseButtonEnabled(eventData.which, e.data.mouseButtonMask)) {
            startPoints = eventData.startPoints; // Used for translateStrategy
            $(eventData.element).on('CornerstoneToolsMouseDrag', dragCallback);
            $(eventData.element).on('CornerstoneToolsMouseUp', mouseUpCallback);
            return false; // false = cases jquery to preventDefault() and stopPropagation() this event
        }
    }

    function dragCallback(e, eventData) {
        if (!eventData.deltaPoints.page.y) {
            return false;
        }

        var ticks = eventData.deltaPoints.page.y / 100;
        cornerstoneTools.zoom.strategy(eventData, ticks);
        return false; // false = causes jquery to preventDefault() and stopPropagation() this event
    }

    function mouseWheelCallback(e, eventData) {
        var ticks = -eventData.direction / 4;
        var viewport = changeViewportScale(eventData.viewport, ticks);
        cornerstone.setViewport(eventData.element, viewport);
    }

    function touchPinchCallback(e, eventData) {
        var config = cornerstoneTools.zoom.getConfiguration();
        var viewport = eventData.viewport;
        var element = eventData.element;

        // Change the scale based on the pinch gesture's scale change
        viewport.scale += eventData.scaleChange * viewport.scale;
        if (config.maxScale && viewport.scale > config.maxScale) {
            viewport.scale = config.maxScale;
        } else if (config.minScale && viewport.scale < config.minScale) {
            viewport.scale = config.minScale;
        }

        cornerstone.setViewport(element, viewport);

        // Now that the scale has been updated, determine the offset we need to apply to the center so we can
        // keep the original start location in the same position
        var newCoords = cornerstone.pageToPixel(element, eventData.startPoints.page.x, eventData.startPoints.page.y);
        var shift = {
            x: eventData.startPoints.image.x - newCoords.x,
            y: eventData.startPoints.image.y - newCoords.y
        };

        shift = correctShift(shift, viewport);
        viewport.translation.x -= shift.x;
        viewport.translation.y -= shift.y;
        cornerstone.setViewport(element, viewport);
    }

    cornerstoneTools.zoom = cornerstoneTools.simpleMouseButtonTool(mouseDownCallback);
    cornerstoneTools.zoom.strategies = {
        default: defaultStrategy,
        translate: translateStrategy
    };
    cornerstoneTools.zoom.strategy = defaultStrategy;

    cornerstoneTools.zoomWheel = cornerstoneTools.mouseWheelTool(mouseWheelCallback);
    cornerstoneTools.zoomTouchPinch = cornerstoneTools.touchPinchTool(touchPinchCallback);
    cornerstoneTools.zoomTouchDrag = cornerstoneTools.touchDragTool(dragCallback);

})($, cornerstone, cornerstoneTools);
 
// End Source; src/imageTools/zoom.js

// Begin Source: src/inputSources/keyboardInput.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    var mouseX, mouseY;

    function keyPress(e) {
        var element = e.currentTarget;
        var startingCoords = cornerstone.pageToPixel(element, mouseX, mouseY);

        e = window.event || e; // old IE support

        var keyPressData = {
            element: element,
            viewport: cornerstone.getViewport(element),
            image: cornerstone.getEnabledElement(element).image,
            pageX: mouseX,
            pageY: mouseY,
            imageX: startingCoords.x,
            imageY: startingCoords.y,
            keyCode: e.keyCode,
            which: e.which
        };

        if (e.type === 'keydown') {
            $(element).trigger('CornerstoneToolsKeyDown', keyPressData);
        } else if (e.type === 'keypress') {
            $(element).trigger('CornerstoneToolsKeyPress', keyPressData);
        } else if (e.type === 'keyup') {
            $(element).trigger('CornerstoneToolsKeyUp', keyPressData);
        }
    }

    function mouseMove(e) {
        mouseX = e.pageX || e.originalEvent.pageX;
        mouseY = e.pageY || e.originalEvent.pageY;
    }

    var keyboardEvent = 'keydown keypress keyup';

    function enable(element) {
        $(element).bind(keyboardEvent, keyPress);
        $(element).on('mousemove', mouseMove);
    }

    function disable(element) {
        $(element).unbind(keyboardEvent, keyPress);
    }

    // module exports
    cornerstoneTools.keyboardInput = {
        enable: enable,
        disable: disable
    };

})($, cornerstone, cornerstoneTools);
 
// End Source; src/inputSources/keyboardInput.js

// Begin Source: src/inputSources/preventGhostClick.js
(function(cornerstoneTools) {

    'use strict';

    // Functions to prevent ghost clicks following a touch
    // All credit to @kosich
    // https://gist.github.com/kosich/23188dd86633b6c2efb7

    var antiGhostDelay = 2000,
        pointerType = {
            mouse: 0,
            touch: 1
        },
        lastInteractionType,
        lastInteractionTime;

    function handleTap(type, e) {
        var now = Date.now();
        if (type !== lastInteractionType) {
            if (now - lastInteractionTime <= antiGhostDelay) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
            }

            lastInteractionType = type;
        }

        lastInteractionTime = now;
    }

    // Cacheing the function references
    // Necessary because a new function reference is created after .bind() is called
    // http://stackoverflow.com/questions/11565471/removing-event-listener-which-was-added-with-bind
    var handleTapMouse = handleTap.bind(null, pointerType.mouse);
    var handleTapTouch = handleTap.bind(null, pointerType.touch);

    function attachEvents(element, eventList, interactionType) {
        var tapHandler = interactionType ? handleTapMouse : handleTapTouch;
        eventList.forEach(function(eventName) {
            element.addEventListener(eventName, tapHandler, true);
        });
    }

    function removeEvents(element, eventList, interactionType) {
        var tapHandler = interactionType ? handleTapMouse : handleTapTouch;
        eventList.forEach(function(eventName) {
            element.removeEventListener(eventName, tapHandler, true);
        });
    }

    var mouseEvents = [ 'mousedown', 'mouseup' ];
    var touchEvents = [ 'touchstart', 'touchend' ];

    function disable(element) {
        removeEvents(element, mouseEvents, pointerType.mouse);
        removeEvents(element, touchEvents, pointerType.touch);
    }

    function enable(element) {
        disable(element);
        attachEvents(element, mouseEvents, pointerType.mouse);
        attachEvents(element, touchEvents, pointerType.touch);
    }

    cornerstoneTools.preventGhostClick = {
        enable: enable,
        disable: disable
    };

})(cornerstoneTools);
 
// End Source; src/inputSources/preventGhostClick.js

// Begin Source: src/manipulators/anyHandlesOutsideImage.js
(function($, cornerstone, cornerstoneMath, cornerstoneTools) {

    'use strict';

    function anyHandlesOutsideImage(renderData, handles) {
        var image = renderData.image;
        var imageRect = {
            left: 0,
            top: 0,
            width: image.width,
            height: image.height
        };

        var handleOutsideImage = false;

        Object.keys(handles).forEach(function(name) {
            var handle = handles[name];
            if (handle.allowedOutsideImage === true) {
                return;
            }
            
            if (cornerstoneMath.point.insideRect(handle, imageRect) === false) {
                handleOutsideImage = true;
            }
        });

        return handleOutsideImage;
    }

    // module/private exports
    cornerstoneTools.anyHandlesOutsideImage = anyHandlesOutsideImage;

})($, cornerstone, cornerstoneMath, cornerstoneTools);
 
// End Source; src/manipulators/anyHandlesOutsideImage.js

// Begin Source: src/manipulators/drawHandles.js
(function(cornerstone, cornerstoneTools) {

    'use strict';

    var handleRadius = 6;

    function drawHandles(context, renderData, handles, color, fill) {
        context.strokeStyle = color;

        Object.keys(handles).forEach(function(name) {
            var handle = handles[name];
            if (handle.drawnIndependently === true) {
                return;
            }

            context.beginPath();

            if (handle.active) {
                context.lineWidth = cornerstoneTools.toolStyle.getActiveWidth();
            } else {
                context.lineWidth = cornerstoneTools.toolStyle.getToolWidth();
            }

            var handleCanvasCoords = cornerstone.pixelToCanvas(renderData.element, handle);
            context.arc(handleCanvasCoords.x, handleCanvasCoords.y, handleRadius, 0, 2 * Math.PI);

            if (fill) {
                context.fillStyle = fill;
                context.fill();
            }

            context.stroke();
        });
    }

    // module/private exports
    cornerstoneTools.drawHandles = drawHandles;

})(cornerstone, cornerstoneTools);
 
// End Source; src/manipulators/drawHandles.js

// Begin Source: src/manipulators/getHandleNearImagePoint.js
(function($, cornerstone, cornerstoneMath, cornerstoneTools) {

    'use strict';

    function getHandleNearImagePoint(element, handles, coords, distanceThreshold) {
        var nearbyHandle;
        
        if (!handles) {
            return;
        }

        Object.keys(handles).forEach(function(name) {
            var handle = handles[name];
            if (handle.hasOwnProperty('pointNearHandle')) {
                if (handle.pointNearHandle(element, handle, coords)) {
                    nearbyHandle = handle;
                    return;
                }
            } else {
                var handleCanvas = cornerstone.pixelToCanvas(element, handle);
                var distance = cornerstoneMath.point.distance(handleCanvas, coords);
                if (distance <= distanceThreshold) {
                    nearbyHandle = handle;
                    return;
                }
            }
        });
        
        return nearbyHandle;
    }

    // module exports
    cornerstoneTools.getHandleNearImagePoint = getHandleNearImagePoint;

})($, cornerstone, cornerstoneMath, cornerstoneTools);
 
// End Source; src/manipulators/getHandleNearImagePoint.js

// Begin Source: src/manipulators/handleActivator.js
(function($, cornerstone, cornerstoneMath, cornerstoneTools) {

    'use strict';

    function getActiveHandle(handles) {
        var activeHandle;

        Object.keys(handles).forEach(function(name) {
            var handle = handles[name];
            if (handle.active === true) {
                activeHandle = handle;
                return;
            }
        });

        return activeHandle;
    }

    function handleActivator(element, handles, canvasPoint, distanceThreshold) {
        if (!distanceThreshold) {
            distanceThreshold = 36;
        }

        var activeHandle = getActiveHandle(handles);
        var nearbyHandle = cornerstoneTools.getHandleNearImagePoint(element, handles, canvasPoint, distanceThreshold);
        if (activeHandle !== nearbyHandle) {
            if (nearbyHandle !== undefined) {
                nearbyHandle.active = true;
            }

            if (activeHandle !== undefined) {
                activeHandle.active = false;
            }

            return true;
        }

        return false;
    }

    // module/private exports
    cornerstoneTools.handleActivator = handleActivator;

})($, cornerstone, cornerstoneMath, cornerstoneTools);
 
// End Source; src/manipulators/handleActivator.js

// Begin Source: src/manipulators/moveAllHandles.js
(function($, cornerstone, cornerstoneMath, cornerstoneTools) {

    'use strict';

    function moveAllHandles(mouseEventData, data, toolData, toolType, options, doneMovingCallback) {
        var element = mouseEventData.element;

        function mouseDragCallback(e, eventData) {
            data.active = true;

            Object.keys(data.handles).forEach(function(name) {
                var handle = data.handles[name];
                if (handle.movesIndependently === true) {
                    return;
                }

                handle.x += eventData.deltaPoints.image.x;
                handle.y += eventData.deltaPoints.image.y;
                
                if (options.preventHandleOutsideImage === true) {
                    handle.x = Math.max(handle.x, 0);
                    handle.x = Math.min(handle.x, eventData.image.width);

                    handle.y = Math.max(handle.y, 0);
                    handle.y = Math.min(handle.y, eventData.image.height);
                }
            });

            cornerstone.updateImage(element);

            var eventType = 'CornerstoneToolsMeasurementModified';
            var modifiedEventData = {
                toolType: toolType,
                element: element,
                measurementData: data
            };
            $(element).trigger(eventType, modifiedEventData);

            return false; // false = causes jquery to preventDefault() and stopPropagation() this event
        }

        $(element).on('CornerstoneToolsMouseDrag', mouseDragCallback);

        function mouseUpCallback(e, eventData) {
            data.active = false;
            data.invalidated = true;

            $(element).off('CornerstoneToolsMouseDrag', mouseDragCallback);
            $(element).off('CornerstoneToolsMouseUp', mouseUpCallback);
            $(element).off('CornerstoneToolsMouseClick', mouseUpCallback);

            // If any handle is outside the image, delete the tool data
            if (options.deleteIfHandleOutsideImage === true) {
                var image = eventData.image;
                var handleOutsideImage = false;
                var rect = {
                    top: 0,
                    left: 0,
                    width: image.width,
                    height: image.height
                };
                
                Object.keys(data.handles).forEach(function(name) {
                    var handle = data.handles[name];
                    handle.active = false;
                    if (cornerstoneMath.point.insideRect(handle, rect) === false) {
                        handleOutsideImage = true;
                        return false;
                    }
                });

                if (handleOutsideImage) {
                    // find this tool data
                    var indexOfData = -1;
                    toolData.data.forEach(function(thisToolData, index) {
                        if (thisToolData === data) {
                            indexOfData = index;
                            return false;
                        }
                    });

                    if (indexOfData !== -1) {
                        toolData.data.splice(indexOfData, 1);
                    }
                }
            }

            cornerstone.updateImage(element);

            if (typeof doneMovingCallback === 'function') {
                doneMovingCallback();
            }
        }

        $(element).on('CornerstoneToolsMouseUp', mouseUpCallback);
        $(element).on('CornerstoneToolsMouseClick', mouseUpCallback);
        return true;
    }

    // module/private exports
    cornerstoneTools.moveAllHandles = moveAllHandles;

})($, cornerstone, cornerstoneMath, cornerstoneTools);
 
// End Source; src/manipulators/moveAllHandles.js

// Begin Source: src/manipulators/moveHandle.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    function moveHandle(mouseEventData, toolType, data, handle, doneMovingCallback, preventHandleOutsideImage) {
        var element = mouseEventData.element;
        var distanceFromTool = {
            x: handle.x - mouseEventData.currentPoints.image.x,
            y: handle.y - mouseEventData.currentPoints.image.y
        };

        function mouseDragCallback(e, eventData) {
            handle.active = true;
            handle.x = eventData.currentPoints.image.x + distanceFromTool.x;
            handle.y = eventData.currentPoints.image.y + distanceFromTool.y;

            if (preventHandleOutsideImage) {
                handle.x = Math.max(handle.x, 0);
                handle.x = Math.min(handle.x, eventData.image.width);

                handle.y = Math.max(handle.y, 0);
                handle.y = Math.min(handle.y, eventData.image.height);
            }

            cornerstone.updateImage(element);

            var eventType = 'CornerstoneToolsMeasurementModified';
            var modifiedEventData = {
                toolType: toolType,
                element: element,
                measurementData: data
            };
            $(element).trigger(eventType, modifiedEventData);
        }

        $(element).on('CornerstoneToolsMouseDrag', mouseDragCallback);

        function mouseUpCallback() {
            handle.active = false;
            $(element).off('CornerstoneToolsMouseDrag', mouseDragCallback);
            $(element).off('CornerstoneToolsMouseUp', mouseUpCallback);
            $(element).off('CornerstoneToolsMouseClick', mouseUpCallback);
            cornerstone.updateImage(element);

            if (typeof doneMovingCallback === 'function') {
                doneMovingCallback();
            }
        }

        $(element).on('CornerstoneToolsMouseUp', mouseUpCallback);
        $(element).on('CornerstoneToolsMouseClick', mouseUpCallback);
    }

    // module/private exports
    cornerstoneTools.moveHandle = moveHandle;

})($, cornerstone, cornerstoneTools);
 
// End Source; src/manipulators/moveHandle.js

// Begin Source: src/manipulators/moveNewHandle.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    function moveNewHandle(mouseEventData, toolType, data, handle, doneMovingCallback, preventHandleOutsideImage) {
        var element = mouseEventData.element;

        function moveCallback(e, eventData) {
            handle.active = true;
            handle.x = eventData.currentPoints.image.x;
            handle.y = eventData.currentPoints.image.y;
            
            if (preventHandleOutsideImage) {
                handle.x = Math.max(handle.x, 0);
                handle.x = Math.min(handle.x, eventData.image.width);

                handle.y = Math.max(handle.y, 0);
                handle.y = Math.min(handle.y, eventData.image.height);
            }

            cornerstone.updateImage(element);

            var eventType = 'CornerstoneToolsMeasurementModified';
            var modifiedEventData = {
                toolType: toolType,
                element: element,
                measurementData: data
            };
            $(element).trigger(eventType, modifiedEventData);
        }

        function whichMovement(e) {
            $(element).off('CornerstoneToolsMouseMove');
            $(element).off('CornerstoneToolsMouseDrag');

            $(element).on('CornerstoneToolsMouseMove', moveCallback);
            $(element).on('CornerstoneToolsMouseDrag', moveCallback);
            
            $(element).on('CornerstoneToolsMouseClick', moveEndCallback);
            if (e.type === 'CornerstoneToolsMouseDrag') {
                $(element).on('CornerstoneToolsMouseUp', moveEndCallback);
            }
        }

        $(element).on('CornerstoneToolsMouseDrag', whichMovement);
        $(element).on('CornerstoneToolsMouseMove', whichMovement);
        
        function moveEndCallback() {
            $(element).off('CornerstoneToolsMouseMove', moveCallback);
            $(element).off('CornerstoneToolsMouseDrag', moveCallback);
            $(element).off('CornerstoneToolsMouseClick', moveEndCallback);
            $(element).off('CornerstoneToolsMouseUp', moveEndCallback);

            handle.active = false;
            cornerstone.updateImage(element);

            if (typeof doneMovingCallback === 'function') {
                doneMovingCallback();
            }
        }
    }

    // module/private exports
    cornerstoneTools.moveNewHandle = moveNewHandle;

})($, cornerstone, cornerstoneTools);
 
// End Source; src/manipulators/moveNewHandle.js

// Begin Source: src/manipulators/moveNewHandleTouch.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    function moveNewHandleTouch(eventData, toolType, data, handle, doneMovingCallback, preventHandleOutsideImage) {
        var element = eventData.element;
        var imageCoords = cornerstone.pageToPixel(element, eventData.currentPoints.page.x, eventData.currentPoints.page.y + 50);
        var distanceFromTouch = {
            x: handle.x - imageCoords.x,
            y: handle.y - imageCoords.y
        };

        function moveCallback(e, eventData) {
            handle.active = true;
            handle.x = eventData.currentPoints.image.x + distanceFromTouch.x;
            handle.y = eventData.currentPoints.image.y + distanceFromTouch.y;
            
            if (preventHandleOutsideImage) {
                handle.x = Math.max(handle.x, 0);
                handle.x = Math.min(handle.x, eventData.image.width);

                handle.y = Math.max(handle.y, 0);
                handle.y = Math.min(handle.y, eventData.image.height);
            }

            cornerstone.updateImage(element);

            var eventType = 'CornerstoneToolsMeasurementModified';
            var modifiedEventData = {
                toolType: toolType,
                element: element,
                measurementData: data
            };
            $(element).trigger(eventType, modifiedEventData);
        }
        
        function moveEndCallback(e, eventData) {
            $(element).off('CornerstoneToolsTouchDrag', moveCallback);
            $(element).off('CornerstoneToolsTouchPinch', moveEndCallback);
            $(element).off('CornerstoneToolsTouchPress', moveEndCallback);
            $(element).off('CornerstoneToolsTouchEnd', moveEndCallback);
            $(element).off('CornerstoneToolsDragEnd', moveEndCallback);
            $(element).off('CornerstoneToolsTap', moveEndCallback);

            if (e.type === 'CornerstoneToolsTouchPinch' || e.type === 'CornerstoneToolsTouchPress') {
                handle.active = false;
                cornerstone.updateImage(element);
                doneMovingCallback();
                return;
            }

            handle.active = false;
            handle.x = eventData.currentPoints.image.x + distanceFromTouch.x;
            handle.y = eventData.currentPoints.image.y + distanceFromTouch.y;
            
            if (preventHandleOutsideImage) {
                handle.x = Math.max(handle.x, 0);
                handle.x = Math.min(handle.x, eventData.image.width);

                handle.y = Math.max(handle.y, 0);
                handle.y = Math.min(handle.y, eventData.image.height);
            }

            cornerstone.updateImage(element);

            if (typeof doneMovingCallback === 'function') {
                doneMovingCallback();
            }
        }

        $(element).on('CornerstoneToolsTouchDrag', moveCallback);
        $(element).on('CornerstoneToolsTouchPinch', moveEndCallback);
        $(element).on('CornerstoneToolsTouchPress', moveEndCallback);
        $(element).on('CornerstoneToolsTouchEnd', moveEndCallback);
        $(element).on('CornerstoneToolsDragEnd', moveEndCallback);
        $(element).on('CornerstoneToolsTap', moveEndCallback);
    }

    // module/private exports
    cornerstoneTools.moveNewHandleTouch = moveNewHandleTouch;

})($, cornerstone, cornerstoneTools);
 
// End Source; src/manipulators/moveNewHandleTouch.js

// Begin Source: src/manipulators/touchMoveAllHandles.js
(function($, cornerstone, cornerstoneMath, cornerstoneTools) {

    'use strict';

    function touchMoveAllHandles(touchEventData, data, toolData, toolType, deleteIfHandleOutsideImage, doneMovingCallback) {
        //console.log('touchMoveAllHandles');
        var element = touchEventData.element;

        function touchDragCallback(e, eventData) {
            //console.log('touchMoveAllHandles touchDragCallback');
            data.active = true;
            
            Object.keys(data.handles).forEach(function(name) {
                var handle = data.handles[name];
                if (handle.movesIndependently === true) {
                    return;
                }
                
                handle.x += eventData.deltaPoints.image.x;
                handle.y += eventData.deltaPoints.image.y;
            });
            cornerstone.updateImage(element);

            var eventType = 'CornerstoneToolsMeasurementModified';
            var modifiedEventData = {
                toolType: toolType,
                element: element,
                measurementData: data
            };
            $(element).trigger(eventType, modifiedEventData);

            return false; // false = causes jquery to preventDefault() and stopPropagation() this event
        }

        $(element).on('CornerstoneToolsTouchDrag', touchDragCallback);

        function touchEndCallback(e, eventData) {
            //console.log('touchMoveAllHandles touchEndCallback');
            data.active = false;
            data.invalidated = false;

            $(element).off('CornerstoneToolsTouchDrag', touchDragCallback);
            $(element).off('CornerstoneToolsTouchPinch', touchEndCallback);
            $(element).off('CornerstoneToolsTouchPress', touchEndCallback);
            $(element).off('CornerstoneToolsTouchEnd', touchEndCallback);
            $(element).off('CornerstoneToolsDragEnd', touchEndCallback);
            $(element).off('CornerstoneToolsTap', touchEndCallback);

            // If any handle is outside the image, delete the tool data
            if (deleteIfHandleOutsideImage === true) {
                var image = eventData.image;
                var handleOutsideImage = false;
                var rect = {
                    top: 0,
                    left: 0,
                    width: image.width,
                    height: image.height
                };
                
                Object.keys(data.handles).forEach(function(name) {
                    var handle = data.handles[name];
                    if (cornerstoneMath.point.insideRect(handle, rect) === false) {
                        handleOutsideImage = true;
                        return;
                    }
                });

                if (handleOutsideImage) {
                    // find this tool data
                    var indexOfData = -1;
                    for (var i = 0; i < toolData.data.length; i++) {
                        if (toolData.data[i] === data) {
                            indexOfData = i;
                        }
                    }

                    if (indexOfData !== -1) {
                        toolData.data.splice(indexOfData, 1);
                    }
                }
            }

            if (typeof doneMovingCallback === 'function') {
                doneMovingCallback();
            }

            cornerstone.updateImage(element);
        }

        $(element).on('CornerstoneToolsTouchPinch', touchEndCallback);
        $(element).on('CornerstoneToolsTouchPress', touchEndCallback);
        $(element).on('CornerstoneToolsTouchEnd', touchEndCallback);
        $(element).on('CornerstoneToolsDragEnd', touchEndCallback);
        $(element).on('CornerstoneToolsTap', touchEndCallback);
        return true;
    }

    // module/private exports
    cornerstoneTools.touchMoveAllHandles = touchMoveAllHandles;

})($, cornerstone, cornerstoneMath, cornerstoneTools);
 
// End Source; src/manipulators/touchMoveAllHandles.js

// Begin Source: src/manipulators/touchMoveHandle.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    function touchMoveHandle(touchEventData, toolType, data, handle, doneMovingCallback) {
        //console.log('touchMoveHandle');
        var element = touchEventData.element;
        var distanceFromTouch = {
            x: handle.x - touchEventData.currentPoints.image.x,
            y: handle.y - touchEventData.currentPoints.image.y
        };

        function touchDragCallback(e, eventData) {
            handle.active = true;
            var touchMoveData = eventData;
            handle.x = touchMoveData.currentPoints.image.x + distanceFromTouch.x;
            handle.y = touchMoveData.currentPoints.image.y + distanceFromTouch.y;
            cornerstone.updateImage(element);

            var eventType = 'CornerstoneToolsMeasurementModified';
            var modifiedEventData = {
                toolType: toolType,
                element: element,
                measurementData: data
            };
            $(element).trigger(eventType, modifiedEventData);
        }

        $(element).on('CornerstoneToolsTouchDrag', touchDragCallback);

        function touchEndCallback() {
            handle.active = false;
            $(element).off('CornerstoneToolsTouchDrag', touchDragCallback);
            $(element).off('CornerstoneToolsTouchPinch', touchEndCallback);
            $(element).off('CornerstoneToolsTouchPress', touchEndCallback);
            $(element).off('CornerstoneToolsTouchEnd', touchEndCallback);
            $(element).off('CornerstoneToolsDragEnd', touchEndCallback);
            $(element).off('CornerstoneToolsTap', touchEndCallback);
            cornerstone.updateImage(element);

            if (typeof doneMovingCallback === 'function') {
                doneMovingCallback();
            }
        }

        $(element).on('CornerstoneToolsTouchPinch', touchEndCallback);
        $(element).on('CornerstoneToolsTouchPress', touchEndCallback);
        $(element).on('CornerstoneToolsTouchEnd', touchEndCallback);
        $(element).on('CornerstoneToolsDragEnd', touchEndCallback);
        $(element).on('CornerstoneToolsTap', touchEndCallback);
    }

    // module/private exports
    cornerstoneTools.touchMoveHandle = touchMoveHandle;

})($, cornerstone, cornerstoneTools);
 
// End Source; src/manipulators/touchMoveHandle.js

// Begin Source: src/measurementManager/lineSample.js
(function($, cornerstoneTools) {

    'use strict';

    // This object manages a collection of measurements
    function LineSampleMeasurement() {

        var that = this;
        that.samples = [];

        // adds an element as both a source and a target
        this.set = function(samples) {
            that.samples = samples;
            // fire event
            $(that).trigger('CornerstoneLineSampleUpdated');
        };
    }

    // module/private exports
    cornerstoneTools.LineSampleMeasurement = LineSampleMeasurement;

})($, cornerstoneTools);
 
// End Source; src/measurementManager/lineSample.js

// Begin Source: src/measurementManager/measurementManager.js
(function($, cornerstoneTools) {

    'use strict';

    // This object manages a collection of measurements
    function MeasurementManager() {

        var that = this;
        that.measurements = [];

        // adds an element as both a source and a target
        this.add = function(measurement) {
            var index = that.measurements.push(measurement);
            // fire event
            var eventDetail = {
                index: index,
                measurement: measurement
            };
            $(that).trigger('CornerstoneMeasurementAdded', eventDetail);
        };

        this.remove = function(index) {
            var measurement = that.measurements[index];
            that.measurements.splice(index, 1);
            // fire event
            var eventDetail = {
                index: index,
                measurement: measurement
            };
            $(that).trigger('CornerstoneMeasurementRemoved', eventDetail);
        };

    }

    // module/private exports
    cornerstoneTools.MeasurementManager = new MeasurementManager();

})($, cornerstoneTools);
 
// End Source; src/measurementManager/measurementManager.js

// Begin Source: src/metaData.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    // this module defines a way for tools to access various metadata about an imageId.  This layer of abstraction exists
    // so metadata can be provided to the tools in different ways (e.g. by parsing DICOM P10 or by a WADO-RS document)
    // NOTE: We may want to push this function down into the cornerstone core library, not sure yet...

    var providers = [];

    function addProvider( provider) {
        providers.push(provider);
    }

    function removeProvider( provider) {
        var index = providers.indexOf(provider);
        if (index === -1) {
            return;
        }

        providers.splice(index, 1);
    }

    function getMetaData(type, imageId) {
        var result;
        $.each(providers, function(index, provider) {
            result = provider(type, imageId);
            if (result !== undefined) {
                return true;
            }
        });
        return result;
    }

    // module/private exports
    cornerstoneTools.metaData = {
        addProvider: addProvider,
        removeProvider: removeProvider,
        get: getMetaData
    };

})($, cornerstone, cornerstoneTools);
 
// End Source; src/metaData.js

// Begin Source: src/orientation/getOrientationString.js
(function(cornerstoneMath, cornerstoneTools) {

    'use strict';

    function getOrientationString(vector) {
        // Thanks to David Clunie
        // https://sites.google.com/site/dicomnotes/

        var orientation = '',
            orientationX = vector.x < 0 ? 'R' : 'L',
            orientationY = vector.y < 0 ? 'A' : 'P',
            orientationZ = vector.z < 0 ? 'F' : 'H';

        // Should probably make this a function vector3.abs
        var abs = new cornerstoneMath.Vector3(Math.abs(vector.x), Math.abs(vector.y), Math.abs(vector.z));

        for (var i = 0; i < 3; i++) {
            if (abs.x > 0.0001 && abs.x > abs.y && abs.x > abs.z) {
                orientation += orientationX;
                abs.x = 0;
            } else if (abs.y > 0.0001 && abs.y > abs.x && abs.y > abs.z) {
                orientation += orientationY;
                abs.y = 0;
            } else if (abs.z > 0.0001 && abs.z > abs.x && abs.z > abs.y) {
                orientation += orientationZ;
                abs.z = 0;
            } else {
                break;
            }
        }

        return orientation;
    }

    // module/private exports
    cornerstoneTools.orientation.getOrientationString = getOrientationString;

})(cornerstoneMath, cornerstoneTools);
 
// End Source; src/orientation/getOrientationString.js

// Begin Source: src/orientation/invertOrientationString.js
(function(cornerstoneTools) {

    'use strict';

    function invertOrientationString(string) {
        var inverted = string.replace('H', 'f');
        inverted = inverted.replace('F', 'h');
        inverted = inverted.replace('R', 'l');
        inverted = inverted.replace('L', 'r');
        inverted = inverted.replace('A', 'p');
        inverted = inverted.replace('P', 'a');
        inverted = inverted.toUpperCase();
        return inverted;
    }

    // module/private exports
    cornerstoneTools.orientation.invertOrientationString = invertOrientationString;

})(cornerstoneTools);
 
// End Source; src/orientation/invertOrientationString.js

// Begin Source: src/referenceLines/calculateReferenceLine.js
(function(cornerstoneTools) {

    'use strict';

    // calculates a reference line between two planes by projecting the top left hand corner and bottom right hand corner
    // of the reference image onto the target image.  Ideally we would calculate the intersection between the planes but
    // that requires a bit more math and this works fine for most cases
    function calculateReferenceLine(targetImagePlane, referenceImagePlane) {
        var points = cornerstoneTools.planePlaneIntersection(targetImagePlane, referenceImagePlane);
        if (!points) {
            return;
        }

        return {
            start: cornerstoneTools.projectPatientPointToImagePlane(points.start, targetImagePlane),
            end: cornerstoneTools.projectPatientPointToImagePlane(points.end, targetImagePlane)
        };
    }

    // module/private exports
    cornerstoneTools.referenceLines.calculateReferenceLine = calculateReferenceLine;

})(cornerstoneTools);
 
// End Source; src/referenceLines/calculateReferenceLine.js

// Begin Source: src/referenceLines/referenceLinesTool.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    var toolType = 'referenceLines';

    function onImageRendered(e, eventData) {
        // if we have no toolData for this element, return immediately as there is nothing to do
        var toolData = cornerstoneTools.getToolState(e.currentTarget, toolType);
        if (toolData === undefined) {
            return;
        }

        // Get the enabled elements associated with this synchronization context and draw them
        var syncContext = toolData.data[0].synchronizationContext;
        var enabledElements = syncContext.getSourceElements();

        var renderer = toolData.data[0].renderer;

        // Create the canvas context and reset it to the pixel coordinate system
        var context = eventData.canvasContext.canvas.getContext('2d');
        cornerstone.setToPixelCoordinateSystem(eventData.enabledElement, context);

        // Iterate over each referenced element
        $.each(enabledElements, function(index, referenceEnabledElement) {

            // don't draw ourselves
            if (referenceEnabledElement === e.currentTarget) {
                return;
            }

            // render it
            renderer(context, eventData, e.currentTarget, referenceEnabledElement);
        });
    }

    // enables the reference line tool for a given element.  Note that a custom renderer
    // can be provided if you want different rendering (e.g. all reference lines, first/last/active, etc)
    function enable(element, synchronizationContext, renderer) {
        renderer = renderer || cornerstoneTools.referenceLines.renderActiveReferenceLine;

        cornerstoneTools.addToolState(element, toolType, {
            synchronizationContext: synchronizationContext,
            renderer: renderer
        });
        $(element).on('CornerstoneImageRendered', onImageRendered);
        cornerstone.updateImage(element);
    }

    // disables the reference line tool for the given element
    function disable(element) {
        $(element).off('CornerstoneImageRendered', onImageRendered);
        cornerstone.updateImage(element);
    }

    // module/private exports
    cornerstoneTools.referenceLines.tool = {
        enable: enable,
        disable: disable

    };

})($, cornerstone, cornerstoneTools);
 
// End Source; src/referenceLines/referenceLinesTool.js

// Begin Source: src/referenceLines/renderActiveReferenceLine.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    // renders the active reference line
    function renderActiveReferenceLine(context, eventData, targetElement, referenceElement) {
        var targetImage = cornerstone.getEnabledElement(targetElement).image;
        var referenceImage = cornerstone.getEnabledElement(referenceElement).image;

        // make sure the images are actually loaded for the target and reference
        if (!targetImage || !referenceImage) {
            return;
        }

        var targetImagePlane = cornerstoneTools.metaData.get('imagePlane', targetImage.imageId);
        var referenceImagePlane = cornerstoneTools.metaData.get('imagePlane', referenceImage.imageId);

        // Make sure the target and reference actually have image plane metadata
        if (!targetImagePlane || !referenceImagePlane) {
            return;
        }

        // the image planes must be in the same frame of reference
        if (targetImagePlane.frameOfReferenceUID !== referenceImagePlane.frameOfReferenceUID) {
            return;
        }

        // the image plane normals must be > 30 degrees apart
        var targetNormal = targetImagePlane.rowCosines.clone().cross(targetImagePlane.columnCosines);
        var referenceNormal = referenceImagePlane.rowCosines.clone().cross(referenceImagePlane.columnCosines);
        var angleInRadians = targetNormal.angleTo(referenceNormal);

        angleInRadians = Math.abs(angleInRadians);
        if (angleInRadians < 0.5) { // 0.5 radians = ~30 degrees
            return;
        }

        var referenceLine = cornerstoneTools.referenceLines.calculateReferenceLine(targetImagePlane, referenceImagePlane);
        if (!referenceLine) {
            return;
        }

        var refLineStartCanvas = cornerstone.pixelToCanvas(eventData.element, referenceLine.start);
        var refLineEndCanvas = cornerstone.pixelToCanvas(eventData.element, referenceLine.end);

        var color = cornerstoneTools.toolColors.getActiveColor();
        var lineWidth = cornerstoneTools.toolStyle.getToolWidth();

        // draw the referenceLines
        context.setTransform(1, 0, 0, 1, 0, 0);

        context.save();
        context.beginPath();
        context.strokeStyle = color;
        context.lineWidth = lineWidth;
        context.moveTo(refLineStartCanvas.x, refLineStartCanvas.y);
        context.lineTo(refLineEndCanvas.x, refLineEndCanvas.y);
        context.stroke();
        context.restore();
    }

    // module/private exports
    cornerstoneTools.referenceLines.renderActiveReferenceLine = renderActiveReferenceLine;

})($, cornerstone, cornerstoneTools);
 
// End Source; src/referenceLines/renderActiveReferenceLine.js

// Begin Source: src/requestPool/requestPoolManager.js
(function(cornerstone, cornerstoneTools) {

    'use strict';

    var requestPool = {
        interaction: [],
        thumbnail: [],
        prefetch: []
    };

    var numRequests = {
        interaction: 0,
        thumbnail: 0,
        prefetch: 0
    };

    var maxNumRequests = {
        interaction: 6,
        thumbnail: 6,
        prefetch: 5
    };
    
    var lastElementInteracted;
    var awake = false;
    var grabDelay = 20;

    function requestPoolManager() {

        function addRequest(element, imageId, type, doneCallback, failCallback) {
            if (!requestPool.hasOwnProperty(type)) {
                throw 'Request type must be one of interaction, thumbnail, or prefetch';
            }

            if (!element || !imageId) {
                return;
            }

            // Describe the request
            var requestDetails = {
                type: type,
                imageId: imageId,
                doneCallback: doneCallback,
                failCallback: failCallback
            };

            // If this imageId is in the cache, resolve it immediately
            var imagePromise = cornerstone.imageCache.getImagePromise(imageId);
            if (imagePromise) {
                imagePromise.then(function(image) {
                    doneCallback(image);
                }, function(error) {
                    failCallback(error);
                });
                return;
            }

            // Add it to the end of the stack
            requestPool[type].push(requestDetails);

            // Store the last element interacted with,
            // So we know which images to prefetch
            //
            // ---- Not used for now ----
            if (type === 'interaction') {
                lastElementInteracted = element;
            }
        }

        function clearRequestStack(type) {
            //console.log('clearRequestStack');
            if (!requestPool.hasOwnProperty(type)) {
                throw 'Request type must be one of interaction, thumbnail, or prefetch';
            }

            requestPool[type] = [];
        }

        function startAgain() {
            if (!awake) {
                return;
            }

            setTimeout(function() {
                var requestDetails = getNextRequest();
                if (!requestDetails) {
                    awake = false;
                    return;
                }

                sendRequest(requestDetails);
            }, grabDelay);
        }

        function sendRequest(requestDetails) {
            // Increment the number of current requests of this type
            var type = requestDetails.type;
            numRequests[type]++;

            awake = true;
            var imageId = requestDetails.imageId;
            var doneCallback = requestDetails.doneCallback;
            var failCallback = requestDetails.failCallback;
            
            // Check if we already have this image promise in the cache
            var imagePromise = cornerstone.imageCache.getImagePromise(imageId);
            if (imagePromise) {
                // If we do, remove from list (when resolved, as we could have
                // pending prefetch requests) and stop processing this iteration
                imagePromise.then(function(image) {
                    numRequests[type]--;
                    // console.log(numRequests);

                    doneCallback(image);
                    startAgain();
                }, function(error) {
                    numRequests[type]--;
                    // console.log(numRequests);
                    failCallback(error);
                });
                return;
            }

            // Load and cache the image
            cornerstone.loadAndCacheImage(imageId).then(function(image) {
                numRequests[type]--;
                // console.log(numRequests);
                doneCallback(image);
                startAgain();
            }, function(error) {
                numRequests[type]--;
                // console.log(numRequests);
                failCallback(error);
            });
        }

        function startGrabbing() {
            // Begin by grabbing X images
            if (awake) {
                return;
            }

            var maxSimultaneousRequests = cornerstoneTools.getMaxSimultaneousRequests();
            
            maxNumRequests = {
                interaction: maxSimultaneousRequests,
                thumbnail: maxSimultaneousRequests - 2,
                prefetch: maxSimultaneousRequests - 1
            };

            for (var i = 0; i < maxSimultaneousRequests; i++) {
                var requestDetails = getNextRequest();
                if (requestDetails) {
                    sendRequest(requestDetails);
                }
            }

            //console.log("startGrabbing");
            //console.log(requestPool);
        }

        function getNextRequest() {
            if (requestPool.interaction.length && numRequests.interaction < maxNumRequests.interaction) {
                return requestPool.interaction.shift();
            }

            if (requestPool.thumbnail.length && numRequests.thumbnail < maxNumRequests.thumbnail) {
                return requestPool.thumbnail.shift();
            }

            if (requestPool.prefetch.length && numRequests.prefetch < maxNumRequests.prefetch) {
                return requestPool.prefetch.shift();
            }

            if (!requestPool.interaction.length &&
                !requestPool.thumbnail.length &&
                !requestPool.prefetch.length) {
                awake = false;
            }

            return false;
        }

        function getRequestPool() {
            return requestPool;
        }

        var requestManager = {
            addRequest: addRequest,
            clearRequestStack: clearRequestStack,
            startGrabbing: startGrabbing,
            getRequestPool: getRequestPool
        };

        return requestManager;
    }

    // module/private exports
    cornerstoneTools.requestPoolManager = requestPoolManager();

})(cornerstone, cornerstoneTools);
 
// End Source; src/requestPool/requestPoolManager.js

// Begin Source: src/stackTools/playClip.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    var toolType = 'playClip';

    /**
     * Starts playing a clip or adjusts the frame rate of an already playing clip.  framesPerSecond is
     * optional and defaults to 30 if not specified.  A negative framesPerSecond will play the clip in reverse.
     * The element must be a stack of images
     * @param element
     * @param framesPerSecond
     */
    function playClip(element, framesPerSecond) {
        if (element === undefined) {
            throw 'playClip: element must not be undefined';
        }

        if (framesPerSecond === undefined) {
            framesPerSecond = 30;
        }

        var stackToolData = cornerstoneTools.getToolState(element, 'stack');
        if (stackToolData === undefined || stackToolData.data === undefined || stackToolData.data.length === 0) {
            return;
        }

        var stackData = stackToolData.data[0];

        var playClipToolData = cornerstoneTools.getToolState(element, toolType);
        var playClipData;
        
        if (playClipToolData === undefined || playClipToolData.data.length === 0) {
            playClipData = {
                intervalId: undefined,
                framesPerSecond: framesPerSecond,
                lastFrameTimeStamp: undefined,
                frameRate: 0,
                loop: true
            };
            cornerstoneTools.addToolState(element, toolType, playClipData);
        } else {
            playClipData = playClipToolData.data[0];
            playClipData.framesPerSecond = framesPerSecond;
        }

        // if already playing, do not set a new interval
        if (playClipData.intervalId !== undefined) {
            return;
        }

        playClipData.intervalId = setInterval(function() {

            var newImageIdIndex = stackData.currentImageIdIndex;

            if (playClipData.framesPerSecond > 0) {
                newImageIdIndex++;
            } else {
                newImageIdIndex--;
            }

            if (!playClipData.loop && (newImageIdIndex >= stackData.imageIds.length || newImageIdIndex < 0)) {
                
                var eventDetail = {
                    element: element
                };
                var event = $.Event('CornerstoneToolsClipStopped', eventDetail);
                $(element).trigger(event, eventDetail);

                clearInterval(playClipData.intervalId);
                playClipData.intervalId = undefined;
                return;
            }

            // loop around if we go outside the stack
            if (newImageIdIndex >= stackData.imageIds.length) {
                newImageIdIndex = 0;
            }

            if (newImageIdIndex < 0) {
                newImageIdIndex = stackData.imageIds.length - 1;
            }

            if (newImageIdIndex !== stackData.currentImageIdIndex) {
                var startLoadingHandler = cornerstoneTools.loadHandlerManager.getStartLoadHandler();
                var endLoadingHandler = cornerstoneTools.loadHandlerManager.getEndLoadHandler();
                var errorLoadingHandler = cornerstoneTools.loadHandlerManager.getErrorLoadingHandler();

                if (startLoadingHandler) {
                    startLoadingHandler(element);
                }

                var viewport = cornerstone.getViewport(element);
                cornerstone.loadAndCacheImage(stackData.imageIds[newImageIdIndex]).then(function(image) {
                    stackData.currentImageIdIndex = newImageIdIndex;
                    cornerstone.displayImage(element, image, viewport);
                    if (endLoadingHandler) {
                        endLoadingHandler(element);
                    }
                }, function(error) {
                    var imageId = stackData.imageIds[newImageIdIndex];
                    if (errorLoadingHandler) {
                        errorLoadingHandler(element, imageId, error);
                    }
                });
            }
        }, 1000 / Math.abs(playClipData.framesPerSecond));
    }

    /**
     * Stops an already playing clip.
     * * @param element
     */
    function stopClip(element) {
        var playClipToolData = cornerstoneTools.getToolState(element, toolType);
        var playClipData;
        if (playClipToolData === undefined || playClipToolData.data.length === 0) {
            return;
        } else {
            playClipData = playClipToolData.data[0];
        }

        clearInterval(playClipData.intervalId);
        playClipData.intervalId = undefined;
    }

    // module/private exports
    cornerstoneTools.playClip = playClip;
    cornerstoneTools.stopClip = stopClip;

})($, cornerstone, cornerstoneTools);
 
// End Source; src/stackTools/playClip.js

// Begin Source: src/stackTools/scrollIndicator.js
/*
Display scroll progress bar across bottom of image.
 */
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    var scrollBarHeight = 6;

    var configuration = {
        backgroundColor: 'rgb(19, 63, 141)',
        fillColor: 'white'
    };

    function onImageRendered(e, eventData){
        var element = eventData.element;
        var width = eventData.enabledElement.canvas.width;
        var height = eventData.enabledElement.canvas.height;

        if (!width || !height) {
            return false;
        }

        var context = eventData.enabledElement.canvas.getContext('2d');
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.save();

        var config = cornerstoneTools.scrollIndicator.getConfiguration();

        // draw indicator background
        context.fillStyle = config.backgroundColor;
        context.fillRect(0, height - scrollBarHeight, width, scrollBarHeight);

        // get current image index
        var stackData = cornerstoneTools.getToolState(element, 'stack');
        if (!stackData || !stackData.data || !stackData.data.length) {
            return;
        }

        var imageIds = stackData.data[0].imageIds;
        var currentImageIdIndex = stackData.data[0].currentImageIdIndex;

        // draw current image cursor
        var cursorWidth = width / imageIds.length;
        var xPosition = cursorWidth * currentImageIdIndex;

        context.fillStyle = config.fillColor;
        context.fillRect(xPosition, height - scrollBarHeight, cursorWidth, scrollBarHeight);

        context.restore();
    }

    cornerstoneTools.scrollIndicator = cornerstoneTools.displayTool(onImageRendered);
    cornerstoneTools.scrollIndicator.setConfiguration(configuration);

})($, cornerstone, cornerstoneTools);
 
// End Source; src/stackTools/scrollIndicator.js

// Begin Source: src/stackTools/stackPrefetch.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    var toolType = 'stackPrefetch';
    var requestType = 'prefetch';

    var configuration = {};

    var resetPrefetchTimeout,
        resetPrefetchDelay;

    function sortNumber(a, b) {
        // http://stackoverflow.com/questions/1063007/how-to-sort-an-array-of-integers-correctly
        return a - b;
    }

    function range(lowEnd, highEnd) {
        // Javascript version of Python's range function
        // http://stackoverflow.com/questions/3895478/does-javascript-have-a-method-like-range-to-generate-an-array-based-on-suppl
        lowEnd = Math.round(lowEnd) || 0;
        highEnd = Math.round(highEnd) || 0;

        var arr = [],
            c = highEnd - lowEnd + 1;

        if (c <= 0) {
            return arr;
        }

        while ( c-- ) {
            arr[c] = highEnd--;
        }

        return arr;
    }

    var max = function(arr) {
        return Math.max.apply(null, arr);
    };

    var min = function(arr) {
        return Math.min.apply(null, arr);
    };

    function nearestIndex(arr, x) {
        // Return index of nearest values in array
        // http://stackoverflow.com/questions/25854212/return-index-of-nearest-values-in-an-array        
        var l = [],
            h = [];

        arr.forEach(function(v) {
            if (v < x) {
                l.push(v);
            } else if (v > x) {
                h.push(v);
            }
        });
       
        return {
            low: arr.indexOf(max(l)),
            high: arr.indexOf(min(h))
        };
    }

    function prefetch(element) {
        // Check to make sure stack data exists
        var stackData = cornerstoneTools.getToolState(element, 'stack');
        if (!stackData || !stackData.data || !stackData.data.length) {
            return;
        }

        var stack = stackData.data[0];

        // Get the stackPrefetch tool data
        var stackPrefetchData = cornerstoneTools.getToolState(element, toolType);
        if (!stackPrefetchData) {
            return;
        }

        var stackPrefetch = stackPrefetchData.data[0];

        // If all the requests are complete, disable the stackPrefetch tool
        if (!stackPrefetch || !stackPrefetch.indicesToRequest || !stackPrefetch.indicesToRequest.length) {
            stackPrefetch.enabled = false;
        }

        // Make sure the tool is still enabled
        if (stackPrefetch.enabled === false) {
            return;
        }

        // Remove an imageIdIndex from the list of indices to request
        // This fires when the individual image loading deferred is resolved        
        function removeFromList(imageIdIndex) {
            var index = stackPrefetch.indicesToRequest.indexOf(imageIdIndex);
            if (index > -1) { // don't remove last element if imageIdIndex not found
                stackPrefetch.indicesToRequest.splice(index, 1);
            }
        }
        
        // Remove all already cached images from the
        // indicesToRequest array
        stackPrefetchData.data[0].indicesToRequest.sort(sortNumber);
        var indicesToRequestCopy = stackPrefetch.indicesToRequest.slice();

        indicesToRequestCopy.forEach(function(imageIdIndex) {
            var imageId = stack.imageIds[imageIdIndex];

            if (!imageId) {
                return;
            }

            var imagePromise = cornerstone.imageCache.getImagePromise(imageId);
            if (imagePromise && imagePromise.state() === 'resolved'){
                removeFromList(imageIdIndex);
            }
        });

        // Stop here if there are no images left to request
        // After those in the cache have been removed
        if (!stackPrefetch.indicesToRequest.length) {
            return;
        }

        function doneCallback(image) {
            //console.log('prefetch done: ' + image.imageId);
            var imageIdIndex = stack.imageIds.indexOf(image.imageId);
            removeFromList(imageIdIndex);
        }

        function failCallback(error) {
            console.log('prefetch errored: ' + error);
        }

        // Clear the requestPool of prefetch requests
        var requestPoolManager = cornerstoneTools.requestPoolManager;
        requestPoolManager.clearRequestStack(requestType);

        // Identify the nearest imageIdIndex to the currentImageIdIndex 
        var nearest = nearestIndex(stackPrefetch.indicesToRequest, stack.currentImageIdIndex);

        var imageId,
            nextImageIdIndex;

        // Prefetch images around the current image (before and after)
        var lowerIndex = nearest.low;
        var higherIndex = nearest.high;
        while (lowerIndex > 0 || higherIndex < stackPrefetch.indicesToRequest.length) {
            if (lowerIndex >= 0 ) {
                nextImageIdIndex = stackPrefetch.indicesToRequest[lowerIndex--];
                imageId = stack.imageIds[nextImageIdIndex];
                requestPoolManager.addRequest(element, imageId, requestType, doneCallback, failCallback);
            }

            if (higherIndex < stackPrefetch.indicesToRequest.length) {
                nextImageIdIndex = stackPrefetch.indicesToRequest[higherIndex++];
                imageId = stack.imageIds[nextImageIdIndex];
                requestPoolManager.addRequest(element, imageId, requestType, doneCallback, failCallback);
            }
        }

        // Try to start the requestPool's grabbing procedure
        // in case it isn't already running
        requestPoolManager.startGrabbing();
    }

    function handleCacheFull(e) {
        // Stop prefetching if the ImageCacheFull event is fired from cornerstone
        // console.log('CornerstoneImageCacheFull full, stopping');
        var element = e.data.element;

        var stackPrefetchData = cornerstoneTools.getToolState(element, toolType);
        if (!stackPrefetchData || !stackPrefetchData.data || !stackPrefetchData.data.length) {
            return;
        }

        // Disable the stackPrefetch tool
        // stackPrefetchData.data[0].enabled = false;

        // Clear current prefetch requests from the requestPool
        cornerstoneTools.requestPoolManager.clearRequestStack(requestType);
    }

    function promiseRemovedHandler(e, eventData) {
        // When an imagePromise has been pushed out of the cache, re-add its index
        // it to the indicesToRequest list so that it will be retrieved later if the
        // currentImageIdIndex is changed to an image nearby
        var element = e.data.element;
        var stackData = cornerstoneTools.getToolState(element, 'stack');
        if (!stackData || !stackData.data || !stackData.data.length) {
            return;
        }

        var stack = stackData.data[0];
        var imageIdIndex = stack.imageIds.indexOf(eventData.imageId);

        // Make sure the image that was removed is actually in this stack
        // before adding it to the indicesToRequest array
        if (imageIdIndex < 0) {
            return;
        }
        
        var stackPrefetchData = cornerstoneTools.getToolState(element, toolType);
        if (!stackPrefetchData || !stackPrefetchData.data || !stackPrefetchData.data.length) {
            return;
        }

        stackPrefetchData.data[0].indicesToRequest.push(imageIdIndex);
    }

    function onImageUpdated(e) {
        // Start prefetching again (after a delay)
        // When the user has scrolled to a new image
        clearTimeout(resetPrefetchTimeout);
        resetPrefetchTimeout = setTimeout(function() {
            var element = e.currentTarget;
            prefetch(element);
        }, resetPrefetchDelay);
    }

    function enable(element) {
        // Clear old prefetch data. Skipping this can cause problems when changing the series inside an element
        var stackPrefetchDataArray = cornerstoneTools.getToolState(element, toolType);
        stackPrefetchDataArray.data = [];

        // First check that there is stack data available
        var stackData = cornerstoneTools.getToolState(element, 'stack');
        if (!stackData || !stackData.data || !stackData.data.length) {
            return;
        }

        var stack = stackData.data[0];

        // Use the currentImageIdIndex from the stack as the initalImageIdIndex
        var stackPrefetchData = {
            indicesToRequest: range(0, stack.imageIds.length - 1),
            enabled: true,
            direction: 1
        };

        // Remove the currentImageIdIndex from the list to request
        var indexOfCurrentImage = stackPrefetchData.indicesToRequest.indexOf(stack.currentImageIdIndex);
        stackPrefetchData.indicesToRequest.splice(indexOfCurrentImage, 1);

        cornerstoneTools.addToolState(element, toolType, stackPrefetchData);

        prefetch(element);

        $(element).off('CornerstoneNewImage', onImageUpdated);
        $(element).on('CornerstoneNewImage', onImageUpdated);

        $(cornerstone).off('CornerstoneImageCacheFull', handleCacheFull);
        $(cornerstone).on('CornerstoneImageCacheFull', {
            element: element
        }, handleCacheFull);

        $(cornerstone).off('CornerstoneImageCachePromiseRemoved', promiseRemovedHandler);
        $(cornerstone).on('CornerstoneImageCachePromiseRemoved', {
            element: element
        }, promiseRemovedHandler);
    }

    function disable(element) {
        clearTimeout(resetPrefetchTimeout);
        $(element).off('CornerstoneNewImage', onImageUpdated);

        $(cornerstone).off('CornerstoneImageCacheFull', handleCacheFull);
        $(cornerstone).off('CornerstoneImageCachePromiseRemoved', promiseRemovedHandler);

        var stackPrefetchData = cornerstoneTools.getToolState(element, toolType);
        // If there is actually something to disable, disable it
        if (stackPrefetchData && stackPrefetchData.data.length) {
            stackPrefetchData.data[0].enabled = false;

            // Clear current prefetch requests from the requestPool
            cornerstoneTools.requestPoolManager.clearRequestStack(requestType);
        }
    }

    function getConfiguration () {
        return configuration;
    }

    function setConfiguration(config) {
        configuration = config;
    }

    // module/private exports
    cornerstoneTools.stackPrefetch = {
        enable: enable,
        disable: disable,
        getConfiguration: getConfiguration,
        setConfiguration: setConfiguration
    };

})($, cornerstone, cornerstoneTools);
 
// End Source; src/stackTools/stackPrefetch.js

// Begin Source: src/stackTools/stackScroll.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    function mouseUpCallback(e, eventData) {
        $(eventData.element).off('CornerstoneToolsMouseDrag', dragCallback);
        $(eventData.element).off('CornerstoneToolsMouseUp', mouseUpCallback);
    }

    function mouseDownCallback(e, eventData) {
        if (cornerstoneTools.isMouseButtonEnabled(eventData.which, e.data.mouseButtonMask)) {
            var mouseDragEventData = {
                deltaY: 0
            };
            $(eventData.element).on('CornerstoneToolsMouseDrag', mouseDragEventData, dragCallback);
            $(eventData.element).on('CornerstoneToolsMouseUp', mouseUpCallback);
            e.stopImmediatePropagation();
            return false;
        }
    }

    function mouseWheelCallback(e, eventData) {
        var images = -eventData.direction;
        cornerstoneTools.scroll(eventData.element, images);
    }

    function dragCallback(e, eventData) {
        var element = eventData.element;

        var toolData = cornerstoneTools.getToolState(element, 'stack');
        if (!toolData || !toolData.data || !toolData.data.length) {
            return;
        }
        
        var stackData = toolData.data[0];

        var config = cornerstoneTools.stackScroll.getConfiguration();

        // The Math.max here makes it easier to mouseDrag-scroll small image stacks
        var pixelsPerImage = $(element).height() / Math.max(stackData.imageIds.length, 8);
        if (config && config.stackScrollSpeed) {
            pixelsPerImage = config.stackScrollSpeed;
        }

        e.data.deltaY = e.data.deltaY || 0;
        e.data.deltaY += eventData.deltaPoints.page.y;
        if (Math.abs(e.data.deltaY) >= pixelsPerImage) {
            var imageDelta = e.data.deltaY / pixelsPerImage;
            var imageIdIndexOffset = Math.round(imageDelta);
            var imageDeltaMod = e.data.deltaY % pixelsPerImage;
            e.data.deltaY = imageDeltaMod;
            cornerstoneTools.scroll(element, imageIdIndexOffset);
        }

        return false; // false = causes jquery to preventDefault() and stopPropagation() this event
    }

    // module/private exports
    cornerstoneTools.stackScroll = cornerstoneTools.simpleMouseButtonTool(mouseDownCallback);
    cornerstoneTools.stackScrollWheel = cornerstoneTools.mouseWheelTool(mouseWheelCallback);

    var options = {
        eventData: {
            deltaY: 0
        }
    };
    cornerstoneTools.stackScrollTouchDrag = cornerstoneTools.touchDragTool(dragCallback, options);

})($, cornerstone, cornerstoneTools);
 
// End Source; src/stackTools/stackScroll.js

// Begin Source: src/stackTools/stackScrollKeyboard.js
(function(cornerstoneTools) {

    'use strict';

    var keys = {
        UP: 38,
        DOWN: 40
    };

    function keyDownCallback(e, eventData) {
        var keyCode = eventData.keyCode;
        if (keyCode !== keys.UP && keyCode !== keys.DOWN) {
            return;
        }

        var images = 1;
        if (keyCode === keys.DOWN) {
            images = -1;
        }

        cornerstoneTools.scroll(eventData.element, images);
    }

    // module/private exports
    cornerstoneTools.stackScrollKeyboard = cornerstoneTools.keyboardTool(keyDownCallback);

})(cornerstoneTools);
 
// End Source; src/stackTools/stackScrollKeyboard.js

// Begin Source: src/stateManagement/applicationState.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    function saveApplicationState(elements) {
        // Save imageId-specific tool state data
        var appState = {
            imageIdToolState: cornerstoneTools.globalImageIdSpecificToolStateManager.saveToolState(),
            elementToolState: {},
            elementViewport: {}
        };

        // For each of the given elements, save the viewport and any stack-specific tool data
        elements.forEach(function(element) {
            var toolStateManager = cornerstoneTools.getElementToolStateManager(element);
            if (toolStateManager === cornerstoneTools.globalImageIdSpecificToolStateManager) {
                return;
            }

            appState.elementToolState[element.id] = toolStateManager.saveToolState();

            appState.elementViewport[element.id] = cornerstone.getViewport(element);
        });
        return appState;
    }

    function restoreApplicationState(appState) {
        // Make sure t
        if (!appState.hasOwnProperty('imageIdToolState') ||
            !appState.hasOwnProperty('elementToolState') ||
            !appState.hasOwnProperty('elementViewport')) {
            return;
        }

        // Restore all the imageId specific tool data
        cornerstoneTools.globalImageIdSpecificToolStateManager.restoreToolState(appState.imageIdToolState);

        Object.keys(appState.elementViewport).forEach(function(elementId) {
            // Restore any stack specific tool data
            var element = document.getElementById(elementId);
            if (!element) {
                return;
            }

            if (!appState.elementToolState.hasOwnProperty(elementId)) {
                return;
            }
            
            var toolStateManager = cornerstoneTools.getElementToolStateManager(element);
            if (toolStateManager === cornerstoneTools.globalImageIdSpecificToolStateManager) {
                return;
            }

            toolStateManager.restoreToolState(appState.elementToolState[elementId]);

            // Restore the saved viewport information
            var savedViewport = appState.elementViewport[elementId];
            cornerstone.setViewport(element, savedViewport);

            // Update the element to apply the viewport and tool changes
            cornerstone.updateImage(element);
        });
        return appState;
    }

    cornerstoneTools.appState = {
        save: saveApplicationState,
        restore: restoreApplicationState
    };

})($, cornerstone, cornerstoneTools);
 
// End Source; src/stateManagement/applicationState.js

// Begin Source: src/stateManagement/frameOfReferenceStateManager.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    // This implements a frame-of-reference specific tool state management strategy.  This means that
    // measurement data are tied to a specific frame of reference UID and only visible to objects using
    // that frame-of-reference UID

    function newFrameOfReferenceSpecificToolStateManager() {
        var toolState = {};

        // here we add tool state, this is done by tools as well
        // as modules that restore saved state
        function addFrameOfReferenceSpecificToolState(frameOfReference, toolType, data) {
            // if we don't have any tool state for this frameOfReference, add an empty object
            if (toolState.hasOwnProperty(frameOfReference) === false) {
                toolState[frameOfReference] = {};
            }

            var frameOfReferenceToolState = toolState[frameOfReference];

            // if we don't have tool state for this type of tool, add an empty object
            if (frameOfReferenceToolState.hasOwnProperty(toolType) === false) {
                frameOfReferenceToolState[toolType] = {
                    data: []
                };
            }

            var toolData = frameOfReferenceToolState[toolType];

            // finally, add this new tool to the state
            toolData.data.push(data);
        }

        // here you can get state - used by tools as well as modules
        // that save state persistently
        function getFrameOfReferenceSpecificToolState(frameOfReference, toolType) {
            // if we don't have any tool state for this frame of reference, return undefined
            if (toolState.hasOwnProperty(frameOfReference) === false) {
                return;
            }

            var frameOfReferenceToolState = toolState[frameOfReference];

            // if we don't have tool state for this type of tool, return undefined
            if (frameOfReferenceToolState.hasOwnProperty(toolType) === false) {
                return;
            }

            var toolData = frameOfReferenceToolState[toolType];
            return toolData;
        }

        function removeFrameOfReferenceSpecificToolState(frameOfReference, toolType, data) {
            // if we don't have any tool state for this frame of reference, return undefined
            if (toolState.hasOwnProperty(frameOfReference) === false) {
                return;
            }

            var frameOfReferenceToolState = toolState[frameOfReference];

            // if we don't have tool state for this type of tool, return undefined
            if (frameOfReferenceToolState.hasOwnProperty(toolType) === false) {
                return;
            }

            var toolData = frameOfReferenceToolState[toolType];
            // find this tool data
            var indexOfData = -1;
            for (var i = 0; i < toolData.data.length; i++) {
                if (toolData.data[i] === data) {
                    indexOfData = i;
                }
            }

            if (indexOfData !== -1) {
                toolData.data.splice(indexOfData, 1);
            }
        }

        var frameOfReferenceToolStateManager = {
            get: getFrameOfReferenceSpecificToolState,
            add: addFrameOfReferenceSpecificToolState,
            remove: removeFrameOfReferenceSpecificToolState
        };
        return frameOfReferenceToolStateManager;
    }

    // a global frameOfReferenceSpecificToolStateManager - the most common case is to share 3d information
    // between stacks of images
    var globalFrameOfReferenceSpecificToolStateManager = newFrameOfReferenceSpecificToolStateManager();
    
    // module/private exports
    cornerstoneTools.newFrameOfReferenceSpecificToolStateManager = newFrameOfReferenceSpecificToolStateManager;
    cornerstoneTools.globalFrameOfReferenceSpecificToolStateManager = globalFrameOfReferenceSpecificToolStateManager;

})($, cornerstone, cornerstoneTools);
 
// End Source; src/stateManagement/frameOfReferenceStateManager.js

// Begin Source: src/stateManagement/imageIdSpecificStateManager.js
(function(cornerstone, cornerstoneTools) {

    'use strict';

    // This implements an imageId specific tool state management strategy.  This means that
    // measurements data is tied to a specific imageId and only visible for enabled elements
    // that are displaying that imageId.

    function newImageIdSpecificToolStateManager() {
        var toolState = {};

        // here we add tool state, this is done by tools as well
        // as modules that restore saved state

        function saveImageIdToolState(imageId) {
            return toolState[imageId];
        }

        function restoreImageIdToolState(imageId, imageIdToolState) {
            toolState[imageId] = imageIdToolState;
        }

        function saveToolState() {
            return toolState;
        }

        function restoreToolState(savedToolState) {
            toolState = savedToolState;
        }

        // here we add tool state, this is done by tools as well
        // as modules that restore saved state
        function addImageIdSpecificToolState(element, toolType, data) {
            var enabledImage = cornerstone.getEnabledElement(element);
            // if we don't have any tool state for this imageId, add an empty object
            if (!enabledImage.image || toolState.hasOwnProperty(enabledImage.image.imageId) === false) {
                toolState[enabledImage.image.imageId] = {};
            }

            var imageIdToolState = toolState[enabledImage.image.imageId];

            // if we don't have tool state for this type of tool, add an empty object
            if (imageIdToolState.hasOwnProperty(toolType) === false) {
                imageIdToolState[toolType] = {
                    data: []
                };
            }

            var toolData = imageIdToolState[toolType];

            // finally, add this new tool to the state
            toolData.data.push(data);
        }

        // here you can get state - used by tools as well as modules
        // that save state persistently
        function getImageIdSpecificToolState(element, toolType) {
            var enabledImage = cornerstone.getEnabledElement(element);
            // if we don't have any tool state for this imageId, return undefined
            if (!enabledImage.image || toolState.hasOwnProperty(enabledImage.image.imageId) === false) {
                return;
            }

            var imageIdToolState = toolState[enabledImage.image.imageId];

            // if we don't have tool state for this type of tool, return undefined
            if (imageIdToolState.hasOwnProperty(toolType) === false) {
                return;
            }

            var toolData = imageIdToolState[toolType];
            return toolData;
        }

        // Clears all tool data from this toolStateManager.
        function clearImageIdSpecificToolStateManager(element) {
            var enabledImage = cornerstone.getEnabledElement(element);
            if (!enabledImage.image || toolState.hasOwnProperty(enabledImage.image.imageId) === false) {
                return;
            }

            delete toolState[enabledImage.image.imageId];
        }

        var imageIdToolStateManager = {
            get: getImageIdSpecificToolState,
            add: addImageIdSpecificToolState,
            clear: clearImageIdSpecificToolStateManager,
            saveImageIdToolState: saveImageIdToolState,
            restoreImageIdToolState: restoreImageIdToolState,
            saveToolState: saveToolState,
            restoreToolState: restoreToolState,
            toolState: toolState
        };
        return imageIdToolStateManager;
    }

    // a global imageIdSpecificToolStateManager - the most common case is to share state between all
    // visible enabled images
    var globalImageIdSpecificToolStateManager = newImageIdSpecificToolStateManager();
    
    // module/private exports
    cornerstoneTools.newImageIdSpecificToolStateManager = newImageIdSpecificToolStateManager;
    cornerstoneTools.globalImageIdSpecificToolStateManager = globalImageIdSpecificToolStateManager;

})(cornerstone, cornerstoneTools);
 
// End Source; src/stateManagement/imageIdSpecificStateManager.js

// Begin Source: src/stateManagement/loadHandlerManager.js
(function(cornerstoneTools) {

    'use strict';

    function loadHandlerManager() {
        var defaultStartLoadHandler,
            defaultEndLoadHandler,
            defaultErrorLoadingHandler;

        function setStartLoadHandler(handler) {
            defaultStartLoadHandler = handler;
        }

        function getStartLoadHandler() {
            return defaultStartLoadHandler;
        }

        function setEndLoadHandler(handler) {
            defaultEndLoadHandler = handler;
        }

        function getEndLoadHandler(){
            return defaultEndLoadHandler;
        }

        function setErrorLoadingHandler(handler) {
            defaultErrorLoadingHandler = handler;
        }
        
        function getErrorLoadingHandler() {
            return defaultErrorLoadingHandler;
        }
      
        var loadHandlers = {
            setStartLoadHandler: setStartLoadHandler,
            getStartLoadHandler: getStartLoadHandler,
            setEndLoadHandler: setEndLoadHandler,
            getEndLoadHandler: getEndLoadHandler,
            setErrorLoadingHandler: setErrorLoadingHandler,
            getErrorLoadingHandler: getErrorLoadingHandler
        };

        return loadHandlers;
    }

    // module/private exports
    cornerstoneTools.loadHandlerManager = loadHandlerManager();

})(cornerstoneTools);
 
// End Source; src/stateManagement/loadHandlerManager.js

// Begin Source: src/stateManagement/stackSpecificStateManager.js
(function(cornerstone, cornerstoneTools) {

    'use strict';

    // This implements an Stack specific tool state management strategy.  This means
    // that tool data is shared between all imageIds in a given stack
    function newStackSpecificToolStateManager(toolTypes, oldStateManager) {
        var toolState = {};

        function saveToolState() {
            return toolState;
        }

        function restoreToolState(stackToolState) {
            toolState = stackToolState;
        }

        // here we add tool state, this is done by tools as well
        // as modules that restore saved state
        function addStackSpecificToolState(element, toolType, data) {
            // if this is a tool type to apply to the stack, do so
            if (toolTypes.indexOf(toolType) >= 0) {

                // if we don't have tool state for this type of tool, add an empty object
                if (toolState.hasOwnProperty(toolType) === false) {
                    toolState[toolType] = {
                        data: []
                    };
                }

                var toolData = toolState[toolType];

                // finally, add this new tool to the state
                toolData.data.push(data);
            } else {
                // call the imageId specific tool state manager
                return oldStateManager.add(element, toolType, data);
            }
        }

        // here you can get state - used by tools as well as modules
        // that save state persistently
        function getStackSpecificToolState(element, toolType) {
            // if this is a tool type to apply to the stack, do so
            if (toolTypes.indexOf(toolType) >= 0) {
                // if we don't have tool state for this type of tool, add an empty object
                if (toolState.hasOwnProperty(toolType) === false) {
                    toolState[toolType] = {
                        data: []
                    };
                }

                var toolData = toolState[toolType];
                return toolData;
            } else {
                // call the imageId specific tool state manager
                return oldStateManager.get(element, toolType);
            }
        }

        var stackSpecificToolStateManager = {
            get: getStackSpecificToolState,
            add: addStackSpecificToolState,
            saveToolState: saveToolState,
            restoreToolState: restoreToolState,
            toolState: toolState,
        };
        return stackSpecificToolStateManager;
    }

    var stackStateManagers = [];

    function addStackStateManager(element) {
        var oldStateManager = cornerstoneTools.getElementToolStateManager(element);
        if (!oldStateManager) {
            oldStateManager = cornerstoneTools.globalImageIdSpecificToolStateManager;
        }

        var stackTools = [ 'stack', 'stackPrefetch', 'playClip', 'volume', 'slab', 'referenceLines', 'crosshairs' ];
        var stackSpecificStateManager = cornerstoneTools.newStackSpecificToolStateManager(stackTools, oldStateManager);
        stackStateManagers.push(stackSpecificStateManager);
        cornerstoneTools.setElementToolStateManager(element, stackSpecificStateManager);
    }

    // module/private exports
    cornerstoneTools.newStackSpecificToolStateManager = newStackSpecificToolStateManager;
    cornerstoneTools.addStackStateManager = addStackStateManager;

})(cornerstone, cornerstoneTools);
 
// End Source; src/stateManagement/stackSpecificStateManager.js

// Begin Source: src/stateManagement/textStyleManager.js
(function(cornerstoneTools) {

    'use strict';

    function textStyleManager() {
        var defaultFontSize = 15,
            defaultFont = defaultFontSize + 'px Arial',
            defaultBackgroundColor = 'transparent';

        function setFont(font) {
            defaultFont = font;
        }

        function getFont() {
            return defaultFont;
        }

        function setFontSize(fontSize) {
            defaultFontSize = fontSize;
        }

        function getFontSize() {
            return defaultFontSize;
        }

        function setBackgroundColor(backgroundColor) {
            defaultBackgroundColor = backgroundColor;
        }

        function getBackgroundColor() {
            return defaultBackgroundColor;
        }

        var textStyle = {
            setFont: setFont,
            getFont: getFont,
            setFontSize: setFontSize,
            getFontSize: getFontSize,
            setBackgroundColor: setBackgroundColor,
            getBackgroundColor: getBackgroundColor
        };

        return textStyle;
    }

    // module/private exports
    cornerstoneTools.textStyle = textStyleManager();

})(cornerstoneTools);
 
// End Source; src/stateManagement/textStyleManager.js

// Begin Source: src/stateManagement/timeSeriesSpecificStateManager.js
(function(cornerstone, cornerstoneTools) {

    'use strict';

    // This implements an Stack specific tool state management strategy.  This means
    // that tool data is shared between all imageIds in a given stack
    function newTimeSeriesSpecificToolStateManager(toolTypes, oldStateManager) {
        var toolState = {};

        // here we add tool state, this is done by tools as well
        // as modules that restore saved state
        function addStackSpecificToolState(element, toolType, data) {
            // if this is a tool type to apply to the stack, do so
            if (toolTypes.indexOf(toolType) >= 0) {

                // if we don't have tool state for this type of tool, add an empty object
                if (toolState.hasOwnProperty(toolType) === false) {
                    toolState[toolType] = {
                        data: []
                    };
                }

                var toolData = toolState[toolType];

                // finally, add this new tool to the state
                toolData.data.push(data);
            } else {
                // call the imageId specific tool state manager
                return oldStateManager.add(element, toolType, data);
            }
        }

        // here you can get state - used by tools as well as modules
        // that save state persistently
        function getStackSpecificToolState(element, toolType) {
            // if this is a tool type to apply to the stack, do so
            if (toolTypes.indexOf(toolType) >= 0) {
                // if we don't have tool state for this type of tool, add an empty object
                if (toolState.hasOwnProperty(toolType) === false) {
                    toolState[toolType] = {
                        data: []
                    };
                }

                var toolData = toolState[toolType];
                return toolData;
            } else {
                // call the imageId specific tool state manager
                return oldStateManager.get(element, toolType);
            }
        }

        var imageIdToolStateManager = {
            get: getStackSpecificToolState,
            add: addStackSpecificToolState
        };
        return imageIdToolStateManager;
    }

    var timeSeriesStateManagers = [];

    function addTimeSeriesStateManager(element, tools) {
        tools = tools || [ 'timeSeries' ];
        var oldStateManager = cornerstoneTools.getElementToolStateManager(element);
        if (oldStateManager === undefined) {
            oldStateManager = cornerstoneTools.globalImageIdSpecificToolStateManager;
        }

        var timeSeriesSpecificStateManager = cornerstoneTools.newTimeSeriesSpecificToolStateManager(tools, oldStateManager);
        timeSeriesStateManagers.push(timeSeriesSpecificStateManager);
        cornerstoneTools.setElementToolStateManager(element, timeSeriesSpecificStateManager);
    }

    // module/private exports
    cornerstoneTools.newTimeSeriesSpecificToolStateManager = newTimeSeriesSpecificToolStateManager;
    cornerstoneTools.addTimeSeriesStateManager = addTimeSeriesStateManager;

})(cornerstone, cornerstoneTools);
 
// End Source; src/stateManagement/timeSeriesSpecificStateManager.js

// Begin Source: src/stateManagement/toolColorManager.js
(function(cornerstoneTools) {

    'use strict';

    function toolColorManager(){
        var defaultColor = 'white',
            activeColor = 'greenyellow',
            fillColor = 'transparent';

        function setFillColor(color){
            fillColor = color;
        }

        function getFillColor(){
            return fillColor;
        }

        function setToolColor(color){
            defaultColor = color;
        }

        function getToolColor(){
            return defaultColor;
        }

        function setActiveToolColor(color){
            activeColor = color;
        }

        function getActiveToolColor(){
            return activeColor;
        }

        var toolColors = {
            setFillColor: setFillColor,
            getFillColor: getFillColor,
            setToolColor: setToolColor,
            getToolColor: getToolColor,
            setActiveColor: setActiveToolColor,
            getActiveColor: getActiveToolColor
        };

        return toolColors;
    }

    // module/private exports
    cornerstoneTools.toolColors = toolColorManager();

})(cornerstoneTools);
 
// End Source; src/stateManagement/toolColorManager.js

// Begin Source: src/stateManagement/toolCoordinateManager.js
(function(cornerstoneTools) {

    'use strict';

    function toolCoordinateManager(){
        var cooordsData = '';

        function setActiveToolCoords(eventData){
            cooordsData = eventData.currentPoints.canvas;
        }

        function getActiveToolCoords(){
            return cooordsData;
        }

        var toolCoords = {
            setCoords: setActiveToolCoords,
            getCoords: getActiveToolCoords
        };

        return toolCoords;
    }

    // module/private exports
    cornerstoneTools.toolCoordinates = toolCoordinateManager();

})(cornerstoneTools);
 
// End Source; src/stateManagement/toolCoordinateManager.js

// Begin Source: src/stateManagement/toolStateManager.js
(function(cornerstone, cornerstoneTools) {

    'use strict';

    function getElementToolStateManager(element) {
        var enabledImage = cornerstone.getEnabledElement(element);
        // if the enabledImage has no toolStateManager, create a default one for it
        // NOTE: This makes state management element specific
        if (enabledImage.toolStateManager === undefined) {
            enabledImage.toolStateManager = cornerstoneTools.globalImageIdSpecificToolStateManager;
        }

        return enabledImage.toolStateManager;
    }

    // here we add tool state, this is done by tools as well
    // as modules that restore saved state
    function addToolState(element, toolType, data) {
        var toolStateManager = getElementToolStateManager(element);
        toolStateManager.add(element, toolType, data);

        var eventType = 'CornerstoneToolsMeasurementAdded';
        var eventData = {
            toolType: toolType,
            element: element,
            measurementData: data
        };
        $(element).trigger(eventType, eventData);
        // TODO: figure out how to broadcast this change to all enabled elements so they can update the image
        // if this change effects them
    }

    // here you can get state - used by tools as well as modules
    // that save state persistently
    function getToolState(element, toolType) {
        var toolStateManager = getElementToolStateManager(element);
        return toolStateManager.get(element, toolType);
    }

    function removeToolState(element, toolType, data) {
        var toolStateManager = getElementToolStateManager(element);
        var toolData = toolStateManager.get(element, toolType);
        // find this tool data
        var indexOfData = -1;
        for (var i = 0; i < toolData.data.length; i++) {
            if (toolData.data[i] === data) {
                indexOfData = i;
            }
        }

        if (indexOfData !== -1) {
            toolData.data.splice(indexOfData, 1);
        }

        var eventType = 'CornerstoneToolsMeasurementRemoved';
        var eventData = {
            toolType: toolType,
            element: element,
            measurementData: data
        };
        $(element).trigger(eventType, eventData);
    }

    function clearToolState(element, toolType) {
        var toolStateManager = getElementToolStateManager(element);
        var toolData = toolStateManager.get(element, toolType);
        
        // If any toolData actually exists, clear it
        if (toolData !== undefined) {
            toolData.data = [];
        }
    }

    // sets the tool state manager for an element
    function setElementToolStateManager(element, toolStateManager) {
        var enabledImage = cornerstone.getEnabledElement(element);
        enabledImage.toolStateManager = toolStateManager;
    }

    // module/private exports
    cornerstoneTools.addToolState = addToolState;
    cornerstoneTools.getToolState = getToolState;
    cornerstoneTools.removeToolState = removeToolState;
    cornerstoneTools.clearToolState = clearToolState;
    cornerstoneTools.setElementToolStateManager = setElementToolStateManager;
    cornerstoneTools.getElementToolStateManager = getElementToolStateManager;

})(cornerstone, cornerstoneTools);
 
// End Source; src/stateManagement/toolStateManager.js

// Begin Source: src/stateManagement/toolStyleManager.js
(function(cornerstoneTools) {

    'use strict';

    function toolStyleManager() {
        var defaultWidth = 1,
            activeWidth = 2;

        function setToolWidth(width){
            defaultWidth = width;
        }

        function getToolWidth(){
            return defaultWidth;
        }

        function setActiveToolWidth(width){
            activeWidth = width;
        }

        function getActiveToolWidth(){
            return activeWidth;
        }

        var toolStyle = {
            setToolWidth: setToolWidth,
            getToolWidth: getToolWidth,
            setActiveWidth: setActiveToolWidth,
            getActiveWidth: getActiveToolWidth
        };

        return toolStyle;
    }

    // module/private exports
    cornerstoneTools.toolStyle = toolStyleManager();

})(cornerstoneTools);
 
// End Source; src/stateManagement/toolStyleManager.js

// Begin Source: src/stateManagement/touchSettingsManager.js
(function(cornerstoneTools) {

    'use strict';

    function touchSettingsManager() {
        var defaultDistanceFromTouch = {
            x: 0,
            y: -55
        };

        function setToolDistanceFromTouch(distance){
            defaultDistanceFromTouch = distance;
        }

        function getToolDistanceFromTouch(){
            return defaultDistanceFromTouch;
        }

        var touchSettings = {
            setToolDistanceFromTouch: setToolDistanceFromTouch,
            getToolDistanceFromTouch: getToolDistanceFromTouch,
        };

        return touchSettings;
    }

    // module/private exports
    cornerstoneTools.touchSettings = touchSettingsManager();

})(cornerstoneTools);
 
// End Source; src/stateManagement/touchSettingsManager.js

// Begin Source: src/synchronization/panZoomSynchronizer.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    // This function synchronizes the target zoom and pan to match the source
    function panZoomSynchronizer(synchronizer, sourceElement, targetElement) {

        // ignore the case where the source and target are the same enabled element
        if (targetElement === sourceElement) {
            return;
        }
        // get the source and target viewports
        var sourceViewport = cornerstone.getViewport(sourceElement);
        var targetViewport = cornerstone.getViewport(targetElement);

        // do nothing if the scale and translation are the same
        if (targetViewport.scale === sourceViewport.scale && targetViewport.translation.x === sourceViewport.translation.x && targetViewport.translation.y === sourceViewport.translation.y) {
            return;
        }

        // scale and/or translation are different, sync them
        targetViewport.scale = sourceViewport.scale;
        targetViewport.translation.x = sourceViewport.translation.x;
        targetViewport.translation.y = sourceViewport.translation.y;
        synchronizer.setViewport(targetElement, targetViewport);
    }

    // module/private exports
    cornerstoneTools.panZoomSynchronizer = panZoomSynchronizer;

})($, cornerstone, cornerstoneTools);
 
// End Source; src/synchronization/panZoomSynchronizer.js

// Begin Source: src/synchronization/stackImageIndexSynchronizer.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    // This function causes the image in the target stack to be set to the one closest
    // to the image in the source stack by image position
    function stackImageIndexSynchronizer(synchronizer, sourceElement, targetElement) {

        // ignore the case where the source and target are the same enabled element
        if (targetElement === sourceElement) {
            return;
        }

        var sourceStackToolDataSource = cornerstoneTools.getToolState(sourceElement, 'stack');
        var sourceStackData = sourceStackToolDataSource.data[0];
        var targetStackToolDataSource = cornerstoneTools.getToolState(targetElement, 'stack');
        var targetStackData = targetStackToolDataSource.data[0];

        var newImageIdIndex = sourceStackData.currentImageIdIndex;

        // clamp the index
        newImageIdIndex = Math.min(Math.max(newImageIdIndex, 0), targetStackData.imageIds.length - 1);

        // Do nothing if the index has not changed
        if (newImageIdIndex === targetStackData.currentImageIdIndex) {
            return;
        }

        var startLoadingHandler = cornerstoneTools.loadHandlerManager.getStartLoadHandler();
        var endLoadingHandler = cornerstoneTools.loadHandlerManager.getEndLoadHandler();
        var errorLoadingHandler = cornerstoneTools.loadHandlerManager.getErrorLoadingHandler();

        if (startLoadingHandler) {
            startLoadingHandler(targetElement);
        }

        cornerstone.loadAndCacheImage(targetStackData.imageIds[newImageIdIndex]).then(function(image) {
            var viewport = cornerstone.getViewport(targetElement);
            targetStackData.currentImageIdIndex = newImageIdIndex;
            synchronizer.displayImage(targetElement, image, viewport);
            if (endLoadingHandler) {
                endLoadingHandler(targetElement);
            }
        }, function(error) {
            var imageId = targetStackData.imageIds[newImageIdIndex];
            if (errorLoadingHandler) {
                errorLoadingHandler(targetElement, imageId, error);
            }
        });
    }

    // module/private exports
    cornerstoneTools.stackImageIndexSynchronizer = stackImageIndexSynchronizer;

})($, cornerstone, cornerstoneTools);
 
// End Source; src/synchronization/stackImageIndexSynchronizer.js

// Begin Source: src/synchronization/stackImagePositionOffsetSynchronizer.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    // This function causes the image in the target stack to be set to the one closest
    // to the image in the source stack by image position

    // In the future we will want to have a way to manually register links sets of the same orientation (e.g. an axial link set from a prior with an axial link set of a current).  The user could do this by scrolling the two stacks to a similar location and then doing a user action (e.g. right click link) at which point the system will capture the delta between the image position (patient) of both stacks and use that to sync them.  This offset will need to be adjustable.

    function stackImagePositionOffsetSynchronizer(synchronizer, sourceElement, targetElement, eventData, positionDifference) {

        // ignore the case where the source and target are the same enabled element
        if (targetElement === sourceElement) {
            return;
        }

        var sourceEnabledElement = cornerstone.getEnabledElement(sourceElement);
        var sourceImagePlane = cornerstoneTools.metaData.get('imagePlane', sourceEnabledElement.image.imageId);
        var sourceImagePosition = sourceImagePlane.imagePositionPatient;

        var stackToolDataSource = cornerstoneTools.getToolState(targetElement, 'stack');
        var stackData = stackToolDataSource.data[0];

        var minDistance = Number.MAX_VALUE;
        var newImageIdIndex = -1;

        if (!positionDifference) {
            return;
        }

        var finalPosition = sourceImagePosition.clone().add(positionDifference);

        stackData.imageIds.forEach(function(imageId, index) {
            var imagePlane = cornerstoneTools.metaData.get('imagePlane', imageId);
            var imagePosition = imagePlane.imagePositionPatient;
            var distance = finalPosition.distanceToSquared(imagePosition);

            if (distance < minDistance) {
                minDistance = distance;
                newImageIdIndex = index;
            }
        });

        if (newImageIdIndex === stackData.currentImageIdIndex || newImageIdIndex === -1) {
            return;
        }

        var startLoadingHandler = cornerstoneTools.loadHandlerManager.getStartLoadHandler();
        var endLoadingHandler = cornerstoneTools.loadHandlerManager.getEndLoadHandler();
        var errorLoadingHandler = cornerstoneTools.loadHandlerManager.getErrorLoadingHandler();

        if (startLoadingHandler) {
            startLoadingHandler(targetElement);
        }

        cornerstone.loadAndCacheImage(stackData.imageIds[newImageIdIndex]).then(function(image) {
            var viewport = cornerstone.getViewport(targetElement);
            stackData.currentImageIdIndex = newImageIdIndex;
            synchronizer.displayImage(targetElement, image, viewport);
            if (endLoadingHandler) {
                endLoadingHandler(targetElement);
            }
        }, function(error) {
            var imageId = stackData.imageIds[newImageIdIndex];
            if (errorLoadingHandler) {
                errorLoadingHandler(targetElement, imageId, error);
            }
        });
    }

    // module/private exports
    cornerstoneTools.stackImagePositionOffsetSynchronizer = stackImagePositionOffsetSynchronizer;

})($, cornerstone, cornerstoneTools);
 
// End Source; src/synchronization/stackImagePositionOffsetSynchronizer.js

// Begin Source: src/synchronization/stackImagePositionSynchronizer.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    // This function causes the image in the target stack to be set to the one closest
    // to the image in the source stack by image position
    function stackImagePositionSynchronizer(synchronizer, sourceElement, targetElement) {

        // ignore the case where the source and target are the same enabled element
        if (targetElement === sourceElement) {
            return;
        }

        var sourceImage = cornerstone.getEnabledElement(sourceElement).image;
        var sourceImagePlane = cornerstoneTools.metaData.get('imagePlane', sourceImage.imageId);
        var sourceImagePosition = sourceImagePlane.imagePositionPatient;

        var stackToolDataSource = cornerstoneTools.getToolState(targetElement, 'stack');
        var stackData = stackToolDataSource.data[0];

        var minDistance = Number.MAX_VALUE;
        var newImageIdIndex = -1;

        $.each(stackData.imageIds, function(index, imageId) {
            var imagePlane = cornerstoneTools.metaData.get('imagePlane', imageId);
            var imagePosition = imagePlane.imagePositionPatient;
            var distance = imagePosition.distanceToSquared(sourceImagePosition);
            //console.log(index + '=' + distance);
            if (distance < minDistance) {
                minDistance = distance;
                newImageIdIndex = index;
            }
        });

        if (newImageIdIndex === stackData.currentImageIdIndex) {
            return;
        }

        var startLoadingHandler = cornerstoneTools.loadHandlerManager.getStartLoadHandler();
        var endLoadingHandler = cornerstoneTools.loadHandlerManager.getEndLoadHandler();
        var errorLoadingHandler = cornerstoneTools.loadHandlerManager.getErrorLoadingHandler();

        if (startLoadingHandler) {
            startLoadingHandler(targetElement);
        }

        if (newImageIdIndex !== -1) {
            cornerstone.loadAndCacheImage(stackData.imageIds[newImageIdIndex]).then(function(image) {
                var viewport = cornerstone.getViewport(targetElement);
                stackData.currentImageIdIndex = newImageIdIndex;
                synchronizer.displayImage(targetElement, image, viewport);
                if (endLoadingHandler) {
                    endLoadingHandler(targetElement);
                }
            }, function(error) {
                var imageId = stackData.imageIds[newImageIdIndex];
                if (errorLoadingHandler) {
                    errorLoadingHandler(targetElement, imageId, error);
                }
            });
        }
    }

    // module/private exports
    cornerstoneTools.stackImagePositionSynchronizer = stackImagePositionSynchronizer;

})($, cornerstone, cornerstoneTools);
 
// End Source; src/synchronization/stackImagePositionSynchronizer.js

// Begin Source: src/synchronization/stackScrollSynchronizer.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    // This function causes any scrolling actions within the stack to propagate to 
    // all of the other viewports that are synced
    function stackScrollSynchronizer(synchronizer, sourceElement, targetElement, eventData) {
        // If the target and source are the same, stop
        if (sourceElement === targetElement) {
            return;
        }

        // If there is no event, or direction is 0, stop
        if (!eventData || !eventData.direction) {
            return;
        }

        // Get the stack of the target viewport
        var stackToolDataSource = cornerstoneTools.getToolState(targetElement, 'stack');
        var stackData = stackToolDataSource.data[0];

        // Get the new index for the stack
        var newImageIdIndex = stackData.currentImageIdIndex + eventData.direction;

        // Ensure the index does not exceed the bounds of the stack
        newImageIdIndex = Math.min(Math.max(newImageIdIndex, 0), stackData.imageIds.length - 1);

        // If the index has not changed, stop here
        if (stackData.currentImageIdIndex === newImageIdIndex) {
            return;
        }

        var startLoadingHandler = cornerstoneTools.loadHandlerManager.getStartLoadHandler();
        var endLoadingHandler = cornerstoneTools.loadHandlerManager.getEndLoadHandler();
        var errorLoadingHandler = cornerstoneTools.loadHandlerManager.getErrorLoadingHandler();

        if (startLoadingHandler) {
            startLoadingHandler(targetElement);
        }

        cornerstone.loadAndCacheImage(stackData.imageIds[newImageIdIndex]).then(function(image) {
            var viewport = cornerstone.getViewport(targetElement);
            stackData.currentImageIdIndex = newImageIdIndex;
            synchronizer.displayImage(targetElement, image, viewport);
            if (endLoadingHandler) {
                endLoadingHandler(targetElement);
            }
        }, function(error) {
            var imageId = stackData.imageIds[newImageIdIndex];
            if (errorLoadingHandler) {
                errorLoadingHandler(targetElement, imageId, error);
            }
        });
    }

    // module/private exports
    cornerstoneTools.stackScrollSynchronizer = stackScrollSynchronizer;

})($, cornerstone, cornerstoneTools);
 
// End Source; src/synchronization/stackScrollSynchronizer.js

// Begin Source: src/synchronization/synchronizer.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    // This object is responsible for synchronizing target elements when an event fires on a source
    // element
    function Synchronizer(event, handler) {

        var that = this;
        var sourceElements = []; // source elements fire the events we want to synchronize to
        var targetElements = []; // target elements we want to synchronize to source elements

        var ignoreFiredEvents = false;
        var initialData = {};
        var eventHandler = handler;

        this.setHandler = function(handler) {
            eventHandler = handler;
        };

        this.getHandler = function() {
            return eventHandler;
        };

        this.getDistances = function() {
            if (!sourceElements.length || !targetElements.length) {
                return;
            }

            initialData.distances = {};
            initialData.imageIds = {
                sourceElements: [],
                targetElements: []
            };

            sourceElements.forEach(function(sourceElement) {
                var sourceEnabledElement = cornerstone.getEnabledElement(sourceElement);
                if (!sourceEnabledElement || !sourceEnabledElement.image) {
                    return;
                }

                var sourceImageId = sourceEnabledElement.image.imageId;
                var sourceImagePlane = cornerstoneTools.metaData.get('imagePlane', sourceImageId);
                if (!sourceImagePlane || !sourceImagePlane.imagePositionPatient) {
                    return;
                }

                var sourceImagePosition = sourceImagePlane.imagePositionPatient;

                if (initialData.hasOwnProperty(sourceEnabledElement)) {
                    return;
                } else {
                    initialData.distances[sourceImageId] = {};
                }

                initialData.imageIds.sourceElements.push(sourceImageId);

                targetElements.forEach(function(targetElement) {
                    var targetEnabledElement = cornerstone.getEnabledElement(targetElement);
                    if (!targetEnabledElement || !targetEnabledElement.image) {
                        return;
                    }

                    var targetImageId = targetEnabledElement.image.imageId;

                    initialData.imageIds.targetElements.push(targetImageId);

                    if (sourceElement === targetElement) {
                        return;
                    }

                    if (sourceImageId === targetImageId) {
                        return;
                    }

                    if (initialData.distances[sourceImageId].hasOwnProperty(targetImageId)) {
                        return;
                    }

                    var targetImagePlane = cornerstoneTools.metaData.get('imagePlane', targetImageId);
                    if (!targetImagePlane || !targetImagePlane.imagePositionPatient) {
                        return;
                    }

                    var targetImagePosition = targetImagePlane.imagePositionPatient;

                    initialData.distances[sourceImageId][targetImageId] = targetImagePosition.clone().sub(sourceImagePosition);
                });

                if (!Object.keys(initialData.distances[sourceImageId]).length) {
                    delete initialData.distances[sourceImageId];
                }
            });
        };

        function fireEvent(sourceElement, eventData) {
            // Broadcast an event that something changed
            if (!sourceElements.length || !targetElements.length) {
                return;
            }

            ignoreFiredEvents = true;
            targetElements.forEach(function(targetElement) {
                var targetIndex = targetElements.indexOf(targetElement);
                if (targetIndex === -1) {
                    return;
                }

                var targetImageId = initialData.imageIds.targetElements[targetIndex];
                var sourceIndex = sourceElements.indexOf(sourceElement);
                if (sourceIndex === -1) {
                    return;
                }

                var sourceImageId = initialData.imageIds.sourceElements[sourceIndex];
                
                var positionDifference;
                if (sourceImageId === targetImageId) {
                    positionDifference = 0;
                } else {
                    positionDifference = initialData.distances[sourceImageId][targetImageId];
                }
                
                eventHandler(that, sourceElement, targetElement, eventData, positionDifference);
            });
            ignoreFiredEvents = false;
        }

        function onEvent(e, eventData) {
            if (ignoreFiredEvents === true) {
                return;
            }

            fireEvent(e.currentTarget, eventData);
        }

        // adds an element as a source
        this.addSource = function(element) {
            // Return if this element was previously added
            var index = sourceElements.indexOf(element);
            if (index !== -1) {
                return;
            }

            // Add to our list of enabled elements
            sourceElements.push(element);

            // subscribe to the event
            $(element).on(event, onEvent);

            // Update the inital distances between elements
            that.getDistances();

            that.updateDisableHandlers();
        };

        // adds an element as a target
        this.addTarget = function(element) {
            // Return if this element was previously added
            var index = targetElements.indexOf(element);
            if (index !== -1) {
                return;
            }

            // Add to our list of enabled elements
            targetElements.push(element);

            // Update the inital distances between elements
            that.getDistances();

            // Invoke the handler for this new target element
            eventHandler(that, element, element, 0);

            that.updateDisableHandlers();
        };

        // adds an element as both a source and a target
        this.add = function(element) {
            that.addSource(element);
            that.addTarget(element);
        };

        // removes an element as a source
        this.removeSource = function(element) {
            // Find the index of this element
            var index = sourceElements.indexOf(element);
            if (index === -1) {
                return;
            }

            // remove this element from the array
            sourceElements.splice(index, 1);

            // stop listening for the event
            $(element).off(event, onEvent);

            // Update the inital distances between elements
            that.getDistances();

            // Update everyone listening for events
            fireEvent(element);
            that.updateDisableHandlers();
        };

        // removes an element as a target
        this.removeTarget = function(element) {
            // Find the index of this element
            var index = targetElements.indexOf(element);
            if (index === -1) {
                return;
            }

            // remove this element from the array
            targetElements.splice(index, 1);

            // Update the inital distances between elements
            that.getDistances();

            // Invoke the handler for the removed target
            eventHandler(that, element, element, 0);
            that.updateDisableHandlers();
        };

        // removes an element as both a source and target
        this.remove = function(element) {
            that.removeTarget(element);
            that.removeSource(element);
        };

        // returns the source elements
        this.getSourceElements = function() {
            return sourceElements;
        };

        // returns the target elements
        this.getTargetElements = function() {
            return targetElements;
        };

        this.displayImage = function(element, image, viewport) {
            ignoreFiredEvents = true;
            cornerstone.displayImage(element, image, viewport);
            ignoreFiredEvents = false;
        };

        this.setViewport = function(element, viewport) {
            ignoreFiredEvents = true;
            cornerstone.setViewport(element, viewport);
            ignoreFiredEvents = false;
        };

        function disableHandler(e, eventData) {
            var element = eventData.element;
            that.remove(element);
        }

        this.updateDisableHandlers = function() {
            var elements = $.unique(sourceElements.concat(targetElements));
            elements.forEach(function(element) {
                $(element).off('CornerstoneElementDisabled', disableHandler);
                $(element).on('CornerstoneElementDisabled', disableHandler);
            });
        };

        this.destroy = function() {
            var elements = $.unique(sourceElements.concat(targetElements));
            elements.forEach(function(element) {
                that.remove(element);
            });
        };
    }

    // module/private exports
    cornerstoneTools.Synchronizer = Synchronizer;

})($, cornerstone, cornerstoneTools);
 
// End Source; src/synchronization/synchronizer.js

// Begin Source: src/synchronization/updateImageSynchronizer.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    // This function causes the target image to be drawn immediately
    function updateImageSynchronizer(synchronizer, sourceElement, targetElement) {

        // ignore the case where the source and target are the same enabled element
        if (targetElement === sourceElement) {
            return;
        }

        cornerstone.updateImage(targetElement);
    }

    // module/private exports
    cornerstoneTools.updateImageSynchronizer = updateImageSynchronizer;

})($, cornerstone, cornerstoneTools);
 
// End Source; src/synchronization/updateImageSynchronizer.js

// Begin Source: src/synchronization/wwwcSynchronizer.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    // This function synchronizes the target element ww/wc to match the source element
    function wwwcSynchronizer(synchronizer, sourceElement, targetElement) {

        // ignore the case where the source and target are the same enabled element
        if (targetElement === sourceElement) {
            return;
        }
        // get the source and target viewports
        var sourceViewport = cornerstone.getViewport(sourceElement);
        var targetViewport = cornerstone.getViewport(targetElement);

        // do nothing if the ww/wc already match
        if (targetViewport.voi.windowWidth === sourceViewport.voi.windowWidth && targetViewport.voi.windowCenter === sourceViewport.voi.windowCenter && targetViewport.invert === sourceViewport.invert) {
            return;
        }

        // www/wc are different, sync them
        targetViewport.voi.windowWidth = sourceViewport.voi.windowWidth;
        targetViewport.voi.windowCenter = sourceViewport.voi.windowCenter;
        targetViewport.invert = sourceViewport.invert;
        synchronizer.setViewport(targetElement, targetViewport);
    }

    // module/private exports
    cornerstoneTools.wwwcSynchronizer = wwwcSynchronizer;

})($, cornerstone, cornerstoneTools);
 
// End Source; src/synchronization/wwwcSynchronizer.js

// Begin Source: src/timeSeriesTools/ProbeTool4D.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    var toolType = 'probe4D';

    function updateLineSample(measurementData) {
        var samples = [];

        measurementData.timeSeries.stacks.forEach(function(stack) {
            cornerstone.loadAndCacheImage(stack.imageIds[measurementData.imageIdIndex]).then(function(image) {
                var offset = Math.round(measurementData.handles.end.x) + Math.round(measurementData.handles.end.y) * image.width;
                var sample = image.getPixelData()[offset];
                samples.push(sample);
                //console.log(sample);
            });
        });
        measurementData.lineSample.set(samples);
    }

    ///////// BEGIN ACTIVE TOOL ///////
    function createNewMeasurement(mouseEventData) {
        var timeSeriestoolData = cornerstoneTools.getToolState(mouseEventData.element, 'timeSeries');
        if (timeSeriestoolData === undefined || timeSeriestoolData.data === undefined || timeSeriestoolData.data.length === 0) {
            return;
        }

        var timeSeries = timeSeriestoolData.data[0];

        // create the measurement data for this tool with the end handle activated
        var measurementData = {
            timeSeries: timeSeries,
            lineSample: new cornerstoneTools.LineSampleMeasurement(),
            imageIdIndex: timeSeries.stacks[timeSeries.currentStackIndex].currentImageIdIndex,
            visible: true,
            handles: {
                end: {
                    x: mouseEventData.currentPoints.image.x,
                    y: mouseEventData.currentPoints.image.y,
                    highlight: true,
                    active: true
                }
            }
        };
        updateLineSample(measurementData);
        cornerstoneTools.MeasurementManager.add(measurementData);
        return measurementData;
    }
    ///////// END ACTIVE TOOL ///////

    ///////// BEGIN IMAGE RENDERING ///////

    function onImageRendered(e, eventData) {

        // if we have no toolData for this element, return immediately as there is nothing to do
        var toolData = cornerstoneTools.getToolState(e.currentTarget, toolType);
        if (toolData === undefined) {
            return;
        }

        // we have tool data for this element - iterate over each one and draw it
        var context = eventData.canvasContext.canvas.getContext('2d');
        cornerstone.setToPixelCoordinateSystem(eventData.enabledElement, context);
        var color = 'white';

        for (var i = 0; i < toolData.data.length; i++) {
            context.save();
            var data = toolData.data[i];

            // draw the handles
            context.beginPath();
            cornerstoneTools.drawHandles(context, eventData, data.handles, color);
            context.stroke();

            // Draw text
            var fontParameters = cornerstoneTools.setContextToDisplayFontSize(eventData.enabledElement, eventData.canvasContext, 15);
            context.font = '' + fontParameters.fontSize + 'px Arial';

            // translate the x/y away from the cursor
            var x = Math.round(data.handles.end.x);
            var y = Math.round(data.handles.end.y);
            var textX = data.handles.end.x + 3;
            var textY = data.handles.end.y - 3;

            context.fillStyle = color;

            context.fillText('' + x + ',' + y, textX, textY);

            context.restore();
        }
    }
    ///////// END IMAGE RENDERING ///////

    // module exports
    cornerstoneTools.probeTool4D = cornerstoneTools.mouseButtonTool({
        createNewMeasurement: createNewMeasurement,
        onImageRendered: onImageRendered,
        toolType: toolType
    });

})($, cornerstone, cornerstoneTools);
 
// End Source; src/timeSeriesTools/ProbeTool4D.js

// Begin Source: src/timeSeriesTools/timeSeries.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    function incrementTimePoint(element, timePoints, wrap) {
        var toolData = cornerstoneTools.getToolState(element, 'timeSeries');
        if (toolData === undefined || toolData.data === undefined || toolData.data.length === 0) {
            return;
        }

        var timeSeriesData = toolData.data[0];
        var currentStack = timeSeriesData.stacks[timeSeriesData.currentStackIndex];
        var currentImageIdIndex = currentStack.currentImageIdIndex;
        var newStackIndex = timeSeriesData.currentStackIndex + timePoints;

        // loop around if we go outside the stack
        if (wrap) {
            if (newStackIndex >= timeSeriesData.stacks.length) {
                newStackIndex = 0;
            }

            if (newStackIndex < 0) {
                newStackIndex = timeSeriesData.stacks.length - 1;
            }
        } else {
            newStackIndex = Math.min(timeSeriesData.stacks.length - 1, newStackIndex);
            newStackIndex = Math.max(0, newStackIndex);
        }

        if (newStackIndex !== timeSeriesData.currentStackIndex) {
            var viewport = cornerstone.getViewport(element);
            var newStack = timeSeriesData.stacks[newStackIndex];

            var startLoadingHandler = cornerstoneTools.loadHandlerManager.getStartLoadHandler();
            var endLoadingHandler = cornerstoneTools.loadHandlerManager.getEndLoadHandler();
            var errorLoadingHandler = cornerstoneTools.loadHandlerManager.getErrorLoadingHandler();

            if (startLoadingHandler) {
                startLoadingHandler(element);
            }

            cornerstone.loadAndCacheImage(newStack.imageIds[currentImageIdIndex]).then(function(image) {
                if (timeSeriesData.currentImageIdIndex !== currentImageIdIndex) {
                    newStack.currentImageIdIndex = currentImageIdIndex;
                    timeSeriesData.currentStackIndex = newStackIndex;
                    cornerstone.displayImage(element, image, viewport);
                    if (endLoadingHandler) {
                        endLoadingHandler(element);
                    }
                }
            }, function(error) {
                var imageId = newStack.imageIds[currentImageIdIndex];
                if (errorLoadingHandler) {
                    errorLoadingHandler(element, imageId, error);
                }
            });
        }
    }

    // module/private exports
    cornerstoneTools.incrementTimePoint = incrementTimePoint;

})($, cornerstone, cornerstoneTools);
 
// End Source; src/timeSeriesTools/timeSeries.js

// Begin Source: src/timeSeriesTools/timeSeriesPlayer.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    var toolType = 'timeSeriesPlayer';

    /**
     * Starts playing a clip or adjusts the frame rate of an already playing clip.  framesPerSecond is
     * optional and defaults to 30 if not specified.  A negative framesPerSecond will play the clip in reverse.
     * The element must be a stack of images
     * @param element
     * @param framesPerSecond
     */
    function playClip(element, framesPerSecond) {
        if (element === undefined) {
            throw 'playClip: element must not be undefined';
        }

        if (framesPerSecond === undefined) {
            framesPerSecond = 30;
        }

        var timeSeriesToolData = cornerstoneTools.getToolState(element, 'timeSeries');
        if (timeSeriesToolData === undefined || timeSeriesToolData.data === undefined || timeSeriesToolData.data.length === 0) {
            return;
        }

        var playClipToolData = cornerstoneTools.getToolState(element, toolType);
        var playClipData;
        if (playClipToolData === undefined || playClipToolData.data.length === 0) {
            playClipData = {
                intervalId: undefined,
                framesPerSecond: framesPerSecond,
                lastFrameTimeStamp: undefined,
                frameRate: 0
            };
            cornerstoneTools.addToolState(element, toolType, playClipData);
        } else {
            playClipData = playClipToolData.data[0];
            playClipData.framesPerSecond = framesPerSecond;
        }

        // if already playing, do not set a new interval
        if (playClipData.intervalId !== undefined) {
            return;
        }

        playClipData.intervalId = setInterval(function() {
            if (playClipData.framesPerSecond > 0) {
                cornerstoneTools.incrementTimePoint(element, 1, true);
            } else {
                cornerstoneTools.incrementTimePoint(element, -1, true);
            }
        }, 1000 / Math.abs(playClipData.framesPerSecond));
    }

    /**
     * Stops an already playing clip.
     * * @param element
     */
    function stopClip(element) {
        var playClipToolData = cornerstoneTools.getToolState(element, toolType);
        var playClipData;
        if (playClipToolData === undefined || playClipToolData.data.length === 0) {
            return;
        } else {
            playClipData = playClipToolData.data[0];
        }

        clearInterval(playClipData.intervalId);
        playClipData.intervalId = undefined;
    }

    // module/private exports
    cornerstoneTools.timeSeriesPlayer = {
        start: playClip,
        stop: stopClip
    };

})($, cornerstone, cornerstoneTools);
 
// End Source; src/timeSeriesTools/timeSeriesPlayer.js

// Begin Source: src/timeSeriesTools/timeSeriesScroll.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    function mouseUpCallback(e, eventData) {
        $(eventData.element).off('CornerstoneToolsMouseDrag', mouseDragCallback);
        $(eventData.element).off('CornerstoneToolsMouseUp', mouseUpCallback);
    }

    function mouseDownCallback(e, eventData) {
        if (cornerstoneTools.isMouseButtonEnabled(eventData.which, e.data.mouseButtonMask)) {

            var mouseDragEventData = {
                deltaY: 0,
                options: e.data.options
            };
            $(eventData.element).on('CornerstoneToolsMouseDrag', mouseDragEventData, mouseDragCallback);
            $(eventData.element).on('CornerstoneToolsMouseUp', mouseUpCallback);
            e.stopImmediatePropagation();
            return false;
        }
    }

    function mouseDragCallback(e, eventData) {
        e.data.deltaY += eventData.deltaPoints.page.y;

        var toolData = cornerstoneTools.getToolState(eventData.element, 'timeSeries');
        if (toolData === undefined || toolData.data === undefined || toolData.data.length === 0) {
            return;
        }

        var timeSeriesData = toolData.data[0];

        var pixelsPerTimeSeries = $(eventData.element).height() / timeSeriesData.stacks.length ;
        if (e.data.options !== undefined && e.data.options.timeSeriesScrollSpeed !== undefined) {
            pixelsPerTimeSeries = e.data.options.timeSeriesScrollSpeed;
        }

        if (e.data.deltaY >= pixelsPerTimeSeries || e.data.deltaY <= -pixelsPerTimeSeries) {
            var timeSeriesDelta = Math.round(e.data.deltaY / pixelsPerTimeSeries);
            var timeSeriesDeltaMod = e.data.deltaY % pixelsPerTimeSeries;
            cornerstoneTools.incrementTimePoint(eventData.element, timeSeriesDelta);
            e.data.deltaY = timeSeriesDeltaMod;
        }

        return false; // false = cases jquery to preventDefault() and stopPropagation() this event
    }

    function mouseWheelCallback(e, eventData) {
        var images = -eventData.direction;
        cornerstoneTools.incrementTimePoint(eventData.element, images);
    }

    function onDrag(e) {
        var mouseMoveData = e.originalEvent.detail;
        var eventData = {
            deltaY: 0
        };
        eventData.deltaY += mouseMoveData.deltaPoints.page.y;

        var toolData = cornerstoneTools.getToolState(mouseMoveData.element, 'stack');
        if (toolData === undefined || toolData.data === undefined || toolData.data.length === 0) {
            return;
        }

        if (eventData.deltaY >= 3 || eventData.deltaY <= -3) {
            var timeSeriesDelta = eventData.deltaY / 3;
            var timeSeriesDeltaMod = eventData.deltaY % 3;
            cornerstoneTools.setTimePoint(eventData.element, timeSeriesDelta);
            eventData.deltaY = timeSeriesDeltaMod;
        }

        return false; // false = cases jquery to preventDefault() and stopPropagation() this event
    }

    // module/private exports
    cornerstoneTools.timeSeriesScroll = cornerstoneTools.simpleMouseButtonTool(mouseDownCallback);
    cornerstoneTools.timeSeriesScrollWheel = cornerstoneTools.mouseWheelTool(mouseWheelCallback);
    cornerstoneTools.timeSeriesScrollTouchDrag = cornerstoneTools.touchDragTool(onDrag);

})($, cornerstone, cornerstoneTools);
 
// End Source; src/timeSeriesTools/timeSeriesScroll.js

// Begin Source: src/util/RoundToDecimal.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    function roundToDecimal(value, precision) {
        var multiplier = Math.pow(10, precision);
        return (Math.round(value * multiplier) / multiplier);
    }

    // module exports
    cornerstoneTools.roundToDecimal = roundToDecimal;

})($, cornerstone, cornerstoneTools);
 
// End Source; src/util/RoundToDecimal.js

// Begin Source: src/util/calculateSUV.js
(function(cornerstoneTools) {

    'use strict';

    function calculateSUV(image, storedPixelValue) {
        // if no dicom data set, return undefined
        if (image.data === undefined) {
            return undefined;
        }
        
        // image must be PET
        if (image.data.string('x00080060') !== 'PT') {
            return undefined;
        }

        var modalityPixelValue = storedPixelValue * image.slope + image.intercept;

        var patientWeight = image.data.floatString('x00101030'); // in kg
        if (patientWeight === undefined) {
            return undefined;
        }

        var petSequence = image.data.elements.x00540016;
        if (petSequence === undefined) {
            return undefined;
        }

        petSequence = petSequence.items[0].dataSet;
        var startTime = petSequence.time('x00181072');
        var totalDose = petSequence.floatString('x00181074');
        var halfLife = petSequence.floatString('x00181075');
        var acquisitionTime = image.data.time('x00080032');
        
        if (!startTime || !totalDose || !halfLife || !acquisitionTime) {
            return undefined;
        }

        var acquisitionTimeInSeconds = acquisitionTime.fractionalSeconds + acquisitionTime.seconds + acquisitionTime.minutes * 60 + acquisitionTime.hours * 60 * 60;
        var injectionStartTimeInSeconds = startTime.fractionalSeconds + startTime.seconds + startTime.minutes * 60 + startTime.hours * 60 * 60;
        var durationInSeconds = acquisitionTimeInSeconds - injectionStartTimeInSeconds;
        var correctedDose = totalDose * Math.exp(-durationInSeconds * Math.log(2) / halfLife);
        var suv = modalityPixelValue * patientWeight / correctedDose * 1000;

        return suv;
    }

    // module exports
    cornerstoneTools.calculateSUV = calculateSUV;

})(cornerstoneTools);
 
// End Source; src/util/calculateSUV.js

// Begin Source: src/util/copyPoints.js
(function($, cornerstone, cornerstoneMath, cornerstoneTools) {

    'use strict';

    function copyPoints(points) {
        var page = cornerstoneMath.point.copy(points.page);
        var image = cornerstoneMath.point.copy(points.image);
        var client = cornerstoneMath.point.copy(points.client);
        var canvas = cornerstoneMath.point.copy(points.canvas);
        return {
            page: page,
            image: image,
            client: client,
            canvas: canvas
        };
    }

    // module exports
    cornerstoneTools.copyPoints = copyPoints;

})($, cornerstone, cornerstoneMath, cornerstoneTools);
 
// End Source; src/util/copyPoints.js

// Begin Source: src/util/drawArrow.js
(function(cornerstoneTools) {

    'use strict';

    function drawArrow(context, start, end, color, lineWidth) {
        //variables to be used when creating the arrow
        var headLength = 10;

        var angle = Math.atan2(end.y - start.y, end.x - start.x);

        //starting path of the arrow from the start square to the end square and drawing the stroke
        context.beginPath();
        context.moveTo(start.x, start.y);
        context.lineTo(end.x, end.y);
        context.strokeStyle = color;
        context.lineWidth = lineWidth;
        context.stroke();

        //starting a new path from the head of the arrow to one of the sides of the point
        context.beginPath();
        context.moveTo(end.x, end.y);
        context.lineTo(end.x - headLength * Math.cos(angle - Math.PI / 7), end.y - headLength * Math.sin(angle - Math.PI / 7));

        //path from the side point of the arrow, to the other side point
        context.lineTo(end.x - headLength * Math.cos(angle + Math.PI / 7), end.y - headLength * Math.sin(angle + Math.PI / 7));

        //path from the side point back to the tip of the arrow, and then again to the opposite side point
        context.lineTo(end.x, end.y);
        context.lineTo(end.x - headLength * Math.cos(angle - Math.PI / 7), end.y - headLength * Math.sin(angle - Math.PI / 7));

        //draws the paths created above
        context.strokeStyle = color;
        context.lineWidth = lineWidth;
        context.stroke();
        context.fillStyle = color;
        context.fill();
    }

    // Module exports
    cornerstoneTools.drawArrow = drawArrow;

})(cornerstoneTools);
 
// End Source; src/util/drawArrow.js

// Begin Source: src/util/drawEllipse.js
(function(cornerstoneTools) {

    'use strict';

    // http://stackoverflow.com/questions/2172798/how-to-draw-an-oval-in-html5-canvas
    function drawEllipse(context, x, y, w, h) {
        var kappa = 0.5522848,
            ox = (w / 2) * kappa, // control point offset horizontal
            oy = (h / 2) * kappa, // control point offset vertical
            xe = x + w, // x-end
            ye = y + h, // y-end
            xm = x + w / 2, // x-middle
            ym = y + h / 2; // y-middle

        context.beginPath();
        context.moveTo(x, ym);
        context.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
        context.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
        context.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
        context.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
        context.closePath();
        context.stroke();
    }

    // Module exports
    cornerstoneTools.drawEllipse = drawEllipse;

})(cornerstoneTools);
 
// End Source; src/util/drawEllipse.js

// Begin Source: src/util/drawTextBox.js
(function(cornerstoneTools) {

    'use strict';

    function drawTextBox(context, textLines, x, y, color) {
        if (Object.prototype.toString.call(textLines) !== '[object Array]') {
            textLines = [ textLines ];
        }

        var padding = 5,
            font = cornerstoneTools.textStyle.getFont(),
            fontSize = cornerstoneTools.textStyle.getFontSize(),
            backgroundColor = cornerstoneTools.textStyle.getBackgroundColor();

        context.save();
        context.font = font;
        context.textBaseline = 'top';
        context.strokeStyle = color;

        // Find the longest text width in the array of text data
        var maxWidth = 0;
        textLines.forEach(function(text) {
            // Get the text width in the current font
            var width = context.measureText(text).width;

            // Find the maximum with for all the text rows;
            maxWidth = Math.max(maxWidth, width);
        });

        // Draw the background box with padding
        context.fillStyle = backgroundColor;

        // Calculate the bounding box for this text box
        var boundingBox = {
            left: x,
            top: y,
            width: maxWidth + (padding * 2),
            height: textLines.length * (fontSize + (padding * 2))
        };
        context.fillRect(boundingBox.left, boundingBox.top, boundingBox.width, boundingBox.height);

        // Draw each of the text lines on top of the background box
        textLines.forEach(function(text, index) {
            context.fillStyle = color;
            context.fillText(text, x + padding, y + fontSize * index + padding);

        });

        context.restore();

        // Return the bounding box so it can be used for pointNearHandle
        return boundingBox;
    }

    // module exports
    cornerstoneTools.drawTextBox = drawTextBox;

})(cornerstoneTools);
 
// End Source; src/util/drawTextBox.js

// Begin Source: src/util/getLuminance.js
(function(cornerstone, cornerstoneTools) {

    'use strict';

    function getLuminance(element, x, y, width, height) {
        if (!element) {
            throw 'getLuminance: parameter element must not be undefined';
        }

        x = Math.round(x);
        y = Math.round(y);
        var enabledElement = cornerstone.getEnabledElement(element);
        var luminance = [];
        var index = 0;
        var pixelData = enabledElement.image.getPixelData();
        var spIndex,
            row,
            column;

        if (enabledElement.image.color) {
            for (row = 0; row < height; row++) {
                for (column = 0; column < width; column++) {
                    spIndex = (((row + y) * enabledElement.image.columns) + (column + x)) * 4;
                    var red = pixelData[spIndex];
                    var green = pixelData[spIndex + 1];
                    var blue = pixelData[spIndex + 2];
                    luminance[index++] = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
                }
            }
        } else {
            for (row = 0; row < height; row++) {
                for (column = 0; column < width; column++) {
                    spIndex = ((row + y) * enabledElement.image.columns) + (column + x);
                    luminance[index++] = pixelData[spIndex];
                }
            }
        }

        return luminance;
    }

    // module exports
    cornerstoneTools.getLuminance = getLuminance;

})(cornerstone, cornerstoneTools);
 
// End Source; src/util/getLuminance.js

// Begin Source: src/util/getMaxSimultaneousRequests.js
(function(cornerstone, cornerstoneTools) {

    'use strict';

    // Maximum concurrent connections to the same server
    // Information from http://sgdev-blog.blogspot.fr/2014/01/maximum-concurrent-connection-to-same.html
    var maxSimultaneousRequests = {
        default: 6,
        IE: {
            9: 6,
            10: 8,
            default: 8
        },
        Firefox: {
            default: 6
        },
        Opera: {
            10: 8,
            11: 6,
            12: 6,
            default: 6
        },
        Chrome: {
            default: 6
        },
        Safari: {
            default: 4
        }
    };

    // Browser name / version detection
    // http://stackoverflow.com/questions/2400935/browser-detection-in-javascript
    function getBrowserInfo() {
        var ua = navigator.userAgent,
            M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [],
            tem;
        
        if (/trident/i.test(M[1])) {
            tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
            return 'IE ' + (tem[1] || '');
        }

        if (M[1] === 'Chrome') {
            tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
            if (tem !== null) {
                return tem.slice(1).join(' ').replace('OPR', 'Opera');
            }
        }

        M = M[2]? [ M[1], M[2] ]: [ navigator.appName, navigator.appVersion, '-?' ];
        if ((tem = ua.match(/version\/(\d+)/i)) !== null) {
            M.splice(1, 1, tem[1]);
        }

        return M.join(' ');
    }

    function getMaxSimultaneousRequests() {
        var config = cornerstoneTools.stackPrefetch.getConfiguration();

        // Give preference to user-chosen values
        if (config.maxSimultaneousRequests) {
            return config.maxSimultaneousRequests;
        }

        var infoString = getBrowserInfo();
        var info = infoString.split(' ');
        var browserName = info[0];
        var browserVersion = info[1];
        var browserData = maxSimultaneousRequests[browserName];

        if (!browserData) {
            return maxSimultaneousRequests['default'];
        }

        if (!browserData[browserVersion]) {
            return browserData['default'];
        }

        return browserData[browserVersion];
    }

    // module exports
    cornerstoneTools.getMaxSimultaneousRequests = getMaxSimultaneousRequests;
    cornerstoneTools.getBrowserInfo = getBrowserInfo;

})(cornerstone, cornerstoneTools);
 
// End Source; src/util/getMaxSimultaneousRequests.js

// Begin Source: src/util/getRGBPixels.js
(function(cornerstone, cornerstoneTools) {

    'use strict';

    function getRGBPixels(element, x, y, width, height) {
        if (!element) {
            throw 'getRGBPixels: parameter element must not be undefined';
        }

        x = Math.round(x);
        y = Math.round(y);
        var enabledElement = cornerstone.getEnabledElement(element);
        var storedPixelData = [];
        var index = 0;
        var pixelData = enabledElement.image.getPixelData();
        var spIndex,
            row,
            column;

        if (enabledElement.image.color) {
            for (row = 0; row < height; row++) {
                for (column = 0; column < width; column++) {
                    spIndex = (((row + y) * enabledElement.image.columns) + (column + x)) * 4;
                    var red = pixelData[spIndex];
                    var green = pixelData[spIndex + 1];
                    var blue = pixelData[spIndex + 2];
                    var alpha = pixelData[spIndex + 3];
                    storedPixelData[index++] = red;
                    storedPixelData[index++] = green;
                    storedPixelData[index++] = blue;
                    storedPixelData[index++] = alpha;
                }
            }
        }

        return storedPixelData;
    }

    // module exports
    cornerstoneTools.getRGBPixels = getRGBPixels;

})(cornerstone, cornerstoneTools);
 
// End Source; src/util/getRGBPixels.js

// Begin Source: src/util/isMouseButtonEnabled.js
(function(cornerstone, cornerstoneTools) {

    'use strict';

    function isMouseButtonEnabled(which, mouseButtonMask) {
        /*jshint bitwise: false*/
        var mouseButton = (1 << (which - 1));
        return ((mouseButtonMask & mouseButton) !== 0);
    }

    // module exports
    cornerstoneTools.isMouseButtonEnabled = isMouseButtonEnabled;

})(cornerstone, cornerstoneTools);
 
// End Source; src/util/isMouseButtonEnabled.js

// Begin Source: src/util/pauseEvent.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    /**
     * This function is used to prevent selection from occuring when left click dragging on the image
     * @param e the event that is provided to your event handler
     * Based on: http://stackoverflow.com/questions/5429827/how-can-i-prevent-text-element-selection-with-cursor-drag
     * @returns {boolean}
     */
    function pauseEvent(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }

        if (e.preventDefault) {
            e.preventDefault();
        }

        e.cancelBubble = true;
        e.returnValue = false;
        return false;
    }

    // module exports
    cornerstoneTools.pauseEvent = pauseEvent;

})($, cornerstone, cornerstoneTools);
 
// End Source; src/util/pauseEvent.js

// Begin Source: src/util/pointProjector.js
(function($, cornerstone, cornerstoneTools) {

    'use strict';

    // projects a patient point to an image point
    function projectPatientPointToImagePlane(patientPoint, imagePlane) {
        var point = patientPoint.clone().sub(imagePlane.imagePositionPatient);
        var x = imagePlane.rowCosines.dot(point) / imagePlane.columnPixelSpacing;
        var y = imagePlane.columnCosines.dot(point) / imagePlane.rowPixelSpacing;
        return {
            x: x,
            y: y
        };
    }

    // projects an image point to a patient point
    function imagePointToPatientPoint(imagePoint, imagePlane) {
        var x = imagePlane.rowCosines.clone().multiplyScalar(imagePoint.x);
        x.multiplyScalar(imagePlane.columnPixelSpacing);
        var y = imagePlane.columnCosines.clone().multiplyScalar(imagePoint.y);
        y.multiplyScalar(imagePlane.rowPixelSpacing);
        var patientPoint = x.add(y);
        patientPoint.add(imagePlane.imagePositionPatient);
        return patientPoint;
    }

    function getRectangleFromImagePlane(imagePlane) {
        // Get the points
        var topLeft = imagePointToPatientPoint({
            x: 0,
            y: 0
        }, imagePlane);
        var topRight = imagePointToPatientPoint({
            x: imagePlane.columns,
            y: 0
        }, imagePlane);
        var bottomLeft = imagePointToPatientPoint({
            x: 0,
            y: imagePlane.rows
        }, imagePlane);
        var bottomRight = imagePointToPatientPoint({
            x: imagePlane.columns,
            y: imagePlane.rows
        }, imagePlane);

        // Get each side as a vector
        var rect = {
            top: new cornerstoneMath.Line3(topLeft, topRight),
            left: new cornerstoneMath.Line3(topLeft, bottomLeft),
            right: new cornerstoneMath.Line3(topRight, bottomRight),
            bottom: new cornerstoneMath.Line3(bottomLeft, bottomRight),
        };
        return rect;
    }

    function lineRectangleIntersection(line, rect) {
        var intersections = [];
        Object.keys(rect).forEach(function(side) {
            var segment = rect[side];
            var intersection = line.intersectLine(segment);
            if (intersection) {
                intersections.push(intersection);
            }
        });
        return intersections;
    }

    function planePlaneIntersection(targetImagePlane, referenceImagePlane) {
        // Gets the line of intersection between two planes in patient space

        // First, get the normals of each image plane
        var targetNormal = targetImagePlane.rowCosines.clone().cross(targetImagePlane.columnCosines);
        var targetPlane = new cornerstoneMath.Plane();
        targetPlane.setFromNormalAndCoplanarPoint(targetNormal, targetImagePlane.imagePositionPatient);

        var referenceNormal = referenceImagePlane.rowCosines.clone().cross(referenceImagePlane.columnCosines);
        var referencePlane = new cornerstoneMath.Plane();
        referencePlane.setFromNormalAndCoplanarPoint(referenceNormal, referenceImagePlane.imagePositionPatient);

        var originDirection = referencePlane.clone().intersectPlane(targetPlane);
        var origin = originDirection.origin;
        var direction = originDirection.direction;

        // Calculate the longest possible length in the reference image plane (the length of the diagonal)
        var bottomRight = imagePointToPatientPoint({
            x: referenceImagePlane.columns,
            y: referenceImagePlane.rows
        }, referenceImagePlane);
        var distance = referenceImagePlane.imagePositionPatient.distanceTo(bottomRight);

        // Use this distance to bound the ray intersecting the two planes
        var line = new cornerstoneMath.Line3();
        line.start = origin;
        line.end = origin.clone().add(direction.multiplyScalar(distance));

        // Find the intersections between this line and the reference image plane's four sides
        var rect = getRectangleFromImagePlane(referenceImagePlane);
        var intersections = lineRectangleIntersection(line, rect);

        // Return the intersections between this line and the reference image plane's sides
        // in order to draw the reference line from the target image.
        if (intersections.length !== 2) {
            return;
        }

        var points = {
            start: intersections[0],
            end: intersections[1]
        };
        return points;

    }

    // module/private exports
    cornerstoneTools.projectPatientPointToImagePlane = projectPatientPointToImagePlane;
    cornerstoneTools.imagePointToPatientPoint = imagePointToPatientPoint;
    cornerstoneTools.planePlaneIntersection = planePlaneIntersection;

})($, cornerstone, cornerstoneTools);
 
// End Source; src/util/pointProjector.js

// Begin Source: src/util/scroll.js
(function(cornerstone, cornerstoneTools) {

    'use strict';

    function scroll(element, images) {
        var toolData = cornerstoneTools.getToolState(element, 'stack');
        if (toolData === undefined || toolData.data === undefined || toolData.data.length === 0) {
            return;
        }

        var stackData = toolData.data[0];

        var newImageIdIndex = stackData.currentImageIdIndex + images;
        newImageIdIndex = Math.min(stackData.imageIds.length - 1, newImageIdIndex);
        newImageIdIndex = Math.max(0, newImageIdIndex);

        cornerstoneTools.scrollToIndex(element, newImageIdIndex);
    }

    // module exports
    cornerstoneTools.scroll = scroll;

})(cornerstone, cornerstoneTools);
 
// End Source; src/util/scroll.js

// Begin Source: src/util/scrollToIndex.js
(function(cornerstone, cornerstoneTools) {

    'use strict';

    function scrollToIndex(element, newImageIdIndex) {
        var toolData = cornerstoneTools.getToolState(element, 'stack');
        if (toolData === undefined || toolData.data === undefined || toolData.data.length === 0) {
            return;
        }

        var stackData = toolData.data[0];

        // Allow for negative indexing
        if (newImageIdIndex < 0) {
            newImageIdIndex += stackData.imageIds.length;
        }

        var startLoadingHandler = cornerstoneTools.loadHandlerManager.getStartLoadHandler();
        var endLoadingHandler = cornerstoneTools.loadHandlerManager.getEndLoadHandler();
        var errorLoadingHandler = cornerstoneTools.loadHandlerManager.getErrorLoadingHandler();

        function doneCallback(image) {
            //console.log('interaction done: ' + image.imageId);
            if (stackData.currentImageIdIndex === newImageIdIndex) {
                cornerstone.displayImage(element, image, viewport);
                if (endLoadingHandler) {
                    endLoadingHandler(element);
                }
            }
        }

        function failCallback(error) {
            var imageId = stackData.imageIds[newImageIdIndex];
            if (errorLoadingHandler) {
                errorLoadingHandler(element, imageId, error);
            }
        }

        if (newImageIdIndex === stackData.currentImageIdIndex) {
            return;
        }

        if (startLoadingHandler) {
            startLoadingHandler(element);
        }

        var eventData = {
            newImageIdIndex: newImageIdIndex,
            direction: newImageIdIndex - stackData.currentImageIdIndex
        };

        stackData.currentImageIdIndex = newImageIdIndex;
        var viewport = cornerstone.getViewport(element);
        var newImageId = stackData.imageIds[newImageIdIndex];

        // Retry image loading in cases where previous image promise
        // was rejected, if the option is set
        var config = cornerstoneTools.stackScroll.getConfiguration();
        if (config && config.retryLoadOnScroll === true) {
            var newImagePromise = cornerstone.imageCache.getImagePromise(newImageId);
            if (newImagePromise && newImagePromise.state() === 'rejected') {
                cornerstone.imageCache.removeImagePromise(newImageId);
            }
        }

        var requestPoolManager = cornerstoneTools.requestPoolManager;
        var type = 'interaction';

        cornerstoneTools.requestPoolManager.clearRequestStack(type);

        requestPoolManager.addRequest(element, newImageId, type, doneCallback, failCallback);
        requestPoolManager.startGrabbing();

        $(element).trigger('CornerstoneStackScroll', eventData);
    }

    // module exports
    cornerstoneTools.scrollToIndex = scrollToIndex;
    cornerstoneTools.loadHandlers = {};

})(cornerstone, cornerstoneTools);
 
// End Source; src/util/scrollToIndex.js

// Begin Source: src/util/setContextToDisplayFontSize.js
/**
 * This module sets the transformation matrix for a canvas context so it displays fonts
 * smoothly even when the image is highly scaled up
 */
(function(cornerstone, cornerstoneTools) {

    'use strict';

    /**
     * Sets the canvas context transformation matrix so it is scaled to show text
     * more cleanly even if the image is scaled up.  See
     * https://github.com/chafey/cornerstoneTools/wiki/DrawingText
     * for more information
     *
     * @param ee
     * @param context
     * @param fontSize
     * @returns {{fontSize: number, lineHeight: number, fontScale: number}}
     */
    function setContextToDisplayFontSize(ee, context, fontSize) {
        var fontScale = 0.1;
        cornerstone.setToPixelCoordinateSystem(ee, context, fontScale);
        // return the font size to use
        var scaledFontSize = fontSize / ee.viewport.scale / fontScale;
        // TODO: actually calculate this?
        var lineHeight = fontSize / ee.viewport.scale / fontScale;
        return {
            fontSize: scaledFontSize,
            lineHeight: lineHeight,
            fontScale: fontScale
        };
    }

    // Module exports
    cornerstoneTools.setContextToDisplayFontSize = setContextToDisplayFontSize;

})(cornerstone, cornerstoneTools);
 
// End Source; src/util/setContextToDisplayFontSize.js
