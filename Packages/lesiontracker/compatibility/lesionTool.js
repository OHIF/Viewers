var lineIndex = 0; //This holds drawn line index
var cornerstoneTools = (function ($, cornerstone, cornerstoneMath, cornerstoneTools) {

    "use strict";

    if(cornerstoneTools === undefined) {
        cornerstoneTools = {};
    }

    var toolType = "lesion";

    ///////// BEGIN ACTIVE TOOL ///////
    function createNewMeasurement(mouseEventData)
    {
        var element = mouseEventData.element;
        var lesionCounter = "";

        //setting name of lesion
        $(element).on("LesionNameSet", function(e,counter){
            lesionCounter = counter;
        });

        //Listens LesionToolModified event and calls measurementModified function when lesion measurement is changed or updated.
        $(element).on("LesionToolModified", measurementModified);
        $(element).trigger("LesionMeasurementCreated");

        // create the measurement data for this tool with the end handle activated
        var measurementData = {
            visible : true,
            active : true,
            handles : {
                start : {
                    x : mouseEventData.currentPoints.image.x,
                    y : mouseEventData.currentPoints.image.y,
                    highlight: true,
                    active: false
                },
                end: {
                    x : mouseEventData.currentPoints.image.x,
                    y : mouseEventData.currentPoints.image.y,
                    highlight: true,
                    active: true
                }
            },
            index: lineIndex,
            measurementText: "",
            linkedTextCoords: {
                start : {
                    x : mouseEventData.currentPoints.image.x,
                    y : mouseEventData.currentPoints.image.y,
                    highlight: true,
                    active: false
                },
                end: {
                    x : mouseEventData.currentPoints.image.x,
                    y : mouseEventData.currentPoints.image.y,
                    highlight: true,
                    active: true
                },
                init: false
            },
            lesionName: "Target "+lesionCounter,
            isDeleted: false,
            lineNumber:"" //Indicates line number on image
        };
        lineIndex++;
        return measurementData;
    }
    ///////// END ACTIVE TOOL ///////

    function pointNearTool(element, data, coords)
    {
        var lineSegment = {
            start: cornerstone.pixelToCanvas(element, data.handles.start), end: cornerstone.pixelToCanvas(element, data.handles.end)
        };
        var distanceToPoint = cornerstoneMath.lineSegment.distanceToPoint(lineSegment, coords);
        return (distanceToPoint < 25);
    }

    function pointNearToolForText(element, data, coords) {
        var lineSegment = {
            start: cornerstone.pixelToCanvas(element, data.linkedTextCoords.start), end: cornerstone.pixelToCanvas(element, data.linkedTextCoords.end)
        };

        var distanceToPoint = cornerstoneMath.lineSegment.distanceToPoint(lineSegment, coords);
        return (distanceToPoint < 30);

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
                context.shadowColor = '#000000';
                context.shadowOffsetX = +1;
                context.shadowOffsetY = +1;
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

            //Set coordinates of text
            var linkedTextStartCanvas = cornerstone.pixelToCanvas(eventData.element, data.linkedTextCoords.start);
            var linkedTextEndCanvas = cornerstone.pixelToCanvas(eventData.element, data.linkedTextCoords.end);
            if(!data.linkedTextCoords.init){
                data.linkedTextCoords.start.x = data.handles.start.x + 50;
                data.linkedTextCoords.start.y = data.handles.start.y + 40;
                linkedTextStartCanvas = cornerstone.pixelToCanvas(eventData.element, data.linkedTextCoords.start);

                //Set end point of linkedTextCoords
                data.linkedTextCoords.end.x = data.linkedTextCoords.start.x + 50;
                data.linkedTextCoords.end.y = data.linkedTextCoords.start.y + 30;
                linkedTextEndCanvas = cornerstone.pixelToCanvas(eventData.element, data.linkedTextCoords.end);

                //initialized coordinates of text
                data.linkedTextCoords.init = true;
            }

            //Draw linked line as dashed
            context.setLineDash([2,3]);
            context.beginPath();
            context.strokeStyle = color;
            context.lineWidth = 1 / eventData.viewport.scale;
            var mid = {
                x:(handleStartCanvas.x + handleEndCanvas.x) / 2, y:(handleStartCanvas.y + handleEndCanvas.y) / 2
            };

            context.moveTo(mid.x, mid.y);
            context.lineTo(linkedTextStartCanvas.x + 20, linkedTextStartCanvas.y + 20);
            context.stroke();

            // Draw the text
            context.fillStyle = color;
            context.font = font;
            var dx = (data.handles.start.x - data.handles.end.x) * (eventData.image.columnPixelSpacing || 1);
            var dy = (data.handles.start.y - data.handles.end.y) * (eventData.image.rowPixelSpacing || 1);
            var length = Math.sqrt(dx * dx + dy * dy);

            var suffix = ' mm';
            if (!eventData.image.rowPixelSpacing || !eventData.image.columnPixelSpacing) {
                suffix = ' pixels';
            }

            var text = '' + length.toFixed(2) + suffix;
            var textCoords = {
                x:  linkedTextStartCanvas.x, y: linkedTextStartCanvas.y
            };

            cornerstoneTools.drawTextBox(context, data.lesionName, textCoords.x, textCoords.y, color);
            cornerstoneTools.drawTextBox(context, text, textCoords.x, textCoords.y + 20, color);

            //Set measurement text to show lesion table
            data.measurementText = length.toFixed(2);
            $(eventData.enabledElement.element).trigger("LesionTextChanged",data);

            context.restore();
        }

    }
    ///////// END IMAGE RENDERING ///////

    //This function is called from cornerstone-viewport.html and updates lesion measurement and makes the lesion active
    function measurementModified(e, eventObject){
        var start = new Date();

        var enabledElement = eventObject.enabledElement;
        var lineIndex = eventObject.lineIndex;
        var type = eventObject.type;

        // if we have no toolData for this element, return immediately as there is nothing to do
        var toolData = cornerstoneTools.getToolState(e.currentTarget, toolType);
        if (toolData === undefined) {
            return;
        }

        //If type is delete, remove measurement
        if(type === "delete") {
            var deletedDataIndex = -1;

            for (var i = 0; i < toolData.data.length; i++) {
                var data = toolData.data[i];

                //When click a row of table measurements, measurement will be active and color will be green
                if (data.index === eventObject.lineIndex && eventObject.type !== "active") {
                    data.visible = false;
                    deletedDataIndex = i;
                }
            }

            if (deletedDataIndex >= 0 && deletedDataIndex < toolData.data.length) {
                toolData.data.splice(deletedDataIndex, 1);
            }
        } else {
            for (var i = 0; i < toolData.data.length; i++) {
                var data = toolData.data[i];

                //When click a row of table measurements, measurement will be active and color will be green
                if (data.index === eventObject.lineIndex && eventObject.type === "active") {
                    data.active = true;
                } else{
                    data.active = false;
                }
            }
        }


        enabledElement.image.render(enabledElement, true);

        var context = enabledElement.canvas.getContext('2d');

        var end = new Date();
        var diff = end - start;
        //console.log(diff + ' ms');

        var eventData = {
            viewport : enabledElement.viewport,
            element : enabledElement.element,
            image : enabledElement.image,
            enabledElement : enabledElement,
            canvasContext: context,
            measurementText: "",
            renderTimeInMs : diff,
            lineIndex : lineIndex,
            type : type //Holds image will be deleted or active
        };

        enabledElement.invalid = false;

        onImageRendered(e, eventData);
    }

    // module exports
    cornerstoneTools.lesion = cornerstoneTools.mouseButtonTool({
        createNewMeasurement : createNewMeasurement,
        onImageRendered: onImageRendered,
        pointNearTool : pointNearTool,
        pointNearToolForText: pointNearToolForText,
        toolType : toolType
    });
    cornerstoneTools.lesionTouch = cornerstoneTools.touchTool({
        createNewMeasurement: createNewMeasurement,
        onImageRendered: onImageRendered,
        pointNearTool: pointNearTool,
        pointNearToolForText: pointNearToolForText,
        toolType: toolType
    });
    return cornerstoneTools;
}($, cornerstone, cornerstoneMath, cornerstoneTools));