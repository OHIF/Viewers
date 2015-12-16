var cornerstoneTools = (function($, cornerstone, cornerstoneMath, cornerstoneTools) {

    "use strict";

    if (cornerstoneTools === undefined) {
        cornerstoneTools = {};
    }

    var configuration = {
        setLesionNumberCallback: setLesionNumberCallback,
        getLesionLocationCallback: getLesionLocationCallback,
        changeLesionLocationCallback: changeLesionLocationCallback
    };

    // Set lesion number
    // Get Target lesions on image
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

    var toolType = "biDirectional";

    ///////// BEGIN ACTIVE TOOL ///////

    function addNewMeasurement(mouseEventData) {
        var element = mouseEventData.element;

        function doneCallback(lesionNumber) {
            measurementData.lesionName = "Bi-Directional " + lesionNumber;
            measurementData.lesionNumber = lesionNumber;
            measurementData.active = false;
            cornerstone.updateImage(element);
        }

        var measurementData = createNewMeasurement(mouseEventData);

        var eventData = {
            mouseButtonMask: mouseEventData.which
        };
        var config = cornerstoneTools.biDirectional.getConfiguration();

        // associate this data with this imageId so we can render it and manipulate it
        cornerstoneTools.addToolState(element, toolType, measurementData);

        // since we are dragging to another place to drop the end point, we can just activate
        // the end point and let the moveHandle move it for us.
        $(element).off('CornerstoneToolsMouseMove', cornerstoneTools.biDirectional.mouseMoveCallback);
        $(element).off('CornerstoneToolsMouseDown', cornerstoneTools.biDirectional.mouseDownCallback);
        $(element).off('CornerstoneToolsMouseDownActivate', cornerstoneTools.biDirectional.mouseDownActivateCallback);

        // Set lesion number and lesion name
        if (measurementData.lesionNumber === undefined) {
            config.setLesionNumberCallback(measurementData, mouseEventData, doneCallback);
        }

        cornerstone.updateImage(element);
        cornerstoneTools.moveNewHandle(mouseEventData, toolType, measurementData, measurementData.handles.end, function() {
            if (cornerstoneTools.anyHandlesOutsideImage(mouseEventData, measurementData.handles)) {
                // delete the measurement
                cornerstoneTools.removeToolState(element, toolType, measurementData);
            }
            $(element).on('CornerstoneToolsMouseMove', eventData, cornerstoneTools.biDirectional.mouseMoveCallback);
            $(element).on('CornerstoneToolsMouseDown', eventData, cornerstoneTools.biDirectional.mouseDownCallback);
            $(element).on('CornerstoneToolsMouseDownActivate', eventData, cornerstoneTools.biDirectional.mouseDownActivateCallback);
            cornerstone.updateImage(element);

            //updateLesionCollection(measurementData);
        });
    }

    function addNewMeasurementTouch(touchEventData) {
        var element = touchEventData.element;

        function doneCallback(lesionNumber) {
            measurementData.lesionName = "Bi-Directional " + lesionNumber;
            measurementData.lesionNumber = lesionNumber;
            measurementData.active = false;
            cornerstone.updateImage(element);
        }

        var measurementData = createNewMeasurement(touchEventData);

        // associate this data with this imageId so we can render it and manipulate it
        cornerstoneTools.addToolState(element, toolType, measurementData);

        // since we are dragging to another place to drop the end point, we can just activate
        // the end point and let the moveHandle move it for us.
        $(element).off('CornerstoneToolsTouchDrag', cornerstoneTools.biDirectional.touchMoveHandle);
        $(element).off('CornerstoneToolsTap', cornerstoneTools.biDirectional.tapCallback);
        $(element).off('CornerstoneToolsDragStartActive', cornerstoneTools.biDirectional.touchDownActivateCallback);

        cornerstone.updateImage(element);
        cornerstoneTools.moveNewHandleTouch(touchEventData, toolType, measurementData, measurementData.handles.end, function() {
            if (cornerstoneTools.anyHandlesOutsideImage(touchEventData, measurementData.handles)) {
                // delete the measurement
                cornerstoneTools.removeToolState(element, toolType, measurementData);
            } else {
                // Set lesionMeasurementData Session
                var config = cornerstoneTools.biDirectional.getConfiguration();
                //config.getLesionLocationCallback(measurementData, touchEventData, doneCallback);
            }

            $(element).on('CornerstoneToolsTouchDrag', cornerstoneTools.biDirectional.touchMoveHandle);
            $(element).on('CornerstoneToolsTap', cornerstoneTools.biDirectional.tapCallback);
            $(element).on('CornerstoneToolsDragStartActive', cornerstoneTools.biDirectional.touchDownActivateCallback);
            cornerstone.updateImage(element);
        });
    }

    function createNewMeasurement(mouseEventData) {
        var imageId = mouseEventData.image.imageId;

        // Get studyInstanceUid
        var study = cornerstoneTools.metaData.get('study', imageId);
        var studyInstanceUid = study.studyInstanceUid;
        var patientId =  study.patientId;

        // Get seriesInstanceUid
        var series = cornerstoneTools.metaData.get('series', imageId);
        var seriesInstanceUid = series.seriesInstanceUid;

        // Create the measurement data for this tool with the end handle activated
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
                },
                textBox: {
                    x: mouseEventData.currentPoints.image.x - 50,
                    y: mouseEventData.currentPoints.image.y - 50,
                    pointNearHandle: pointNearTextBox,
                    active: false,
                    movesIndependently: true,
                    drawnIndependently: true,
                    allowedOutsideImage: true
                },

                perpendicularStart: {
                    x: mouseEventData.currentPoints.image.x,
                    y: mouseEventData.currentPoints.image.y,
                    highlight: true,
                    active: false
                },

                perpendicularEnd: {
                    x: mouseEventData.currentPoints.image.x,
                    y: mouseEventData.currentPoints.image.y,
                    highlight: true,
                    active: false
                }


            },
            imageId: imageId,
            seriesInstanceUid: seriesInstanceUid,
            studyInstanceUid: studyInstanceUid,
            patientId: patientId,
            measurementText: 0,
            perpendicularMeasurement: 0,
            lesionName: 'Bi-Directional',
            isDeleted: false,
            isTarget: true,
            uid: uuid.v4()
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

        if (pointNearTextBox(element, data.handles.textBox, coords)) {
            return true;
        }

        if (pointNearPerpendicular(element, data.handles, coords)) {
            return true;
        }

        return (distanceToPoint < 25);
    }

    function pointNearTextBox(element, handle, coords) {
        if (!handle.boundingBox) {
            return;
        }
        return cornerstoneMath.point.insideRect(coords, handle.boundingBox);
    }

    function pointNearPerpendicular(element, handles, coords) {
        var lineSegment = {
            start: cornerstone.pixelToCanvas(element, handles.perpendicularStart),
            end: cornerstone.pixelToCanvas(element, handles.perpendicularEnd)
        };
        var distanceToPoint = cornerstoneMath.lineSegment.distanceToPoint(lineSegment, coords);
        return (distanceToPoint < 5);
    }

    function drawPerpendicularLine(context, eventData,element, data, color, lineWidth) {

        // mid point of long-axis line
        var mid = {
            x: (data.handles.start.x + data.handles.end.x) / 2,
            y: (data.handles.start.y + data.handles.end.y) / 2
        };

        // Length of long-axis
        var dx = (data.handles.start.x - data.handles.end.x) * (eventData.image.columnPixelSpacing || 1);
        var dy = (data.handles.start.y - data.handles.end.y) * (eventData.image.rowPixelSpacing || 1);
        var length = Math.sqrt(dx * dx + dy * dy);

        var vectorX = (data.handles.start.x - data.handles.end.x) / length;
        var vectorY = (data.handles.start.y - data.handles.end.y) / length;

        var perpendicularLineLength = length / 2;

        data.handles.perpendicularStart = {x: mid.x + (perpendicularLineLength / 2) * vectorY, y: mid.y - (perpendicularLineLength / 2) * vectorX};
        data.handles.perpendicularEnd = {x: mid.x - (perpendicularLineLength / 2) * vectorY, y: mid.y + (perpendicularLineLength / 2) * vectorX};

        // Draw perpendicular line
        var perpendicularStartCanvas  = cornerstone.pixelToCanvas(element, data.handles.perpendicularStart);
        var perpendicularEndCanvas  = cornerstone.pixelToCanvas(element, data.handles.perpendicularEnd);
        context.beginPath();
        context.strokeStyle = color;
        context.lineWidth = lineWidth;
        context.moveTo(perpendicularStartCanvas.x, perpendicularStartCanvas.y);
        context.lineTo(perpendicularEndCanvas.x, perpendicularEndCanvas.y);
        context.stroke();

        // Draw handles
        cornerstoneTools.drawHandles(context, eventData, data.handles, color);

    }


    ///////// BEGIN IMAGE RENDERING ///////
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
        var element = eventData.element;
        var lineWidth = cornerstoneTools.toolStyle.getToolWidth();
        var config = cornerstoneTools.biDirectional.getConfiguration();

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

            // draw the line
            var handleStartCanvas = cornerstone.pixelToCanvas(element, data.handles.start);
            var handleEndCanvas = cornerstone.pixelToCanvas(element, data.handles.end);
            var canvasTextLocation = cornerstone.pixelToCanvas(element, data.handles.textBox);

            context.beginPath();
            context.strokeStyle = color;
            context.lineWidth = lineWidth;
            context.moveTo(handleStartCanvas.x, handleStartCanvas.y);
            context.lineTo(handleEndCanvas.x, handleEndCanvas.y);
            context.stroke();

            // draw the handles
            cornerstoneTools.drawHandles(context, eventData, data.handles, color);


            // Draw perpendicular line
            drawPerpendicularLine(context,eventData, element, data, color, lineWidth);

            //Draw linked line as dashed
            context.beginPath();
            context.strokeStyle = color;
            context.lineWidth = lineWidth;
            context.setLineDash([2, 3]);

            var perpendicularStartCanvas = cornerstone.pixelToCanvas(element, data.handles.perpendicularStart);
            context.moveTo(perpendicularStartCanvas.x, perpendicularStartCanvas.y);
            context.lineTo(canvasTextLocation.x + 20, canvasTextLocation.y + 20);
            context.stroke();

            // Draw the text
            var dx = (data.handles.start.x - data.handles.end.x) * (eventData.image.columnPixelSpacing || 1);
            var dy = (data.handles.start.y - data.handles.end.y) * (eventData.image.rowPixelSpacing || 1);
            var length = Math.sqrt(dx * dx + dy * dy);

            var suffix = ' mm';
            if (!eventData.image.rowPixelSpacing || !eventData.image.columnPixelSpacing) {
                suffix = ' pixels';
            }

            var text = '' + length.toFixed(2) + suffix;
            var textLines = [data.lesionName, text];

            var boundingBox = cornerstoneTools.drawTextBox(context,
                textLines,
                canvasTextLocation.x, canvasTextLocation.y, color);

            data.handles.textBox.boundingBox = boundingBox;

            // Set measurement text to show lesion table
            data.measurementText = length.toFixed(1);

            context.restore();
        }
    }

    function updateLesionCollection(lesionData) {
        // TODO = Remove this in favour of measurement events
        if (!lesionData.active) {
            return;
        }

        if (lesionData.timepointID && lesionData.timepointID !== "") {
            // Update Measurements Collection
            measurementManagerDAL.updateTimepointData(lesionData);
        }
    }

    function doubleClickCallback(e, eventData) {
        // Prevent other double click handlers from firing after this one
        //e.stopImmediatePropagation();

        var element = eventData.element;
        var data;

        function doneCallback(data, deleteTool) {
            if (deleteTool === true) {
                cornerstoneTools.removeToolState(element, toolType, data);
                cornerstone.updateImage(element);
                //return;
            }

            /*// TODO= Find a better way to do this! This is very messy
             config.setLesionNumberCallback(data, eventData, function(lesionNumber) {
             data.lesionName = "Target " + lesionNumber;
             data.lesionNumber = lesionNumber;
             data.active = false;
             cornerstone.updateImage(element);
             });*/
        }

        if (e.data && e.data.mouseButtonMask && !cornerstoneTools.isMouseButtonEnabled(eventData.which, e.data.mouseButtonMask)) {
            return false;
        }

        var config = cornerstoneTools.biDirectional.getConfiguration();

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
                config.changeLesionLocationCallback(data, eventData, doneCallback);

                e.stopImmediatePropagation();
                return false;
            }
        }

        return false; // false = causes jquery to preventDefault() and stopPropagation() this event
    }

    // module exports
    cornerstoneTools.biDirectional = cornerstoneTools.mouseButtonTool({
        createNewMeasurement: createNewMeasurement,
        addNewMeasurement: addNewMeasurement,
        onImageRendered: onImageRendered,
        pointNearTool: pointNearTool,
        mouseDoubleClickCallback: doubleClickCallback,
        toolType: toolType
    });

    cornerstoneTools.biDirectionalTouch = cornerstoneTools.touchTool({
        createNewMeasurement: createNewMeasurement,
        addNewMeasurement: addNewMeasurementTouch,
        onImageRendered: onImageRendered,
        pointNearTool: pointNearTool,
        toolType: toolType
    });

    cornerstoneTools.biDirectional.setConfiguration(configuration);

    return cornerstoneTools;

}($, cornerstone, cornerstoneMath, cornerstoneTools));