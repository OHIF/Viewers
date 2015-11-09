// Begin Source: src/imageTools/annotation.js
(function($, cornerstone, cornerstoneMath, cornerstoneTools) {

    'use strict';

    var toolType = 'nonTarget';

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
            mouseButtonMask: mouseEventData.which
        };

        // associate this data with this imageId so we can render it and manipulate it
        cornerstoneTools.addToolState(mouseEventData.element, toolType, measurementData);

        // since we are dragging to another place to drop the end point, we can just activate
        // the end point and let the moveHandle move it for us.
        $(mouseEventData.element).off('CornerstoneToolsMouseMove', cornerstoneTools.nonTarget.mouseMoveCallback);
        $(mouseEventData.element).off('CornerstoneToolsMouseDown', cornerstoneTools.nonTarget.mouseDownCallback);
        $(mouseEventData.element).off('CornerstoneToolsMouseDownActivate', cornerstoneTools.nonTarget.mouseDownActivateCallback);

        cornerstone.updateImage(mouseEventData.element);
        cornerstoneTools.moveNewHandle(mouseEventData, measurementData.handles.end, function() {
            if (cornerstoneTools.anyHandlesOutsideImage(mouseEventData, measurementData.handles)) {
                // delete the measurement
                cornerstoneTools.removeToolState(mouseEventData.element, toolType, measurementData);
            }

            var config = cornerstoneTools.nonTarget.getConfiguration();
            if (measurementData.text === undefined) {
                config.getTextCallback(doneChangingTextCallback);
            }

            $(mouseEventData.element).on('CornerstoneToolsMouseMove', eventData, cornerstoneTools.nonTarget.mouseMoveCallback);

            // CornerstoneToolsMouseDown Event
            $(mouseEventData.element).on('CornerstoneToolsMouseDown', eventData, cornerstoneTools.nonTarget.mouseDownCallback);
            $(mouseEventData.element).on('CornerstoneToolsMouseDownActivate', eventData, cornerstoneTools.nonTarget.mouseDownActivateCallback);

            cornerstone.updateImage(mouseEventData.element);
        });
    }

    function createNewMeasurement(mouseEventData) {
        // create the measurement data for this tool with the end handle activated
        // TODO: Get text from measurements collection
        // Subscribe CornerstoneMouseup event, when mouse is up, call lesionDialog
        $(mouseEventData.element).on("CornerstoneToolsMouseUp", function (e) {
            // Unsubscribe CornerstoneToolsMouseUp event
            $(mouseEventData.element).off("CornerstoneToolsMouseUp");
            $(mouseEventData.element).trigger("NonTargetToolAdded", [e, measurementData]);

        });
        var timepointID = $(mouseEventData.element).data('timepointID');
        var lesionNumber = measurementManagerDAL.getNewLesionNumber(timepointID, false);

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
            },
            linkedTextCoords: {
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
                init: false
            },
            imageId: mouseEventData.image.imageId,
            lesionNumber: lesionNumber,
            text: "Non-Target " + lesionNumber,
            isTarget: false
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

    function pointNearToolForText(element, data, coords) {
        var lineSegment = {
            start: cornerstone.pixelToCanvas(element, data.linkedTextCoords.start),
            end: cornerstone.pixelToCanvas(element, data.linkedTextCoords.end)
        };

        var distanceToPoint = cornerstoneMath.lineSegment.distanceToPoint(lineSegment, coords);
        return (distanceToPoint < 30);
    }

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

    function suscribenonTargetToolModifiedEvent(element) {
        var elementEvents = $._data(element, "events");
        var index = Object.keys(elementEvents).indexOf("nonTargetToolModified");
        if (index < 0) {
            // Subscribe LesionToolModified and calls measurementModified function when lesion measurement is changed or updated.
            $(element).on("nonTargetToolModified", measurementModified);
        }

    }
    ///////// BEGIN IMAGE RENDERING ///////
    function onImageRendered(e, eventData) {

        suscribenonTargetToolModifiedEvent(e.currentTarget);

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
        var config = cornerstoneTools.nonTarget.getConfiguration();

        for (var i = 0; i < toolData.data.length; i++) {
            context.save();

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
                drawArrow(context, handleEndCanvas, handleStartCanvas, color, lineWidth);
            } else {
                drawArrow(context, handleStartCanvas, handleEndCanvas, color, lineWidth);
            }

            if (config.drawHandles) {
                cornerstoneTools.drawHandles(context, eventData, data.handles, color);
            } else if (config.drawHandlesOnHover && data.handles.start.active) {
                cornerstoneTools.drawHandles(context, eventData, [ data.handles.start ], color);
            } else if (config.drawHandlesOnHover && data.handles.end.active) {
                cornerstoneTools.drawHandles(context, eventData, [ data.handles.end ], color);
            }

            //Set coordinates of text
            var linkedTextStartCanvas = cornerstone.pixelToCanvas(eventData.element, data.linkedTextCoords.start);
            var linkedTextEndCanvas = cornerstone.pixelToCanvas(eventData.element, data.linkedTextCoords.end);
            if (!data.linkedTextCoords.init) {
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
            context.setLineDash([2, 3]);
            context.beginPath();
            context.strokeStyle = color;
            context.lineWidth = 1 / eventData.viewport.scale;
            var mid = {
                x: (handleStartCanvas.x + handleEndCanvas.x) / 2,
                y: (handleStartCanvas.y + handleEndCanvas.y) / 2
            };

            context.moveTo(mid.x, mid.y);
            context.lineTo(linkedTextStartCanvas.x + 20, linkedTextStartCanvas.y);
            context.stroke();


            // Draw the text
            if (data.text && data.text !== '') {
                context.font = font;

                var textCoords = {
                    x: linkedTextStartCanvas.x,
                    y: linkedTextStartCanvas.y
                };

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
        $(element).off('CornerstoneToolsTouchDrag', cornerstoneTools.nonTargetTouch.touchMoveCallback);
        $(element).off('CornerstoneToolsDragStartActive', cornerstoneTools.nonTargetTouch.touchDownActivateCallback);
        $(element).off('CornerstoneToolsTap', cornerstoneTools.nonTargetTouch.tapCallback);
        cornerstone.updateImage(element);

        cornerstoneTools.moveNewHandleTouch(touchEventData, measurementData.handles.end, function() {
            cornerstone.updateImage(element);

            if (cornerstoneTools.anyHandlesOutsideImage(touchEventData, measurementData.handles)) {
                // delete the measurement
                cornerstoneTools.removeToolState(element, toolType, measurementData);
            }

            var config = cornerstoneTools.nonTarget.getConfiguration();
            if (measurementData.text === undefined) {
                config.getTextCallback(doneChangingTextCallback);
            }

            $(element).on('CornerstoneToolsTouchDrag', cornerstoneTools.nonTargetTouch.touchMoveCallback);
            $(element).on('CornerstoneToolsDragStartActive', cornerstoneTools.nonTargetTouch.touchDownActivateCallback);
            $(element).on('CornerstoneToolsTap', cornerstoneTools.nonTargetTouch.tapCallback);
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

        var config = cornerstoneTools.nonTarget.getConfiguration();

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

    function updateLesion(e, eventObject) {
        var start = new Date();

        var enabledElement = eventObject.enabledElement;
        var isTarget = eventObject.lesionData.isTarget;
        var lesionNumber = eventObject.lesionData.lesionNumber;
        var type = eventObject.type;

        // if we have no toolData for this element, return immediately as there is nothing to do
        var toolData = cornerstoneTools.getToolState(e.currentTarget, toolType);
        if (toolData === undefined) {
            return;
        }

        //If type is delete, remove measurement
        if (type === "delete") {
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
        } else if (type === "active") {
            for (var i = 0; i < toolData.data.length; i++) {
                var data = toolData.data[i];
                //When click a row of table measurements, measurement will be active and color will be green
                if (data.lesionNumber === eventObject.lesionData.lesionNumber && eventObject.type === "active") {
                    data.active = true;
                } else {
                    data.active = false;
                }
            }
        } else if (type === "inactive") {
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
            viewport: enabledElement.viewport,
            element: enabledElement.element,
            image: enabledElement.image,
            enabledElement: enabledElement,
            canvasContext: context,
            measurementText: "",
            renderTimeInMs: diff,
            lesionNumber: lesionNumber,
            type: type //Holds image will be deleted or active
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
                    cornerstone.displayImage(eventObject.enabledElement.element, image);
                    updateLesion(e, eventObject);
                });
            }
        } else if (eventObject.type === "inactive") {
            updateLesion(e, eventObject);
        }


    }

    //This function is called from cornerstone-viewport.html and updates lesion measurement and makes the lesion active
    function measurementModified(e, eventObject) {
        loadImage(e, eventObject);
    }

    cornerstoneTools.nonTarget = cornerstoneTools.mouseButtonTool({
        addNewMeasurement: addNewMeasurement,
        createNewMeasurement: createNewMeasurement,
        onImageRendered: onImageRendered,
        pointNearTool: pointNearTool,
        pointNearToolForText: pointNearToolForText,
        toolType: toolType,
        mouseDoubleClickCallback: doubleClickCallback
    });

    cornerstoneTools.nonTarget.setConfiguration(configuration);

    cornerstoneTools.nonTargetTouch = cornerstoneTools.touchTool({
        addNewMeasurement: addNewMeasurementTouch,
        createNewMeasurement: createNewMeasurement,
        onImageRendered: onImageRendered,
        pointNearTool: pointNearTool,
        pointNearToolForText: pointNearToolForText,
        toolType: toolType,
        pressCallback: doubleClickCallback
    });


})($, cornerstone, cornerstoneMath, cornerstoneTools);

// End Source; src/imageTools/annotation.js