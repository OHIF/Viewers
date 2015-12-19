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
        //doneCallback(prompt('Enter your lesion location:'));
    }

    function changeLesionLocationCallback(measurementData, eventData, doneCallback) {
        //doneCallback(prompt('Change your lesion location:'));
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
        $(element).off('CornerstoneToolsMouseMove', mouseMoveCallback);
        $(element).off('CornerstoneToolsMouseDown', mouseDownCallback);
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

            // perpendicular line is not connected to long-line
            measurementData.handles.perpendicularStart.locked = false;

             $(element).on('CornerstoneToolsMouseMove', eventData, mouseMoveCallback);
             $(element).on('CornerstoneToolsMouseDown', eventData, mouseDownCallback);
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

            // perpendicular line is not connected to long-line
            measurementData.handles.perpendicularStart.locked = false;

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
                    active: false,
                    drawnIndependently: false,
                    index: 0
                },
                end: {
                    x: mouseEventData.currentPoints.image.x,
                    y: mouseEventData.currentPoints.image.y,
                    highlight: true,
                    active: true,
                    drawnIndependently: false,
                    index: 1
                },
                textBox: {
                    x: mouseEventData.currentPoints.image.x - 50,
                    y: mouseEventData.currentPoints.image.y - 70,
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
                    active: false,
                    locked: true, // If perpendicular line is connected to long-line
                    drawnIndependently: false,
                    index: 2
                },

                perpendicularEnd: {
                    x: mouseEventData.currentPoints.image.x,
                    y: mouseEventData.currentPoints.image.y,
                    highlight: true,
                    active: false,
                    drawnIndependently: false,
                    index: 3
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
        return (distanceToPoint < 25);
    }

    // Move long-axis start point
    function perpendicularBothFixedLeft(eventData, data) {

        var intersection = getLineIntersection(data.handles.start, data.handles.end, data.handles.perpendicularStart, data.handles.perpendicularEnd);

        var distanceFromPerpendicularP1 = getDistance(data.handles.perpendicularStart, intersection);
        var distanceFromPerpendicularP2 = getDistance(data.handles.perpendicularEnd, intersection);

        var distanceToLineP2 = getDistance(data.handles.end, intersection);
        var newLineLength = getDistance(data.handles.end, eventData.currentPoints.image);

        if(newLineLength <= distanceToLineP2) {
            return false;
        }

        var dx = (data.handles.end.x - eventData.currentPoints.image.x) / newLineLength;
        var dy = (data.handles.end.y - eventData.currentPoints.image.y) / newLineLength;

        var k = distanceToLineP2 / newLineLength;

        var newIntersection = { x: data.handles.end.x + ((eventData.currentPoints.image.x - data.handles.end.x) * k), y: data.handles.end.y + ((eventData.currentPoints.image.y - data.handles.end.y) * k)};

        data.handles.perpendicularStart.x = newIntersection.x - distanceFromPerpendicularP1 * dy;
        data.handles.perpendicularStart.y = newIntersection.y + distanceFromPerpendicularP1 * dx;

        data.handles.perpendicularEnd.x = newIntersection.x + distanceFromPerpendicularP2 * dy;
        data.handles.perpendicularEnd.y = newIntersection.y - distanceFromPerpendicularP2 * dx;

        return true;

    }

    // Move long-axis end point
    function perpendicularBothFixedRight(eventData, data) {

        var intersection = getLineIntersection(data.handles.start, data.handles.end, data.handles.perpendicularStart, data.handles.perpendicularEnd);

        var distanceFromPerpendicularP1 = getDistance(data.handles.perpendicularStart, intersection);
        var distanceFromPerpendicularP2 = getDistance(data.handles.perpendicularEnd, intersection);

        var distanceToLineP2 = getDistance(data.handles.start, intersection);
        var newLineLength = getDistance(data.handles.start, eventData.currentPoints.image);

        if(newLineLength <= distanceToLineP2) {
            return false;
        }

        var dx = (data.handles.start.x - eventData.currentPoints.image.x) / newLineLength;
        var dy = (data.handles.start.y - eventData.currentPoints.image.y) / newLineLength;

        var k = distanceToLineP2 / newLineLength;

        var newIntersection = { x: data.handles.start.x + ((eventData.currentPoints.image.x - data.handles.start.x) * k), y: data.handles.start.y + ((eventData.currentPoints.image.y - data.handles.start.y) * k)};

        data.handles.perpendicularStart.x = newIntersection.x + distanceFromPerpendicularP1 * dy;
        data.handles.perpendicularStart.y = newIntersection.y - distanceFromPerpendicularP1 * dx;

        data.handles.perpendicularEnd.x = newIntersection.x - distanceFromPerpendicularP2 * dy;
        data.handles.perpendicularEnd.y = newIntersection.y + distanceFromPerpendicularP2 * dx;

        return true;

    }

    // Move perpendicular line start point
    function perpendicularLeftFixedPoint(eventData, data) {
        var fudgeFactor = 1;

        var fixedPoint = data.handles.perpendicularEnd;
        var movedPoint = eventData.currentPoints.image;

        var nearestFromFixed = getDistanceFromPointToLine(fixedPoint, data.handles.start, data.handles.end);
        var distanceFromFixed = nearestFromFixed.distance;
        var nearestFromMoved = getDistanceFromPointToLine(movedPoint, data.handles.start, data.handles.end);
        var distanceFromMoved = nearestFromMoved.distance;

        var distanceBetweenPoints = getDistance(fixedPoint, movedPoint);

        var total = distanceFromFixed + distanceFromMoved;

        if (distanceBetweenPoints <= distanceFromFixed) {
            return false;
        }

        var length = getDistance(data.handles.start, data.handles.end);
        var dx = (data.handles.start.x - data.handles.end.x) / length;
        var dy = (data.handles.start.y - data.handles.end.y) / length;

        var adjustedLineP1 = {x: data.handles.start.x - fudgeFactor * dx, y: data.handles.start.y - fudgeFactor * dy};
        var adjustedLineP2 = {x: data.handles.end.x + fudgeFactor * dx, y: data.handles.end.y + fudgeFactor * dy};

        data.handles.perpendicularStart.x = movedPoint.x;
        data.handles.perpendicularStart.y = movedPoint.y;
        data.handles.perpendicularEnd.x = movedPoint.x - total * dy;
        data.handles.perpendicularEnd.y = movedPoint.y + total * dx;

        var intersection = getLineIntersection(data.handles.start, data.handles.end, data.handles.perpendicularStart, data.handles.perpendicularEnd);
        if (!intersection.intersected) {
            if (getDistance(movedPoint, data.handles.start) > getDistance(movedPoint, data.handles.end) ) {
                data.handles.perpendicularStart.x = adjustedLineP2.x + distanceFromMoved * dy;
                data.handles.perpendicularStart.y = adjustedLineP2.y - distanceFromMoved * dx;
                data.handles.perpendicularEnd.x = data.handles.perpendicularStart.x - total * dy;
                data.handles.perpendicularEnd.y = data.handles.perpendicularStart.y + total * dx;

                return true;

            } else {
                data.handles.perpendicularStart.x = adjustedLineP1.x + distanceFromMoved * dy;
                data.handles.perpendicularStart.y = adjustedLineP1.y - distanceFromMoved * dx;
                data.handles.perpendicularEnd.x = data.handles.perpendicularStart.x - total * dy;
                data.handles.perpendicularEnd.y = data.handles.perpendicularStart.y + total * dx;

                return true;
            }

        }

        return true;
    }

    // Move perpendicular line end point
    function perpendicularRightFixedPoint(eventData, data) {
        var fudgeFactor = 1;

        var fixedPoint = data.handles.perpendicularStart;
        var movedPoint = eventData.currentPoints.image;

        var nearestFromFixed = getDistanceFromPointToLine(fixedPoint, data.handles.start, data.handles.end);
        var distanceFromFixed = nearestFromFixed.distance;
        var nearestFromMoved = getDistanceFromPointToLine(movedPoint, data.handles.start, data.handles.end);
        var distanceFromMoved = nearestFromMoved.distance;

        var distanceBetweenPoints = getDistance(fixedPoint, movedPoint);

        var total = distanceFromFixed + distanceFromMoved;

        if (distanceBetweenPoints <= distanceFromFixed) {
            return false;
        }

        var length = getDistance(data.handles.start, data.handles.end);
        var dx = (data.handles.start.x - data.handles.end.x) / length;
        var dy = (data.handles.start.y - data.handles.end.y) / length;

        var adjustedLineP1 = {x: data.handles.start.x - fudgeFactor * dx, y: data.handles.start.y - fudgeFactor * dy};
        var adjustedLineP2 = {x: data.handles.end.x + fudgeFactor * dx, y: data.handles.end.y + fudgeFactor * dy};

        data.handles.perpendicularStart.x = movedPoint.x + total * dy;
        data.handles.perpendicularStart.y = movedPoint.y - total * dx;
        data.handles.perpendicularEnd.x = movedPoint.x;
        data.handles.perpendicularEnd.y = movedPoint.y;

        var intersection = getLineIntersection(data.handles.start, data.handles.end, data.handles.perpendicularStart, data.handles.perpendicularEnd);
        if (!intersection.intersected) {
            if (getDistance(movedPoint, data.handles.start) > getDistance(movedPoint, data.handles.end) ) {
                data.handles.perpendicularEnd.x = adjustedLineP2.x - distanceFromMoved * dy;
                data.handles.perpendicularEnd.y = adjustedLineP2.y + distanceFromMoved * dx;
                data.handles.perpendicularStart.x = data.handles.perpendicularEnd.x + total * dy;
                data.handles.perpendicularStart.y = data.handles.perpendicularEnd.y - total * dx;

                return true;

            } else {
                data.handles.perpendicularEnd.x = adjustedLineP1.x - distanceFromMoved * dy;
                data.handles.perpendicularEnd.y = adjustedLineP1.y + distanceFromMoved * dx;
                data.handles.perpendicularStart.x = data.handles.perpendicularEnd.x + total * dy;
                data.handles.perpendicularStart.y = data.handles.perpendicularEnd.y - total * dx;

                return true;
            }

        }

        return true;
    }

    // Sets position of handles(start, end, perpendicularStart, perpendicularEnd)
    function setHandlesPosition (handle, eventData, data) {

        if (handle.index === 0) {
            // if long-axis start point is moved
            var result = perpendicularBothFixedLeft(eventData, data);
            if(result) {
                handle.x = eventData.currentPoints.image.x;
                handle.y = eventData.currentPoints.image.y;
            } else {
                eventData.currentPoints.image.x = handle.x;
                eventData.currentPoints.image.y = handle.y;
            }

        } else if(handle.index === 1) {
            // if long-axis end point is moved
            var result = perpendicularBothFixedRight(eventData, data);
            if(result) {
                handle.x = eventData.currentPoints.image.x;
                handle.y = eventData.currentPoints.image.y;
            } else {
                eventData.currentPoints.image.x = handle.x;
                eventData.currentPoints.image.y = handle.y;
            }

        } else if(handle.index === 2) {
            var outOfBounce = false;
            // if perpendicular start point is moved

            var intersection = getLineIntersection(data.handles.start, data.handles.end, data.handles.perpendicularEnd, eventData.currentPoints.image);
            if (!intersection.intersected) {
                intersection = getLineIntersection(data.handles.start, data.handles.end, data.handles.perpendicularEnd, data.handles.perpendicularStart);

                var d1 = getDistance(intersection, data.handles.start);
                var d2 = getDistance(intersection, data.handles.end);

                if (!intersection.intersected || d1 < 3 || d2 < 3) {
                    outOfBounce = true;
                }
            }

            var movedPoint = false;

            if (!outOfBounce) {
                movedPoint = perpendicularLeftFixedPoint(eventData, data);

                if (!movedPoint) {
                    eventData.currentPoints.image.x = data.handles.perpendicularStart.x;
                    eventData.currentPoints.image.y = data.handles.perpendicularStart.y;
                }
            }

        } else if(handle.index === 3) {

            var outOfBounce = false;
            // if perpendicular end point is moved

            var intersection = getLineIntersection(data.handles.start, data.handles.end, data.handles.perpendicularStart, eventData.currentPoints.image);
            if (!intersection.intersected) {
                intersection = getLineIntersection(data.handles.start, data.handles.end, data.handles.perpendicularEnd, data.handles.perpendicularStart);

                var d1 = getDistance(intersection, data.handles.start);
                var d2 = getDistance(intersection, data.handles.end);

                if (!intersection.intersected || d1 < 3 || d2 < 3) {
                    outOfBounce = true;
                }
            }

            var movedPoint = false;

            if (!outOfBounce) {
                movedPoint = perpendicularRightFixedPoint(eventData, data);

                if (!movedPoint) {
                    eventData.currentPoints.image.x = data.handles.perpendicularEnd.x;
                    eventData.currentPoints.image.y = data.handles.perpendicularEnd.y;
                }
            }

        }

    }

    //****************************************/
    // Cornerstone Methods
    //****************************************/

    function moveHandle(mouseEventData, toolType, data, handle, doneMovingCallback, preventHandleOutsideImage) {
        var element = mouseEventData.element;
        var distanceFromTool = {
            x: handle.x - mouseEventData.currentPoints.image.x,
            y: handle.y - mouseEventData.currentPoints.image.y
        };

        function mouseDragCallback(e, eventData) {
            handle.active = true;

            if (handle.index === undefined || handle.index === null) {
                handle.x = eventData.currentPoints.image.x + distanceFromTool.x;
                handle.y = eventData.currentPoints.image.y + distanceFromTool.y;
            } else {
                setHandlesPosition(handle, eventData, data);
            }

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

    // mouseMoveCallback is used to hide handles when mouse is away
    function mouseMoveCallback(e, eventData) {
        cornerstoneTools.toolCoordinates.setCoords(eventData);
        // if a mouse button is down, do nothing
        if (eventData.which !== 0) {
            return;
        }

        // if we have no tool data for this element, do nothing
        var toolData = cornerstoneTools.getToolState(eventData.element, toolType);
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

            if ((pointNearTool(eventData.element, data, coords) && !data.active) || (!pointNearTool(eventData.element, data, coords) && data.active)) {
                data.active = !data.active;

                // Set handles visibility
                Object.keys(data.handles).forEach(function(name) {
                    if(name !== "textBox") {
                        var handle = data.handles[name];
                        handle.drawnIndependently = !data.active;
                    }
                });
                imageNeedsUpdate = true;
            }
        }

        // Handle activation status changed, redraw the image
        if (imageNeedsUpdate === true) {
            cornerstone.updateImage(eventData.element);
        }
    }

    // mouseDowCallback is used to restrict behaviour of perpendicular-line
    function mouseDownCallback(e, eventData) {
        var data;
        var element = eventData.element;

        function handleDoneMove() {
            data.active = false;
            data.invalidated = true;
            if (cornerstoneTools.anyHandlesOutsideImage(eventData, data.handles)) {
                // delete the measurement
                cornerstoneTools.removeToolState(element, toolType, data);
            }

            cornerstone.updateImage(element);
            $(element).on('CornerstoneToolsMouseMove', eventData, mouseMoveCallback);
        }

        if (cornerstoneTools.isMouseButtonEnabled(eventData.which, e.data.mouseButtonMask)) {
            var coords = eventData.startPoints.canvas;
            var toolData = cornerstoneTools.getToolState(e.currentTarget, toolType);

            var i;

            // now check to see if there is a handle we can move
            if (toolData) {
                for (i = 0; i < toolData.data.length; i++) {
                    data = toolData.data[i];
                    var distanceSq = 25;
                    var handle = cornerstoneTools.getHandleNearImagePoint(element, data.handles, coords, distanceSq);
                    if (handle) {
                        $(element).off('CornerstoneToolsMouseMove', mouseMoveCallback);
                        data.active = true;
                        moveHandle(eventData, toolType, data, handle, handleDoneMove);
                        e.stopImmediatePropagation();
                        return false;
                    }
                }
            }

            // Now check to see if there is a line we can move
            // now check to see if we have a tool that we can move
            if (toolData && pointNearTool) {
                var options = {
                    deleteIfHandleOutsideImage: true,
                    preventHandleOutsideImage: false
                };

                for (i = 0; i < toolData.data.length; i++) {
                    data = toolData.data[i];
                    if (pointNearTool(element, data, coords)) {
                        $(element).off('CornerstoneToolsMouseMove', mouseMoveCallback);
                        cornerstoneTools.moveAllHandles(e, data, toolData, toolType, options, handleDoneMove);
                        e.stopImmediatePropagation();
                        return false;
                    }
                }
            }
        }
    }

    //****************************************/
    // Cornerstone Methods end
    //****************************************/

    // draw perpendicular line
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

        var startX = mid.x + (perpendicularLineLength / 2) * vectorY;
        var startY = mid.y - (perpendicularLineLength / 2) * vectorX;
        var endX = mid.x - (perpendicularLineLength / 2) * vectorY;
        var endY = mid.y + (perpendicularLineLength / 2) * vectorX;

        if (data.handles.perpendicularStart.locked) {
            data.handles.perpendicularStart.x = startX;
            data.handles.perpendicularStart.y = startY;
            data.handles.perpendicularEnd.x = endX;
            data.handles.perpendicularEnd.y = endY;
        }

        // Draw perpendicular line
        var perpendicularStartCanvas  = cornerstone.pixelToCanvas(element, data.handles.perpendicularStart);
        var perpendicularEndCanvas  = cornerstone.pixelToCanvas(element, data.handles.perpendicularEnd);
        context.beginPath();
        context.strokeStyle = color;
        context.lineWidth = lineWidth;
        context.moveTo(perpendicularStartCanvas.x, perpendicularStartCanvas.y);
        context.lineTo(perpendicularEndCanvas.x, perpendicularEndCanvas.y);
        context.stroke();

    }


    function findDottedLinePosition(data) {

        var distancesArr = [];
        var minDistance;

        // Find distances between handles and textBox
        var distanceToStart = getDistance(data.handles.start, data.handles.textBox);
        distancesArr.push({distance: distanceToStart, point: data.handles.start});
        minDistance = distanceToStart;

        var distanceToEnd = getDistance(data.handles.end, data.handles.textBox);
        distancesArr.push({distance: distanceToEnd, point: data.handles.end});
        if(distanceToEnd < minDistance) {
            minDistance = distanceToEnd;
        }

        if(data.handles.perpendicularStart.x && data.handles.perpendicularStart.y) {
            var distanceToPerpendicularStart = getDistance(data.handles.perpendicularStart, data.handles.textBox);
            distancesArr.push({distance: distanceToPerpendicularStart, point: data.handles.perpendicularStart});
            if(distanceToPerpendicularStart < minDistance) {
                minDistance = distanceToPerpendicularStart;
            }

        }

        if(data.handles.perpendicularEnd.x && data.handles.perpendicularEnd.y) {
            var distanceToPerpendicularEnd = getDistance(data.handles.perpendicularEnd, data.handles.textBox);
            distancesArr.push({distance: distanceToPerpendicularEnd, point: data.handles.perpendicularEnd});
            if(distanceToPerpendicularEnd < minDistance) {
                minDistance = distanceToPerpendicularEnd;
            }
        }
        for(var i=0; i< distancesArr.length; i++) {
            var obj = distancesArr[i];
            if (obj.distance === minDistance) {
                return obj.point;
            }
        }
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

            // Draw perpendicular line
            drawPerpendicularLine(context,eventData, element, data, color, lineWidth);

            // draw the handles
            cornerstoneTools.drawHandles(context, eventData, data.handles, color);

            //Draw linked line as dashed
            context.beginPath();
            context.strokeStyle = color;
            context.lineWidth = lineWidth;
            context.setLineDash([2, 3]);

            // Set position of text
            var perpendicularStartCanvas = cornerstone.pixelToCanvas(element, findDottedLinePosition(data));
            context.moveTo(perpendicularStartCanvas.x, perpendicularStartCanvas.y);
            context.lineTo(canvasTextLocation.x + 20, canvasTextLocation.y + 40);
            context.stroke();

            // Draw the Length text
            var dx = (data.handles.start.x - data.handles.end.x) * (eventData.image.columnPixelSpacing || 1);
            var dy = (data.handles.start.y - data.handles.end.y) * (eventData.image.rowPixelSpacing || 1);
            var length = Math.sqrt(dx * dx + dy * dy);

            // Draw the Length text
            var wx = (data.handles.perpendicularStart.x - data.handles.perpendicularEnd.x) * (eventData.image.columnPixelSpacing || 1);
            var wy = (data.handles.perpendicularStart.y - data.handles.perpendicularEnd.y) * (eventData.image.rowPixelSpacing || 1);
            var width = Math.sqrt(wx * wx + wy * wy);


            var suffix = ' mm';
            if (!eventData.image.rowPixelSpacing || !eventData.image.columnPixelSpacing) {
                suffix = ' pixels';
            }

            var lengthText = ' L ' + length.toFixed(2) + suffix;
            var widthText =  ' W ' + width.toFixed(2) + suffix;
            var textLines = [data.lesionName, lengthText, widthText];

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
            LesionManager.updateLesionData(lesionData);
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
        mouseDownCallback: mouseDownCallback,
        mouseMoveCallback: mouseMoveCallback,
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