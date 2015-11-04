var lineIndex = 0; //This holds drawn line index
var activeLesionMeasurementData;
var timepointID;
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
        timepointID = getActiveTimepointID(element);
        var lesionNumber = measurementManagerDAL.getLesionNumber(timepointID);
        var lesionCounter = "";

        // Subscribe CornerstoneMouseup event, when mouse is up, call lesionDialog
        $(element).on("CornerstoneToolsMouseUp", function (e) {

            // Unsubscribe CornerstoneToolsMouseUp event
            $(element).off("CornerstoneToolsMouseUp");

            // Set lesionMeasurementData Session
            activeLesionMeasurementData.timepointID = timepointID;
            Session.set("lesionMeasurementData", activeLesionMeasurementData);

            // Show LesionDialog
            $(document).trigger("ShowLesionDialog", [e, activeLesionMeasurementData]);

        });

        // Set Lesion Name
        $(element).on("LesionNameSet", function(e,lesionName){
            lesionCounter = lesionName;
        });

        // Subscribe LesionMeasurementCreated
        $(element).trigger("LesionMeasurementCreated");

        console.log(mouseEventData.image.imageId);
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
            imageId: mouseEventData.image.imageId,
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
            lesionName: "Target "+lesionNumber,
            isDeleted: false,
            lineNumber:"", //Indicates line number on image
            lesionNumber: lesionNumber,
            uid: uuid.v4()
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

    function suscribeLesionToolModifiedEvent (element) {
        var elementEvents = $._data(element, "events" );
        var index = Object.keys(elementEvents).indexOf("LesionToolModified");
        if (index < 0) {
            // Subscribe LesionToolModified and calls measurementModified function when lesion measurement is changed or updated.
            $(element).on("LesionToolModified", measurementModified);
        }

    }
    ///////// BEGIN IMAGE RENDERING ///////
    function onImageRendered(e, eventData) {

        suscribeLesionToolModifiedEvent(e.currentTarget);

        // if we have no toolData for this element, return immediately as there is nothing to do
        var toolData = cornerstoneTools.getToolState(e.currentTarget, toolType);
        if (toolData === undefined) {
            return;
        }

        updateLesions(toolData, eventData, e.currentTarget);
    }

    function updateLesions(toolData, eventData, currentElement) {
        // we have tool data for this element - iterate over each one and draw it
        var context = eventData.canvasContext.canvas.getContext('2d');
        context.setTransform(1, 0, 0, 1, 0, 0);

        for (var i = 0; i < toolData.data.length; i++) {
            renderLesion(toolData.data[i], context, eventData);
            updateLesionCollection(toolData.data[i], currentElement);
        }
    }

    function updateLesionCollection(lesionData, currentElement) {

        if (lesionData.active) {
            if(lesionData.timepointID != undefined && lesionData.timepointID != "") {
                // Update Measurements Collection
                measurementManagerDAL.updateTimepointData(lesionData);

            } else {
                activeLesionMeasurementData = lesionData;
            }
        }
    }

    function renderLesion(lesion, context, eventData){
        context.save();

        var color;
        var lineWidth = cornerstoneTools.toolStyle.getToolWidth();
        var font = cornerstoneTools.textStyle.getFont();
        var config = cornerstoneTools.length.getConfiguration();

        // configurable shadow from CornerstoneTools
        if (config && config.shadow) {
            context.shadowColor = '#000000';
            context.shadowOffsetX = +1;
            context.shadowOffsetY = +1;
        }

        if (lesion.active) {
            color = cornerstoneTools.toolColors.getActiveColor();
        } else {
            color = cornerstoneTools.toolColors.getToolColor();
        }

        // draw the line
        var handleStartCanvas = cornerstone.pixelToCanvas(eventData.element, lesion.handles.start);
        var handleEndCanvas = cornerstone.pixelToCanvas(eventData.element, lesion.handles.end);

        context.beginPath();
        context.strokeStyle = color;
        context.lineWidth = lineWidth;
        context.moveTo(handleStartCanvas.x, handleStartCanvas.y);
        context.lineTo(handleEndCanvas.x, handleEndCanvas.y);
        context.stroke();

        // draw the handles
        cornerstoneTools.drawHandles(context, eventData, lesion.handles, color);

        //Set coordinates of text
        var linkedTextStartCanvas = cornerstone.pixelToCanvas(eventData.element, lesion.linkedTextCoords.start);
        var linkedTextEndCanvas = cornerstone.pixelToCanvas(eventData.element, lesion.linkedTextCoords.end);
        if(!lesion.linkedTextCoords.init){
            lesion.linkedTextCoords.start.x = lesion.handles.start.x + 50;
            lesion.linkedTextCoords.start.y = lesion.handles.start.y + 40;
            linkedTextStartCanvas = cornerstone.pixelToCanvas(eventData.element, lesion.linkedTextCoords.start);

            //Set end point of linkedTextCoords
            lesion.linkedTextCoords.end.x = lesion.linkedTextCoords.start.x + 50;
            lesion.linkedTextCoords.end.y = lesion.linkedTextCoords.start.y + 30;
            linkedTextEndCanvas = cornerstone.pixelToCanvas(eventData.element, lesion.linkedTextCoords.end);

            //initialized coordinates of text
            lesion.linkedTextCoords.init = true;
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
        var dx = (lesion.handles.start.x - lesion.handles.end.x) * (eventData.image.columnPixelSpacing || 1);
        var dy = (lesion.handles.start.y - lesion.handles.end.y) * (eventData.image.rowPixelSpacing || 1);
        var length = Math.sqrt(dx * dx + dy * dy);

        var suffix = ' mm';
        if (!eventData.image.rowPixelSpacing || !eventData.image.columnPixelSpacing) {
            suffix = ' pixels';
        }

        var text = '' + length.toFixed(2) + suffix;
        var textCoords = {
            x:  linkedTextStartCanvas.x, y: linkedTextStartCanvas.y
        };

        cornerstoneTools.drawTextBox(context, lesion.lesionName, textCoords.x, textCoords.y, color);
        cornerstoneTools.drawTextBox(context, text, textCoords.x, textCoords.y + 20, color);

        //Set measurement text to show lesion table
        lesion.measurementText = length.toFixed(2);

        // Lesion Measurement is changed
        $(eventData.enabledElement.element).trigger("LesionTextChanged",lesion);

        context.restore();
    }

    ///////// END IMAGE RENDERING ///////

    function updateLesion(e, eventObject) {
        var start = new Date();

        var enabledElement = eventObject.enabledElement;
        var lesionNumber = eventObject.lesionData.lesionNumber;
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
                if (data.lesionNumber === eventObject.lesionNumber && eventObject.type !== "active") {
                    data.visible = false;
                    deletedDataIndex = i;
                }
            }

            if (deletedDataIndex >= 0 && deletedDataIndex < toolData.data.length) {
                toolData.data.splice(deletedDataIndex, 1);
            }
        } else if(type === "active") {
            for (var i = 0; i < toolData.data.length; i++) {
                var data = toolData.data[i];
                //When click a row of table measurements, measurement will be active and color will be green
                if (data.lesionNumber === eventObject.lesionData.lesionNumber && eventObject.type === "active") {
                    data.active = true;
                } else{
                    data.active = false;
                }
            }
        } else if(type === "inactive") {
            for (var i = 0; i < toolData.data.length; i++) {
                var data = toolData.data[i];
                // Make inactive all lesions for the timepoint
                data.active = false;
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
            lesionNumber : lesionNumber,
            type : type //Holds image will be deleted or active
        };

        enabledElement.invalid = false;

        onImageRendered(e, eventData);
    }


    function loadImage(e, eventObject) {

        // If type is active, load image and activate lesion
        // If type is inactive, update lesions of enabledElement as inactive

        if (eventObject.type === "active") {
            var stackToolDataSource = cornerstoneTools.getToolState(e.currentTarget, 'stack');
            var stackData = stackToolDataSource.data[0];
            var imageIdsArr = stackData.imageIds;
            var indexOfImage = imageIdsArr.indexOf(eventObject.lesionData.imageId);
            if (indexOfImage > -1) {
                cornerstone.loadAndCacheImage(stackData.imageIds[indexOfImage]).then(function(image) {
                    cornerstone.displayImage(eventObject.enabledElement.element,image);
                    updateLesion(e, eventObject);
                });
            }
        } else if(eventObject.type === "inactive") {
            updateLesion(e, eventObject);
        }


    }

    //This function is called from cornerstone-viewport.html and updates lesion measurement and makes the lesion active
    function measurementModified(e, eventObject){
        loadImage(e,eventObject);
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