var activeLesionMeasurementData;
var timepointID;
var cornerstoneTools = (function($, cornerstone, cornerstoneMath, cornerstoneTools) {

    "use strict";

    if (cornerstoneTools === undefined) {
        cornerstoneTools = {};
    }

    var toolType = "lesion";

    ///////// BEGIN ACTIVE TOOL ///////
    function createNewMeasurement(mouseEventData) {
        var element = mouseEventData.element;
        timepointID = $(element).data('timepointID');
        var lesionNumber = measurementManagerDAL.getNewLesionNumber(timepointID, true);
        var lesionCounter = "";


        // ** This stuff should not be done here! We should do this inside addNewMeasurement!** //

        // Subscribe CornerstoneMouseup event, when mouse is up, call lesionDialog
        $(element).on("CornerstoneToolsMouseUp", function(e) {

            // Unsubscribe CornerstoneToolsMouseUp event
            $(element).off("CornerstoneToolsMouseUp");

            // Set lesionMeasurementData Session
            activeLesionMeasurementData.timepointID = timepointID;
            Session.set("lesionMeasurementData", activeLesionMeasurementData);

            // Show LesionDialog
            $(document).trigger("ShowLesionDialog", [e, activeLesionMeasurementData]);
        });

        // Set Lesion Name
        $(element).on("LesionNameSet", function(e, lesionName) {
            lesionCounter = lesionName;
        });

        // Subscribe LesionMeasurementCreated
        $(element).trigger("LesionMeasurementCreated");

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
            lesionName: "Target " + lesionNumber,
            isDeleted: false,
            lesionNumber: lesionNumber,
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

        updateLesions(toolData, eventData);
    }

    function updateLesions(toolData, eventData) {
        // we have tool data for this element - iterate over each one and draw it
        var context = eventData.canvasContext.canvas.getContext('2d');
        context.setTransform(1, 0, 0, 1, 0, 0);

        for (var i = 0; i < toolData.data.length; i++) {
            renderLesion(toolData.data[i], context, eventData);
            updateLesionCollection(toolData.data[i]);
        }
    }

    function updateLesionCollection(lesionData) {

        if (lesionData.active) {
            if (lesionData.timepointID !== undefined && lesionData.timepointID !== "") {
                // Update Measurements Collection
                measurementManagerDAL.updateTimepointData(lesionData);

            } else {
                activeLesionMeasurementData = lesionData;
            }
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
        var start = new Date();

        var enabledElement = eventData.enabledElement;
        var isTarget = eventData.lesionData.isTarget;
        var lesionNumber = eventData.lesionData.lesionNumber;
        var type = eventData.type;

        // if we have no toolData for this element, return immediately as there is nothing to do
        var toolData = cornerstoneTools.getToolState(e.currentTarget, toolType);
        if (toolData === undefined) {
            return;
        }

        var data,
            i;

        //If type is delete, remove measurement
        if (type === "delete") {
            var deletedDataIndex = -1;

            for (i = 0; i < toolData.data.length; i++) {
                data = toolData.data[i];

                //When click a row of table measurements, measurement will be active and color will be green
                if (data.lesionNumber === eventData.lesionNumber && eventData.type !== "active" && isTarget) {
                    data.visible = false;
                    deletedDataIndex = i;
                }
            }

            if (deletedDataIndex >= 0 && deletedDataIndex < toolData.data.length) {
                toolData.data.splice(deletedDataIndex, 1);
            }
        } else if (type === "active") {
            for (i = 0; i < toolData.data.length; i++) {
                data = toolData.data[i];
                //When click a row of table measurements, measurement will be active and color will be green
                if (data.lesionNumber === eventData.lesionData.lesionNumber && eventData.type === "active" && isTarget) {
                    data.active = true;
                } else {
                    data.active = false;
                }
            }
        } else if (type === "inactive") {
            for (i = 0; i < toolData.data.length; i++) {
                data = toolData.data[i];
                // Make inactive all lesions for the timepoint
                data.active = false;
            }
        }

        var context = enabledElement.canvas.getContext('2d');

        var end = new Date();
        var diff = end - start;
        //console.log(diff + ' ms');

        cornerstone.updateImage(element);
    }


    function loadImage(e, eventData) {
        // If type is active, load image and activate lesion
        // If type is inactive, update lesions of enabledElement as inactive

        if (eventData.type === "active") {
            var stackToolDataSource = cornerstoneTools.getToolState(e.currentTarget, 'stack');
            var stackData = stackToolDataSource.data[0];
            var imageIdsArr = stackData.imageIds;
            var indexOfImage = imageIdsArr.indexOf(eventData.lesionData.imageId);
            if (indexOfImage > -1) {
                cornerstone.loadAndCacheImage(stackData.imageIds[indexOfImage]).then(function(image) {
                    cornerstone.displayImage(eventData.enabledElement.element, image);
                    updateLesion(e, eventData);
                });
            }
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
        onImageRendered: onImageRendered,
        pointNearTool: pointNearTool,
        toolType: toolType
    });

    cornerstoneTools.lesionTouch = cornerstoneTools.touchTool({
        createNewMeasurement: createNewMeasurement,
        onImageRendered: onImageRendered,
        pointNearTool: pointNearTool,
        toolType: toolType
    });
    return cornerstoneTools;

}($, cornerstone, cornerstoneMath, cornerstoneTools));