(function($, cornerstone, cornerstoneMath, cornerstoneTools) {

    'use strict';

    var toolType = 'nonTarget';

    var configuration = {
        setLesionNumberCallback: setLesionNumberCallback,
        getLesionLocationCallback: getLesionLocationCallback,
        changeLesionLocationCallback: changeLesionLocationCallback,
        drawHandles: false,
        drawHandlesOnHover: true,
        arrowFirst: true
    };

    // Used to cancel tool placement
    var keys = {
        ESC: 27
    };

    // Set lesion number
    // Get Non-Target lesions on image
    function setLesionNumberCallback(measurementData, eventData, doneCallback) {
        var lesionNumber = 1;
        doneCallback(lesionNumber);
    }
    // Define a callback to get your text annotation
    // This could be used, e.g. to open a modal
    function getLesionLocationCallback(measurementData, eventData, doneCallback) {
        doneCallback(prompt('Enter your lesion location:'));
    }

    function changeLesionLocationCallback(measurementData, eventData, doneCallback) {
        doneCallback(prompt('Change your lesion location:'));
    }

    /// --- Mouse Tool --- ///
    ///////// BEGIN ACTIVE TOOL ///////
    function addNewMeasurement(mouseEventData) {
        var element = mouseEventData.element;

        function doneCallback(lesionNumber) {
            measurementData.lesionNumber = lesionNumber;
            measurementData.active = true;
            cornerstone.updateImage(element);
        }

        var measurementData = createNewMeasurement(mouseEventData);

        var eventData = {
            mouseButtonMask: mouseEventData.which
        };

        var config = cornerstoneTools.nonTarget.getConfiguration();

        // Set lesion number and lesion name
        if (measurementData.lesionNumber === undefined) {
            config.setLesionNumberCallback(measurementData, mouseEventData, doneCallback);
        }

        // associate this data with this imageId so we can render it and manipulate it
        cornerstoneTools.addToolState(mouseEventData.element, toolType, measurementData);

        // since we are dragging to another place to drop the end point, we can just activate
        // the end point and let the moveHandle move it for us.
        $(element).off('CornerstoneToolsMouseMove', cornerstoneTools.nonTarget.mouseMoveCallback);
        $(element).off('CornerstoneToolsMouseDown', cornerstoneTools.nonTarget.mouseDownCallback);
        $(element).off('CornerstoneToolsMouseDownActivate', cornerstoneTools.nonTarget.mouseDownActivateCallback);
        $(element).off('CornerstoneToolsMouseDoubleClick', doubleClickCallback);

        // Add a flag for using Esc to cancel tool placement
        var cancelled = false;
        function cancelCallback(e) {
            // If the Esc key was pressed, set the flag to true
            if (e.which === keys.ESC) {
                cancelled = true;
                cornerstoneTools.removeToolState(mouseEventData.element, toolType, measurementData);
            }

            // Don't propagate this keydown event so it can't interfere
            // with anything outside of this tool
            return false;
        }

        // Bind a one-time event listener for the Esc key
        $(element).one('keydown', cancelCallback);

        cornerstone.updateImage(element);

        cornerstoneTools.moveNewHandle(mouseEventData, toolType, measurementData, measurementData.handles.end, function() {
            if (cancelled || cornerstoneTools.anyHandlesOutsideImage(mouseEventData, measurementData.handles)) {
                // delete the measurement
                cornerstoneTools.removeToolState(mouseEventData.element, toolType, measurementData);
            } else {
                config.getLesionLocationCallback(measurementData, mouseEventData, doneCallback);
            }

            // Unbind the Esc keydown hook
            $(element).off('keydown', cancelCallback);

            $(element).on('CornerstoneToolsMouseMove', eventData, cornerstoneTools.nonTarget.mouseMoveCallback);
            $(element).on('CornerstoneToolsMouseDown', eventData, cornerstoneTools.nonTarget.mouseDownCallback);
            $(element).on('CornerstoneToolsMouseDownActivate', eventData, cornerstoneTools.nonTarget.mouseDownActivateCallback);
            $(element).on('CornerstoneToolsMouseDoubleClick', eventData, doubleClickCallback);

            $(element).off('keydown', cancelCallback);

            cornerstone.updateImage(mouseEventData.element);
        });
    }

    function createNewMeasurement(mouseEventData) {
        var imageId = mouseEventData.image.imageId;

        // Get studyInstanceUid
        var study = cornerstoneTools.metaData.get('study', imageId);
        var studyInstanceUid = study.studyInstanceUid;
        var patientId = study.patientId;

        // Get seriesInstanceUid
        var series = cornerstoneTools.metaData.get('series', imageId);
        var seriesInstanceUid = series.seriesInstanceUid;

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
                },
                textBox: {
                    x: mouseEventData.currentPoints.image.x - 50,
                    y: mouseEventData.currentPoints.image.y - 50,
                    active: false,
                    movesIndependently: false,
                    drawnIndependently: true,
                    allowedOutsideImage: true,
                    hasBoundingBox: true
                }
            },
            imageId: imageId,
            seriesInstanceUid: seriesInstanceUid,
            studyInstanceUid: studyInstanceUid,
            patientId: patientId,
            response: '',
            isTarget: false,
            toolType: 'nonTarget'
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

        if (cornerstoneTools.pointInsideBoundingBox(data.handles.textBox, coords)) {
            return true;
        }

        return distanceToPoint < 25;
    }

    ///////// BEGIN IMAGE RENDERING ///////
    function onImageRendered(e, eventData) {
        var element = eventData.element;

        // if we have no toolData for this element, return immediately as there is nothing to do
        var toolData = cornerstoneTools.getToolState(element, toolType);
        if (!toolData) {
            return;
        }

        // we have tool data for this element - iterate over each one and draw it
        var context = eventData.canvasContext.canvas.getContext('2d');
        context.setTransform(1, 0, 0, 1, 0, 0);

        var color;
        var lineWidth = cornerstoneTools.toolStyle.getToolWidth();
        var font = cornerstoneTools.textStyle.getFont();
        var config = cornerstoneTools.nonTarget.getConfiguration();

        context.font = font;
        for (var i = 0; i < toolData.data.length; i++) {
            var data = toolData.data[i];

            context.save();

            // configurable shadow from CornerstoneTools
            if (config && config.shadow) {
                context.shadowColor = '#000000';
                context.shadowOffsetX = 1;
                context.shadowOffsetY = 1;
            }

            if (data.active) {
                color = cornerstoneTools.toolColors.getActiveColor();
            } else {
                color = cornerstoneTools.toolColors.getToolColor();
            }

            // Draw the arrow
            var handleStartCanvas = cornerstone.pixelToCanvas(element, data.handles.start);
            var handleEndCanvas = cornerstone.pixelToCanvas(element, data.handles.end);
            var canvasTextLocation = cornerstone.pixelToCanvas(element, data.handles.textBox);

            cornerstoneTools.drawArrow(context, handleEndCanvas, handleStartCanvas, color, lineWidth);

            if (config.drawHandles) {
                cornerstoneTools.drawHandles(context, eventData, data.handles, color);
            } else if (config.drawHandlesOnHover && data.handles.start.active) {
                cornerstoneTools.drawHandles(context, eventData, [ lesion.handles.start ], color);
            } else if (config.drawHandlesOnHover && data.handles.end.active) {
                cornerstoneTools.drawHandles(context, eventData, [ lesion.handles.end ], color);
            }

            // Draw the text
            if (data.lesionNumber) {
                // Draw linked line as dashed
                var mid = {
                    x: (handleStartCanvas.x + handleEndCanvas.x) / 2,
                    y: (handleStartCanvas.y + handleEndCanvas.y) / 2
                };

                context.beginPath();
                context.strokeStyle = color;
                context.lineWidth = lineWidth;
                context.setLineDash([ 2, 3 ]);

                context.moveTo(mid.x, mid.y);
                context.lineTo(canvasTextLocation.x + 20, canvasTextLocation.y + 20);
                context.stroke();

                var boundingBox = cornerstoneTools.drawTextBox(context, 'Non-Target ' + data.lesionNumber, canvasTextLocation.x, canvasTextLocation.y, color);
                data.handles.textBox.boundingBox = boundingBox;
            }

            context.restore();
        }
    }

    // ---- Touch tool ----

    ///////// BEGIN ACTIVE TOOL ///////
    function addNewMeasurementTouch(touchEventData) {
        var element = touchEventData.element;

        function doneCallback(lesionNumber) {
            measurementData.lesionNumber = lesionNumber;
            measurementData.active = true;
            cornerstone.updateImage(element);
        }

        var measurementData = createNewMeasurement(touchEventData);
        cornerstoneTools.addToolState(element, toolType, measurementData);
        $(element).off('CornerstoneToolsTouchDrag', cornerstoneTools.nonTargetTouch.touchMoveHandle);
        $(element).off('CornerstoneToolsDragStartActive', cornerstoneTools.nonTargetTouch.touchDownActivateCallback);
        $(element).off('CornerstoneToolsTap', cornerstoneTools.nonTargetTouch.tapCallback);
        var config = cornerstoneTools.nonTarget.getConfiguration();

        // Set lesion number and lesion name
        if (measurementData.lesionName === undefined) {
            config.setLesionNumberCallback(measurementData, touchEventData, doneCallback);
        }

        cornerstone.updateImage(element);

        cornerstoneTools.moveNewHandleTouch(touchEventData, toolType, measurementData, measurementData.handles.end, function() {
            cornerstone.updateImage(element);

            if (cornerstoneTools.anyHandlesOutsideImage(touchEventData, measurementData.handles)) {
                // delete the measurement
                cornerstoneTools.removeToolState(element, toolType, measurementData);
            }

            config.getLesionLocationCallback(measurementData, touchEventData, doneCallback);

            $(element).on('CornerstoneToolsTouchDrag', cornerstoneTools.nonTargetTouch.touchMoveHandle);
            $(element).on('CornerstoneToolsDragStartActive', cornerstoneTools.nonTargetTouch.touchDownActivateCallback);
            $(element).on('CornerstoneToolsTap', cornerstoneTools.nonTargetTouch.tapCallback);
        });
    }

    function doubleClickCallback(e, eventData) {
        var element = eventData.element;
        var data;

        function doneCallback(data, deleteTool) {
            if (deleteTool === true) {
                cornerstoneTools.removeToolState(element, toolType, data);
                cornerstone.updateImage(element);
                return;
            }

            data.active = false;
            cornerstone.updateImage(element);
        }

        if (e.data && e.data.mouseButtonMask && !cornerstoneTools.isMouseButtonEnabled(eventData.which, e.data.mouseButtonMask)) {
            return false;
        }

        var config = cornerstoneTools.nonTarget.getConfiguration();

        var coords = eventData.currentPoints.canvas;
        var toolData = cornerstoneTools.getToolState(element, toolType);

        // now check to see if there is a handle we can move
        if (!toolData) {
            return;
        }

        for (var i = 0; i < toolData.data.length; i++) {
            data = toolData.data[i];
            if (pointNearTool(element, data, coords)) {
                data.active = true;
                cornerstone.updateImage(element);
                // Allow relabelling via a callback
                config.changeLesionLocationCallback(data, eventData, doneCallback);

                e.stopImmediatePropagation();
                return false;
            }
        }
    }

    cornerstoneTools.nonTarget = cornerstoneTools.mouseButtonTool({
        addNewMeasurement: addNewMeasurement,
        createNewMeasurement: createNewMeasurement,
        onImageRendered: onImageRendered,
        pointNearTool: pointNearTool,
        toolType: toolType,
        mouseDoubleClickCallback: doubleClickCallback
    });

    cornerstoneTools.nonTarget.setConfiguration(configuration);

    cornerstoneTools.nonTargetTouch = cornerstoneTools.touchTool({
        addNewMeasurement: addNewMeasurementTouch,
        createNewMeasurement: createNewMeasurement,
        onImageRendered: onImageRendered,
        pointNearTool: pointNearTool,
        toolType: toolType
        // pressCallback: doubleClickCallback
    });

})($, cornerstone, cornerstoneMath, cornerstoneTools);
