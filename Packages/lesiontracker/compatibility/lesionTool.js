var activeLesionMeasurementData;
var cornerstoneTools = (function($, cornerstone, cornerstoneMath, cornerstoneTools) {

    "use strict";

    if (cornerstoneTools === undefined) {
        cornerstoneTools = {};
    }

    var configuration = {
        getLesionLocationCallback: getLesionLocationCallback,
        changeLesionLocationCallback: changeLesionLocationCallback,
    };

    // Define a callback to get your text annotation
    // This could be used, e.g. to open a modal
    function getLesionLocationCallback(measurementData, eventData, doneCallback) {
        doneCallback(prompt('Enter your lesion location:'));
    }

    function changeLesionLocationCallback(measurementData, eventData, doneCallback) {
        doneCallback(prompt('Change your lesion location:'));
    }

    var toolType = "lesion";

    ///////// BEGIN ACTIVE TOOL ///////

    function addNewMeasurement(mouseEventData) {
        var element = mouseEventData.element;

        function doneCallback(lesionNumber) {
            measurementData.lesionName = "Target " + lesionNumber;
            measurementData.lesionNumber = lesionNumber;
            measurementData.active = false;
            cornerstone.updateImage(element);
        }

        var measurementData = createNewMeasurement(mouseEventData);

        var eventData = {
            mouseButtonMask: mouseEventData.which
        };
        
        // associate this data with this imageId so we can render it and manipulate it
        cornerstoneTools.addToolState(element, toolType, measurementData);
       
        // since we are dragging to another place to drop the end point, we can just activate
        // the end point and let the moveHandle move it for us.
        $(element).off('CornerstoneToolsMouseMove', cornerstoneTools.lesion.mouseMoveCallback);
        $(element).off('CornerstoneToolsMouseDown', cornerstoneTools.lesion.mouseDownCallback);
        $(element).off('CornerstoneToolsMouseDownActivate', cornerstoneTools.lesion.mouseDownActivateCallback);

        cornerstone.updateImage(element);
        cornerstoneTools.moveNewHandle(mouseEventData, toolType, measurementData, measurementData.handles.end, function() {
            if (cornerstoneTools.anyHandlesOutsideImage(mouseEventData, measurementData.handles)) {
                // delete the measurement
                cornerstoneTools.removeToolState(element, toolType, measurementData);
            } else {
                // Set lesionMeasurementData Session
                var config = cornerstoneTools.lesion.getConfiguration();
                config.getLesionLocationCallback(measurementData, mouseEventData, doneCallback);
            }

            $(element).on('CornerstoneToolsMouseMove', eventData, cornerstoneTools.lesion.mouseMoveCallback);
            $(element).on('CornerstoneToolsMouseDown', eventData, cornerstoneTools.lesion.mouseDownCallback);
            $(element).on('CornerstoneToolsMouseDownActivate', eventData, cornerstoneTools.lesion.mouseDownActivateCallback);
            cornerstone.updateImage(element);
        });
    }

    function addNewMeasurementTouch(touchEventData) {
        var element = touchEventData.element;

        function doneCallback(lesionNumber) {
            measurementData.lesionName = "Target " + lesionNumber;
            measurementData.lesionNumber = lesionNumber;
            measurementData.active = false;
            cornerstone.updateImage(element);
        }

        var measurementData = createNewMeasurement(touchEventData);

        // associate this data with this imageId so we can render it and manipulate it
        cornerstoneTools.addToolState(element, toolType, measurementData);

        // since we are dragging to another place to drop the end point, we can just activate
        // the end point and let the moveHandle move it for us.
        $(element).off('CornerstoneToolsTouchDrag', cornerstoneTools.lesion.touchMoveHandle);
        $(element).off('CornerstoneToolsTap', cornerstoneTools.lesion.tapCallback);
        $(element).off('CornerstoneToolsDragStartActive', cornerstoneTools.lesion.touchDownActivateCallback);

        cornerstone.updateImage(element);
        cornerstoneTools.moveNewHandleTouch(touchEventData, toolType, measurementData, measurementData.handles.end, function() {
            if (cornerstoneTools.anyHandlesOutsideImage(touchEventData, measurementData.handles)) {
                // delete the measurement
                cornerstoneTools.removeToolState(element, toolType, measurementData);
            } else {
                // Set lesionMeasurementData Session
                var config = cornerstoneTools.lesion.getConfiguration();
                config.getLesionLocationCallback(measurementData, touchEventData, doneCallback);
            }

            $(element).on('CornerstoneToolsTouchDrag', cornerstoneTools.lesion.touchMoveHandle);
            $(element).on('CornerstoneToolsTap', cornerstoneTools.lesion.tapCallback);
            $(element).on('CornerstoneToolsDragStartActive', cornerstoneTools.lesion.touchDownActivateCallback);
            cornerstone.updateImage(element);
        });
    }

    function createNewMeasurement(mouseEventData) {
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
                    drawnIndependently: true
                }
            },
            imageId: mouseEventData.image.imageId,
            measurementText: 0,
            lesionName: '',
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

        return (distanceToPoint < 25);
    }

    function pointNearTextBox(element, handle, coords) {
        if (!handle.boundingBox) {
            return;
        }
        return cornerstoneMath.point.insideRect(coords, handle.boundingBox);
    }

    function suscribeLesionToolSelectedEvent(element) {
        var elementEvents = $._data(element, "events");
        var index = Object.keys(elementEvents).indexOf("LesionToolSelected");
        if (index < 0) {
            // Subscribe LesionToolSelected and calls measurementModified function when lesion measurement is changed or updated.
            $(element).on("LesionToolSelected", measurementModified);
        }

    }
    ///////// BEGIN IMAGE RENDERING ///////
    function onImageRendered(e, eventData) {

        suscribeLesionToolSelectedEvent(e.currentTarget);

        // if we have no toolData for this element, return immediately as there is nothing to do
        var toolData = cornerstoneTools.getToolState(e.currentTarget, toolType);
        if (!toolData) {
            return;
        }

        // we have tool data for this element - iterate over each one and draw it
        var context = eventData.canvasContext.canvas.getContext('2d');
        context.setTransform(1, 0, 0, 1, 0, 0);

        for (var i = 0; i < toolData.data.length; i++) {
            renderLesion(toolData.data[i], context, eventData);
            updateLesionCollection(toolData.data[i]);
        }
    }

    function updateLesionCollection(lesionData) {
        if (!lesionData.active) {
            return;
        }

        if (lesionData.timepointID && lesionData.timepointID !== "") {
            // Update Measurements Collection
            measurementManagerDAL.updateTimepointData(lesionData);
        } else {
            activeLesionMeasurementData = lesionData;
        }
    }

    function renderLesion(data, context, eventData) {
        context.save();

        var color;
        var element = eventData.element;
        var lineWidth = cornerstoneTools.toolStyle.getToolWidth();
        var font = cornerstoneTools.textStyle.getFont();
        var config = cornerstoneTools.lesion.getConfiguration();

        // configurable shadow from CornerstoneTools
        if (config && config.shadow) {
            context.shadowColor = '#000000';
            context.shadowOffsetX = +1;
            context.shadowOffsetY = +1;
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

        //Draw linked line as dashed
        context.setLineDash([2, 3]);
        context.beginPath();
        context.strokeStyle = color;
        context.lineWidth = 1 / eventData.viewport.scale;
        var mid = {
            x: (handleStartCanvas.x + handleEndCanvas.x) / 2,
            y: (handleStartCanvas.y + handleEndCanvas.y) / 2
        };

        context.moveTo(mid.x, mid.y);
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

        // Lesion Measurement is changed
        $(element).trigger("LesionTextChanged", data);

        context.restore();
    }

    ///////// END IMAGE RENDERING ///////

    function updateLesion(e, eventData) {
        var enabledElement = eventData.enabledElement;
        var element = eventData.enabledElement.element;
        var isTarget = eventData.lesionData.isTarget;
        var lesionNumber = eventData.lesionData.lesionNumber;
        var type = eventData.type;

        // if we have no toolData for this element, return immediately as there is nothing to do
        var toolData = cornerstoneTools.getToolState(e.currentTarget, toolType);
        if (!toolData) {
            return;
        }

        var data,
            i;

        switch (type) {
            case "delete":
                //If type is delete, remove measurement
                var deletedDataIndex = -1;

                for (i = 0; i < toolData.data.length; i++) {
                    data = toolData.data[i];

                    //When click a row of table measurements, measurement will be active and color will be green
                    if (data.lesionNumber === lesionNumber && eventData.type !== "active" && isTarget) {
                        data.visible = false;
                        deletedDataIndex = i;
                    }
                }

                if (deletedDataIndex >= 0 && deletedDataIndex < toolData.data.length) {
                    toolData.data.splice(deletedDataIndex, 1);
                }
                break;

            case "active":
                for (i = 0; i < toolData.data.length; i++) {
                    data = toolData.data[i];
                    //When click a row of table measurements, measurement will be active and color will be green
                    if (data.lesionNumber === lesionNumber && eventData.type === "active" && isTarget) {
                        data.active = true;
                    } else {
                        data.active = false;
                    }
                }
                break;

            case "inactive":
                for (i = 0; i < toolData.data.length; i++) {
                    data = toolData.data[i];
                    // Make inactive all lesions for the timepoint
                    data.active = false;
                }
                break;
        }

        cornerstone.updateImage(element);
    }


    function loadImage(e, eventData) {
        // If type is active, load image and activate lesion
        // If type is inactive, update lesions of enabledElement as inactive

        if (eventData.type === "active") {
            var stackToolDataSource = cornerstoneTools.getToolState(e.currentTarget, 'stack');
            var stackData = stackToolDataSource.data[0];
            var imageIds = stackData.imageIds;
            var imageIdIndex = imageIds.indexOf(eventData.lesionData.imageId);
            if (imageIdIndex < 0) {
                return;
            }

            cornerstone.loadAndCacheImage(imageIds[imageIdIndex]).then(function(image) {
                cornerstone.displayImage(eventData.enabledElement.element, image);
                updateLesion(e, eventData);
            });
        } else if (eventData.type === "inactive") {
            updateLesion(e, eventData);
        }
    }

    //This function is called from cornerstone-viewport.html and updates lesion measurement and makes the lesion active
    function measurementModified(e, eventData) {
        loadImage(e, eventData);
    }

    // module exports
    cornerstoneTools.lesion = cornerstoneTools.mouseButtonTool({
        createNewMeasurement: createNewMeasurement,
        addNewMeasurement: addNewMeasurement,
        onImageRendered: onImageRendered,
        pointNearTool: pointNearTool,
        toolType: toolType
    });

    cornerstoneTools.lesionTouch = cornerstoneTools.touchTool({
        createNewMeasurement: createNewMeasurement,
        addNewMeasurement: addNewMeasurementTouch,
        onImageRendered: onImageRendered,
        pointNearTool: pointNearTool,
        toolType: toolType
    });

    cornerstoneTools.lesion.setConfiguration(configuration);

    return cornerstoneTools;

}($, cornerstone, cornerstoneMath, cornerstoneTools));