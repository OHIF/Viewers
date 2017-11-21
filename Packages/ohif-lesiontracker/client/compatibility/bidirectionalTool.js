import { OHIF } from 'meteor/ohif:core';
import { Viewerbase } from 'meteor/ohif:viewerbase';

import { cornerstone, cornerstoneMath, cornerstoneTools } from 'meteor/ohif:cornerstone';

var toolType = 'bidirectional';

const toolDefaultStates = Viewerbase.toolManager.getToolDefaultStates();
const shadowConfig = toolDefaultStates.shadowConfig;
const textBoxConfig = toolDefaultStates.textBoxConfig;

var configuration = {
    getMeasurementLocationCallback: getMeasurementLocationCallback,
    changeMeasurementLocationCallback: changeMeasurementLocationCallback,
    ...shadowConfig,
    textBox: textBoxConfig
};

// Used to cancel tool placement
var keys = {
    ESC: 27
};

// The distance between the mouse and the tool to make it active
var distanceThreshold = 6;

// Define a callback to get your text annotation
// This could be used, e.g. to open a modal
function getMeasurementLocationCallback(measurementData, eventData, doneCallback) {
    //doneCallback(prompt('Enter your lesion location:'));
}

function changeMeasurementLocationCallback(measurementData, eventData, doneCallback) {
    //doneCallback(prompt('Change your lesion location:'));
}

function createNewMeasurement(mouseEventData) {
    // Create the measurement data for this tool with the end handle activated
    const measurementData = {
        isCreating: true,
        visible: true,
        active: true,
        handles: {
            start: {
                x: mouseEventData.currentPoints.image.x,
                y: mouseEventData.currentPoints.image.y,
                highlight: true,
                active: false,
                drawnIndependently: false,
                allowedOutsideImage: false,
                index: 0
            },
            end: {
                x: mouseEventData.currentPoints.image.x,
                y: mouseEventData.currentPoints.image.y,
                highlight: true,
                active: true,
                drawnIndependently: false,
                allowedOutsideImage: false,
                index: 1
            },
            textBox: {
                x: mouseEventData.currentPoints.image.x - 50,
                y: mouseEventData.currentPoints.image.y - 70,
                active: false,
                movesIndependently: false,
                drawnIndependently: true,
                allowedOutsideImage: true,
                hasBoundingBox: true
            },
            perpendicularStart: {
                x: mouseEventData.currentPoints.image.x,
                y: mouseEventData.currentPoints.image.y,
                highlight: true,
                active: false,
                locked: true, // If perpendicular line is connected to long-line
                drawnIndependently: false,
                allowedOutsideImage: false,
                index: 2
            },
            perpendicularEnd: {
                x: mouseEventData.currentPoints.image.x,
                y: mouseEventData.currentPoints.image.y,
                highlight: true,
                active: false,
                drawnIndependently: false,
                allowedOutsideImage: false,
                index: 3
            }
        },
        longestDiameter: 0,
        shortestDiameter: 0,
        toolType: 'bidirectional'
    };

    return measurementData;
}

function addNewMeasurement(mouseEventData) {
    const element = mouseEventData.element;
    const $element = $(element);

    // LT-29 Disable Target Measurements when pixel spacing is not available
    if (!mouseEventData.image.rowPixelSpacing || !mouseEventData.image.columnPixelSpacing) {
        return;
    }

    function doneCallback() {
        measurementData.active = false;
        cornerstone.updateImage(element);
    }

    const measurementData = createNewMeasurement(mouseEventData);
    measurementData.viewport = cornerstone.getViewport(element);

    const eventData = {
        mouseButtonMask: mouseEventData.which
    };

    const config = cornerstoneTools.bidirectional.getConfiguration();

    // associate this data with this imageId so we can render it and manipulate it
    cornerstoneTools.addToolState(element, toolType, measurementData);

    // since we are dragging to another place to drop the end point, we can just activate
    // the end point and let the moveHandle move it for us.
    $element.off('CornerstoneToolsMouseMove', mouseMoveCallback);
    $element.off('CornerstoneToolsMouseDown', mouseDownCallback);
    $element.off('CornerstoneToolsMouseDownActivate', cornerstoneTools.bidirectional.mouseDownActivateCallback);
    $element.off('CornerstoneToolsMouseDoubleClick', doubleClickCallback);

    // Update the perpendicular line handles position
    const updateHandler = (event, eventData) => updatePerpendicularLineHandles(eventData, measurementData);
    $element.on('CornerstoneToolsMouseDrag', updateHandler);
    $element.on('CornerstoneToolsMouseUp', updateHandler);

    let cancelled = false;
    const cancelAction = () => {
        cancelled = true;
        cornerstoneTools.removeToolState(element, toolType, measurementData);
    };

    // Add a flag for using Esc to cancel tool placement
    const keyDownHandler = event => {
        // If the Esc key was pressed, set the flag to true
        if (event.which === keys.ESC) {
            cancelAction();
        }

        // Don't propagate this keydown event so it can't interfere
        // with anything outside of this tool
        return false;
    };

    // Bind a one-time event listener for the Esc key
    $element.one('keydown', keyDownHandler);

    // Keep the current image and create a handler for new rendered images
    const currentImage = cornerstone.getImage(element);
    const currentViewport = cornerstone.getViewport(element);
    const imageRenderedHandler = () => {
        const newImage = cornerstone.getImage(element);

        // Check if the rendered image changed during measurement creation and delete it if so
        if (newImage.imageId !== currentImage.imageId) {
            cornerstone.displayImage(element, currentImage, currentViewport);
            cancelAction();
            cornerstone.displayImage(element, newImage, currentViewport);
        }
    };

    // Bind the event listener for image rendering
    $element.on('CornerstoneImageRendered', imageRenderedHandler);

    // Bind the tool deactivation and enlargement handlers
    $element.on('CornerstoneToolsToolDeactivated', cancelAction);
    $element.one('ohif.viewer.viewport.toggleEnlargement', cancelAction);

    cornerstone.updateImage(element);

    const timestamp = new Date().getTime();
    cornerstoneTools.moveNewHandle(mouseEventData, toolType, measurementData, measurementData.handles.end, function() {
        const { handles, longestDiameter, shortestDiameter } = measurementData;
        const hasHandlesOutside = cornerstoneTools.anyHandlesOutsideImage(mouseEventData, handles);
        const longestDiameterSize = parseFloat(longestDiameter) || 0;
        const shortestDiameterSize = parseFloat(shortestDiameter) || 0;
        const isTooSmal = (longestDiameterSize < 1) || (shortestDiameterSize < 1);
        const isTooFast = (new Date().getTime() - timestamp) < 150;
        if (cancelled || hasHandlesOutside || isTooSmal || isTooFast) {
            // delete the measurement
            measurementData.cancelled = true;
            cornerstoneTools.removeToolState(element, toolType, measurementData);
        } else {
            // Set lesionMeasurementData Session
            config.getMeasurementLocationCallback(measurementData, mouseEventData, doneCallback);
        }

        // Unbind the Esc keydown hook
        $element.off('keydown', keyDownHandler);

        // Unbind the event listener for image rendering
        $element.off('CornerstoneImageRendered', imageRenderedHandler);

        // Unbind the tool deactivation and enlargement handlers
        $element.off('CornerstoneToolsToolDeactivated', cancelAction);
        $element.off('ohif.viewer.viewport.toggleEnlargement', cancelAction);

        // perpendicular line is not connected to long-line
        measurementData.handles.perpendicularStart.locked = false;

        // Unbind the handlers to update perpendicular line
        $element.off('CornerstoneToolsMouseDrag', updateHandler);
        $element.off('CornerstoneToolsMouseUp', updateHandler);

        $element.on('CornerstoneToolsMouseMove', eventData, mouseMoveCallback);
        $element.on('CornerstoneToolsMouseDown', eventData, mouseDownCallback);
        $element.on('CornerstoneToolsMouseDownActivate', eventData, cornerstoneTools.bidirectional.mouseDownActivateCallback);
        $element.on('CornerstoneToolsMouseDoubleClick', eventData, doubleClickCallback);
        cornerstone.updateImage(element);
    });
}

function addNewMeasurementTouch(touchEventData) {
    var element = touchEventData.element;

    // LT-29 Disable Target Measurements when pixel spacing is not available
    if (!touchEventData.image.rowPixelSpacing || !touchEventData.image.columnPixelSpacing) {
        return;
    }

    function doneCallback() {
        measurementData.active = false;
        cornerstone.updateImage(element);
    }

    var measurementData = createNewMeasurement(touchEventData);

    var config = cornerstoneTools.bidirectional.getConfiguration();

    // associate this data with this imageId so we can render it and manipulate it
    cornerstoneTools.addToolState(element, toolType, measurementData);

    // since we are dragging to another place to drop the end point, we can just activate
    // the end point and let the moveHandle move it for us.
    $(element).off('CornerstoneToolsTouchDrag', cornerstoneTools.bidirectional.touchMoveHandle);
    $(element).off('CornerstoneToolsTap', cornerstoneTools.bidirectional.tapCallback);
    $(element).off('CornerstoneToolsDragStartActive', cornerstoneTools.bidirectional.touchDownActivateCallback);

    // Update the perpendicular line handles position
    const updateHandler = (event, eventData) => updatePerpendicularLineHandles(eventData, measurementData);
    $element.on('CornerstoneToolsTouchDrag', updateHandler);
    $element.on('CornerstoneToolsTouchEnd', updateHandler);

    cornerstone.updateImage(element);
    cornerstoneTools.moveNewHandleTouch(touchEventData, toolType, measurementData, measurementData.handles.end, function() {
        if (cancelled || cornerstoneTools.anyHandlesOutsideImage(touchEventData, measurementData.handles)) {
            // delete the measurement
            cornerstoneTools.removeToolState(element, toolType, measurementData);
        } else {
            // Set lesionMeasurementData Session
            config.getMeasurementLocationCallback(measurementData, touchEventData, doneCallback);
        }

        // perpendicular line is not connected to long-line
        measurementData.handles.perpendicularStart.locked = false;

        // Unbind the handlers to update perpendicular line
        $element.off('CornerstoneToolsTouchDrag', updateHandler);
        $element.off('CornerstoneToolsTouchEnd', updateHandler);

        $(element).on('CornerstoneToolsTouchDrag', cornerstoneTools.bidirectional.touchMoveHandle);
        $(element).on('CornerstoneToolsTap', cornerstoneTools.bidirectional.tapCallback);
        $(element).on('CornerstoneToolsDragStartActive', cornerstoneTools.bidirectional.touchDownActivateCallback);
        cornerstone.updateImage(element);
    });
}

function pointNearTool(element, data, coords) {
    var lineSegment = {
        start: cornerstone.pixelToCanvas(element, data.handles.start),
        end: cornerstone.pixelToCanvas(element, data.handles.end)
    };
    var distanceToPoint = cornerstoneMath.lineSegment.distanceToPoint(lineSegment, coords);

    if (cornerstoneTools.pointInsideBoundingBox(data.handles.textBox, coords)) {
        return true;
    }

    if (pointNearPerpendicular(element, data.handles, coords)) {
        return true;
    }

    return (distanceToPoint < distanceThreshold);
}

function pointNearPerpendicular(element, handles, coords) {
    var lineSegment = {
        start: cornerstone.pixelToCanvas(element, handles.perpendicularStart),
        end: cornerstone.pixelToCanvas(element, handles.perpendicularEnd)
    };
    var distanceToPoint = cornerstoneMath.lineSegment.distanceToPoint(lineSegment, coords);
    return (distanceToPoint < distanceThreshold);
}

// Move long-axis start point
function perpendicularBothFixedLeft(eventData, data) {
    var longLine = {
        start: {
            x: data.handles.start.x,
            y: data.handles.start.y
        },
        end: {
            x: data.handles.end.x,
            y: data.handles.end.y
        }
    };

    var perpendicularLine = {
        start: {
            x: data.handles.perpendicularStart.x,
            y: data.handles.perpendicularStart.y
        },
        end: {
            x: data.handles.perpendicularEnd.x,
            y: data.handles.perpendicularEnd.y
        }
    };

    var intersection = cornerstoneMath.lineSegment.intersectLine(longLine, perpendicularLine);

    var distanceFromPerpendicularP1 = cornerstoneMath.point.distance(data.handles.perpendicularStart, intersection);
    var distanceFromPerpendicularP2 = cornerstoneMath.point.distance(data.handles.perpendicularEnd, intersection);

    var distanceToLineP2 = cornerstoneMath.point.distance(data.handles.end, intersection);
    var newLineLength = cornerstoneMath.point.distance(data.handles.end, eventData.currentPoints.image);

    if (newLineLength <= distanceToLineP2) {
        return false;
    }

    var dx = (data.handles.end.x - eventData.currentPoints.image.x) / newLineLength;
    var dy = (data.handles.end.y - eventData.currentPoints.image.y) / newLineLength;

    var k = distanceToLineP2 / newLineLength;

    var newIntersection = {
        x: data.handles.end.x + ((eventData.currentPoints.image.x - data.handles.end.x) * k),
        y: data.handles.end.y + ((eventData.currentPoints.image.y - data.handles.end.y) * k)
    };

    data.handles.perpendicularStart.x = newIntersection.x - distanceFromPerpendicularP1 * dy;
    data.handles.perpendicularStart.y = newIntersection.y + distanceFromPerpendicularP1 * dx;

    data.handles.perpendicularEnd.x = newIntersection.x + distanceFromPerpendicularP2 * dy;
    data.handles.perpendicularEnd.y = newIntersection.y - distanceFromPerpendicularP2 * dx;

    return true;

}

// Move long-axis end point
function perpendicularBothFixedRight(eventData, data) {
    var longLine = {
        start: {
            x: data.handles.start.x,
            y: data.handles.start.y
        },
        end: {
            x: data.handles.end.x,
            y: data.handles.end.y
        }
    };

    var perpendicularLine = {
        start: {
            x: data.handles.perpendicularStart.x,
            y: data.handles.perpendicularStart.y
        },
        end: {
            x: data.handles.perpendicularEnd.x,
            y: data.handles.perpendicularEnd.y
        }
    };

    var intersection = cornerstoneMath.lineSegment.intersectLine(longLine, perpendicularLine);

    var distanceFromPerpendicularP1 = cornerstoneMath.point.distance(data.handles.perpendicularStart, intersection);
    var distanceFromPerpendicularP2 = cornerstoneMath.point.distance(data.handles.perpendicularEnd, intersection);

    var distanceToLineP2 = cornerstoneMath.point.distance(data.handles.start, intersection);
    var newLineLength = cornerstoneMath.point.distance(data.handles.start, eventData.currentPoints.image);

    if (newLineLength <= distanceToLineP2) {
        return false;
    }

    var dx = (data.handles.start.x - eventData.currentPoints.image.x) / newLineLength;
    var dy = (data.handles.start.y - eventData.currentPoints.image.y) / newLineLength;

    var k = distanceToLineP2 / newLineLength;

    var newIntersection = {
        x: data.handles.start.x + ((eventData.currentPoints.image.x - data.handles.start.x) * k),
        y: data.handles.start.y + ((eventData.currentPoints.image.y - data.handles.start.y) * k)
    };

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

    var distanceFromFixed = cornerstoneMath.lineSegment.distanceToPoint(data.handles, fixedPoint);
    var distanceFromMoved = cornerstoneMath.lineSegment.distanceToPoint(data.handles, movedPoint);

    var distanceBetweenPoints = cornerstoneMath.point.distance(fixedPoint, movedPoint);

    var total = distanceFromFixed + distanceFromMoved;

    if (distanceBetweenPoints <= distanceFromFixed) {
        return false;
    }

    var length = cornerstoneMath.point.distance(data.handles.start, data.handles.end);
    if (length === 0) {
        return false;
    }

    var dx = (data.handles.start.x - data.handles.end.x) / length;
    var dy = (data.handles.start.y - data.handles.end.y) / length;

    var adjustedLineP1 = {
        x: data.handles.start.x - fudgeFactor * dx,
        y: data.handles.start.y - fudgeFactor * dy
    };
    var adjustedLineP2 = {
        x: data.handles.end.x + fudgeFactor * dx,
        y: data.handles.end.y + fudgeFactor * dy
    };

    data.handles.perpendicularStart.x = movedPoint.x;
    data.handles.perpendicularStart.y = movedPoint.y;
    data.handles.perpendicularEnd.x = movedPoint.x - total * dy;
    data.handles.perpendicularEnd.y = movedPoint.y + total * dx;

    var longLine = {
        start: {
            x: data.handles.start.x,
            y: data.handles.start.y
        },
        end: {
            x: data.handles.end.x,
            y: data.handles.end.y
        }
    };

    var perpendicularLine = {
        start: {
            x: data.handles.perpendicularStart.x,
            y: data.handles.perpendicularStart.y
        },
        end: {
            x: data.handles.perpendicularEnd.x,
            y: data.handles.perpendicularEnd.y
        }
    };

    var intersection = cornerstoneMath.lineSegment.intersectLine(longLine, perpendicularLine);
    if (!intersection) {
        if (cornerstoneMath.point.distance(movedPoint, data.handles.start) > cornerstoneMath.point.distance(movedPoint, data.handles.end)) {
            data.handles.perpendicularStart.x = adjustedLineP2.x + distanceFromMoved * dy;
            data.handles.perpendicularStart.y = adjustedLineP2.y - distanceFromMoved * dx;
            data.handles.perpendicularEnd.x = data.handles.perpendicularStart.x - total * dy;
            data.handles.perpendicularEnd.y = data.handles.perpendicularStart.y + total * dx;
        } else {
            data.handles.perpendicularStart.x = adjustedLineP1.x + distanceFromMoved * dy;
            data.handles.perpendicularStart.y = adjustedLineP1.y - distanceFromMoved * dx;
            data.handles.perpendicularEnd.x = data.handles.perpendicularStart.x - total * dy;
            data.handles.perpendicularEnd.y = data.handles.perpendicularStart.y + total * dx;
        }
    }

    return true;
}

// Move perpendicular line end point
function perpendicularRightFixedPoint(eventData, data) {
    var fudgeFactor = 1;

    var fixedPoint = data.handles.perpendicularStart;
    var movedPoint = eventData.currentPoints.image;

    var distanceFromFixed = cornerstoneMath.lineSegment.distanceToPoint(data.handles, fixedPoint);
    var distanceFromMoved = cornerstoneMath.lineSegment.distanceToPoint(data.handles, movedPoint);

    var distanceBetweenPoints = cornerstoneMath.point.distance(fixedPoint, movedPoint);

    var total = distanceFromFixed + distanceFromMoved;

    if (distanceBetweenPoints <= distanceFromFixed) {
        return false;
    }

    var length = cornerstoneMath.point.distance(data.handles.start, data.handles.end);
    var dx = (data.handles.start.x - data.handles.end.x) / length;
    var dy = (data.handles.start.y - data.handles.end.y) / length;

    var adjustedLineP1 = {
        x: data.handles.start.x - fudgeFactor * dx,
        y: data.handles.start.y - fudgeFactor * dy
    };
    var adjustedLineP2 = {
        x: data.handles.end.x + fudgeFactor * dx,
        y: data.handles.end.y + fudgeFactor * dy
    };

    data.handles.perpendicularStart.x = movedPoint.x + total * dy;
    data.handles.perpendicularStart.y = movedPoint.y - total * dx;
    data.handles.perpendicularEnd.x = movedPoint.x;
    data.handles.perpendicularEnd.y = movedPoint.y;
    data.handles.perpendicularEnd.locked = false;
    data.handles.perpendicularStart.locked = false;

    var longLine = {
        start: {
            x: data.handles.start.x,
            y: data.handles.start.y
        },
        end: {
            x: data.handles.end.x,
            y: data.handles.end.y
        }
    };

    var perpendicularLine = {
        start: {
            x: data.handles.perpendicularStart.x,
            y: data.handles.perpendicularStart.y
        },
        end: {
            x: data.handles.perpendicularEnd.x,
            y: data.handles.perpendicularEnd.y
        }
    };

    var intersection = cornerstoneMath.lineSegment.intersectLine(longLine, perpendicularLine);
    if (!intersection) {
        if (cornerstoneMath.point.distance(movedPoint, data.handles.start) > cornerstoneMath.point.distance(movedPoint, data.handles.end)) {
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
function setHandlesPosition(handle, eventData, data) {

    let movedPoint,
        outOfBounds,
        result,
        intersection,
        d1,
        d2;

    let longLine = {},
        perpendicularLine = {};

    if (handle.index === 0) {
        // if long-axis start point is moved
        result = perpendicularBothFixedLeft(eventData, data);
        if (result) {
            handle.x = eventData.currentPoints.image.x;
            handle.y = eventData.currentPoints.image.y;
        } else {
            eventData.currentPoints.image.x = handle.x;
            eventData.currentPoints.image.y = handle.y;
        }

    } else if (handle.index === 1) {
        // if long-axis end point is moved
        result = perpendicularBothFixedRight(eventData, data);
        if (result) {
            handle.x = eventData.currentPoints.image.x;
            handle.y = eventData.currentPoints.image.y;
        } else {
            eventData.currentPoints.image.x = handle.x;
            eventData.currentPoints.image.y = handle.y;
        }

    } else if (handle.index === 2) {
        outOfBounds = false;
        // if perpendicular start point is moved
        longLine.start = {
            x: data.handles.start.x,
            y: data.handles.start.y
        };
        longLine.end = {
            x: data.handles.end.x,
            y: data.handles.end.y
        };

        perpendicularLine.start = {
            x: data.handles.perpendicularEnd.x,
            y: data.handles.perpendicularEnd.y
        };
        perpendicularLine.end = {
            x: eventData.currentPoints.image.x,
            y: eventData.currentPoints.image.y
        };

        intersection = cornerstoneMath.lineSegment.intersectLine(longLine, perpendicularLine);
        if (!intersection) {
            perpendicularLine.end = {
                x: data.handles.perpendicularStart.x,
                y: data.handles.perpendicularStart.y
            };

            intersection = cornerstoneMath.lineSegment.intersectLine(longLine, perpendicularLine);

            d1 = cornerstoneMath.point.distance(intersection, data.handles.start);
            d2 = cornerstoneMath.point.distance(intersection, data.handles.end);

            if (!intersection || d1 < 3 || d2 < 3) {
                outOfBounds = true;
            }
        }

        movedPoint = false;

        if (!outOfBounds) {
            movedPoint = perpendicularLeftFixedPoint(eventData, data);

            if (!movedPoint) {
                eventData.currentPoints.image.x = data.handles.perpendicularStart.x;
                eventData.currentPoints.image.y = data.handles.perpendicularStart.y;
            }
        }

    } else if (handle.index === 3) {
        outOfBounds = false;

        // if perpendicular end point is moved
        longLine.start = {
            x: data.handles.start.x,
            y: data.handles.start.y
        };
        longLine.end = {
            x: data.handles.end.x,
            y: data.handles.end.y
        };

        perpendicularLine.start = {
            x: data.handles.perpendicularStart.x,
            y: data.handles.perpendicularStart.y
        };
        perpendicularLine.end = {
            x: eventData.currentPoints.image.x,
            y: eventData.currentPoints.image.y
        };

        intersection = cornerstoneMath.lineSegment.intersectLine(longLine, perpendicularLine);
        if (!intersection) {
            perpendicularLine.end = {
                x: data.handles.perpendicularEnd.x,
                y: data.handles.perpendicularEnd.y
            };

            intersection = cornerstoneMath.lineSegment.intersectLine(longLine, perpendicularLine);

            d1 = cornerstoneMath.point.distance(intersection, data.handles.start);
            d2 = cornerstoneMath.point.distance(intersection, data.handles.end);

            if (!intersection || d1 < 3 || d2 < 3) {
                outOfBounds = true;
            }
        }

        movedPoint = false;

        if (!outOfBounds) {
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

// Clear the selected state for the given handles object
function unselectAllHandles(handles) {
    let imageNeedsUpdate = false;
    Object.keys(handles).forEach(handleKey => {
        if (handleKey === 'textBox') return;
        handles[handleKey].selected = false;
        imageNeedsUpdate = handles[handleKey].active || imageNeedsUpdate;
        handles[handleKey].active = false;
    });
    return imageNeedsUpdate;
}

// Clear the bidirectional tool's selection for all tool handles
function clearBidirectionalSelection(event) {
    let imageNeedsUpdate = false;
    const toolData = cornerstoneTools.getToolState(event.currentTarget, 'bidirectional');
    if (!toolData) return;
    toolData.data.forEach(data => {
        const unselectResult = unselectAllHandles(data.handles);
        imageNeedsUpdate = imageNeedsUpdate || unselectResult;
    });
    return imageNeedsUpdate;
}

// Replaces the cornerstoneTools.handleActivator function by skiping the active handle comparison
function handleActivator(element, handles, canvasPoint, distanceThreshold=6) {
    const nearbyHandle = cornerstoneTools.getHandleNearImagePoint(element, handles, canvasPoint, distanceThreshold);

    let handleActivatorChanged = false;
    Object.keys(handles).forEach(handleKey => {
        if (handleKey === 'textBox') return;
        const handle = handles[handleKey];
        const newActiveState = handle === nearbyHandle;
        if (handle.active !== newActiveState) {
            handleActivatorChanged = true;
        }

        handle.active = newActiveState;
    });

    return handleActivatorChanged;
}

// Draw a line marker over the selected arm
function drawSelectedMarker(eventData, handles, color) {
    const lib = OHIF.lesiontracker.bidirectional;
    const { canvasContext, element, enabledElement } = eventData;

    const handleKey = lib.getSelectedHandleKey(handles);
    if (!handleKey) return;
    const handle = handles[handleKey];

    // Used a big distance (1km) to fill the entire line
    const mmStep = -1000000;

    // Get the line's start and end points
    const fakeImage = {
        columnPixelSpacing: eventData.viewport.scale,
        rowPixelSpacing: eventData.viewport.scale
    };
    const pointA = lib.repositionBidirectionalArmHandle(fakeImage, handles, handleKey, mmStep, 0);
    const pointB = _.pick(handle, ['x', 'y']);

    // Stop here if pointA is not present
    if (!pointA) return;

    // Get the canvas coordinates for the line    var perpendicularStartCanvas = cornerstone.pixelToCanvas(element, data.handles.perpendicularStart);
    const canvasPointA = cornerstone.pixelToCanvas(element, pointA);
    const canvasPointB = cornerstone.pixelToCanvas(element, pointB);

    // Draw the line marker
    canvasContext.beginPath();
    canvasContext.strokeStyle = color;
    canvasContext.lineWidth = cornerstoneTools.toolStyle.getToolWidth();
    canvasContext.moveTo(canvasPointA.x, canvasPointA.y);
    canvasContext.lineTo(canvasPointB.x, canvasPointB.y);
    canvasContext.stroke();
}

// Add a proxy to cornerstoneTools.drawHandles function to change the handles' active state base on
// the hover, moving and selected states
function drawHandles(context, eventData, handles, color, options) {
    Object.keys(handles).forEach(handleKey => {
        if (handleKey === 'textBox') return;
        const handle = handles[handleKey];
        handle.drawnIndependently = handle.moving;
        if (handle.selected) {
            handle.active = handle.hover;
        } else {
            if (handle.hover) {
                handle.active = true;
            } else {
                handle.active = false;
            }
        }
    });
    cornerstoneTools.drawHandles(context, eventData, handles, color, options);
}

function moveHandle(mouseEventData, toolType, data, handle, doneMovingCallback, preventHandleOutsideImage) {
    const element = mouseEventData.element;
    const $element = $(element);
    const distanceFromTool = {
        x: handle.x - mouseEventData.currentPoints.image.x,
        y: handle.y - mouseEventData.currentPoints.image.y
    };

    const mouseDragCallback = (event, eventData) => {
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
        $element.trigger(eventType, modifiedEventData);
    };

    $element.on('CornerstoneToolsMouseDrag', mouseDragCallback);

    const currentImage = cornerstone.getImage(element);
    const imageRenderedHandler = () => {
        const newImage = cornerstone.getImage(element);

        // Check if the rendered image changed during measurement modifying and stop it if so
        if (newImage.imageId !== currentImage.imageId) {
            mouseUpCallback();
        }
    };

    // Bind the event listener for image rendering
    $element.on('CornerstoneImageRendered', imageRenderedHandler);

    const mouseUpCallback = () => {
        $element.off('CornerstoneToolsMouseDrag', mouseDragCallback);
        $element.off('CornerstoneToolsMouseUp', mouseUpCallback);
        $element.off('CornerstoneToolsMouseClick', mouseUpCallback);
        $element.off('CornerstoneImageRendered', imageRenderedHandler);
        cornerstone.updateImage(element);

        if (typeof doneMovingCallback === 'function') {
            doneMovingCallback();
        }
    };

    $element.on('CornerstoneToolsMouseUp', mouseUpCallback);
    $element.on('CornerstoneToolsMouseClick', mouseUpCallback);
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
        const handleActivatorChanged = handleActivator(eventData.element, data.handles, coords);
        Object.keys(data.handles).forEach(handleKey => {
            if (handleKey === 'textBox') return;
            const handle = data.handles[handleKey];
            handle.hover = handle.active;
        });
        if (handleActivatorChanged) {
            imageNeedsUpdate = true;
        }

        if ((pointNearTool(eventData.element, data, coords) && !data.active) || (!pointNearTool(eventData.element, data, coords) && data.active)) {
            data.active = !data.active;
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
    let data;
    const element = eventData.element;
    const $element = $(element);

    // Add an event listener to clear the selected state when a measurement is activated
    const activateEventKey = 'ViewerMeasurementsActivated';
    $element.off(activateEventKey).on(activateEventKey, () => clearBidirectionalSelection(e));

    // Clear selection on left mouse button click
    let imageNeedsUpdate = false;
    if (eventData.which === 1) {
        const imageNeedsUpdate = clearBidirectionalSelection(e);
        if (imageNeedsUpdate) {
            cornerstone.updateImage(element);
        }
    }

    function handleDoneMove(handle) {
        // Set the cursor back to its default
        $element.css('cursor', '');

        data.invalidated = true;
        if (cornerstoneTools.anyHandlesOutsideImage(eventData, data.handles)) {
            // delete the measurement
            cornerstoneTools.removeToolState(element, toolType, data);
        }

        // Update the handles to keep selected state
        if (handle) {
            handle.moving = false;
            handle.selected = true;
        }

        cornerstone.updateImage(element);
        $element.on('CornerstoneToolsMouseMove', eventData, mouseMoveCallback);
    }

    if (cornerstoneTools.isMouseButtonEnabled(eventData.which, e.data.mouseButtonMask)) {
        var coords = eventData.startPoints.canvas;
        var toolData = cornerstoneTools.getToolState(e.currentTarget, toolType);

        var i;

        // now check to see if there is a handle we can move
        if (toolData) {
            for (i = 0; i < toolData.data.length; i++) {
                data = toolData.data[i];
                var distance = 6;
                var handle = cornerstoneTools.getHandleNearImagePoint(element, data.handles, coords, distance);
                if (handle) {
                    // Hide the cursor to improve precision while resizing the line or set to move if dragging text box
                    $element.css('cursor', handle.hasBoundingBox ? 'move' : 'none');

                    $element.off('CornerstoneToolsMouseMove', mouseMoveCallback);
                    data.active = true;

                    unselectAllHandles(data.handles);
                    handle.moving = true;
                    moveHandle(eventData, toolType, data, handle, () => handleDoneMove(handle));
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
                    // Set the cursor to move
                    $element.css('cursor', 'move');

                    $element.off('CornerstoneToolsMouseMove', mouseMoveCallback);
                    data.active = true;

                    unselectAllHandles(data.handles);
                    Object.keys(data.handles).forEach(handleKey => {
                        if (handleKey === 'textBox') return;
                        data.handles[handleKey].moving = true;
                    });

                    cornerstoneTools.moveAllHandles(e, data, toolData, toolType, options, () => {
                        Object.keys(data.handles).forEach(handleKey => {
                            if (handleKey === 'textBox') return;
                            data.handles[handleKey].moving = false;
                        });
                        handleDoneMove();
                    });
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

function updatePerpendicularLineHandles(eventData, data) {
    if (!data.handles.perpendicularStart.locked) return;

    var startX;
    var startY;
    var endX;
    var endY;

    if (data.handles.start.x === data.handles.end.x &&
        data.handles.start.y === data.handles.end.y) {
        startX = data.handles.start.x;
        startY = data.handles.start.y;
        endX = data.handles.end.x;
        endY = data.handles.end.y;
    } else {
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

        startX = mid.x + (perpendicularLineLength / 2) * vectorY;
        startY = mid.y - (perpendicularLineLength / 2) * vectorX;
        endX = mid.x - (perpendicularLineLength / 2) * vectorY;
        endY = mid.y + (perpendicularLineLength / 2) * vectorX;
    }

    data.handles.perpendicularStart.x = startX;
    data.handles.perpendicularStart.y = startY;
    data.handles.perpendicularEnd.x = endX;
    data.handles.perpendicularEnd.y = endY;
};

// draw perpendicular line
function drawPerpendicularLine(context, element, data, color, lineWidth) {
    // Draw perpendicular line
    var perpendicularStartCanvas = cornerstone.pixelToCanvas(element, data.handles.perpendicularStart);
    var perpendicularEndCanvas = cornerstone.pixelToCanvas(element, data.handles.perpendicularEnd);

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
    var distanceToStart = cornerstoneMath.point.distance(data.handles.start, data.handles.textBox);
    distancesArr.push({
        distance: distanceToStart,
        point: data.handles.start
    });
    minDistance = distanceToStart;

    var distanceToEnd = cornerstoneMath.point.distance(data.handles.end, data.handles.textBox);
    distancesArr.push({
        distance: distanceToEnd,
        point: data.handles.end
    });

    minDistance = Math.min(distanceToEnd, minDistance);

    if (data.handles.perpendicularStart.x && data.handles.perpendicularStart.y) {
        var distanceToPerpendicularStart = cornerstoneMath.point.distance(data.handles.perpendicularStart, data.handles.textBox);
        distancesArr.push({
            distance: distanceToPerpendicularStart,
            point: data.handles.perpendicularStart
        });

        minDistance = Math.min(distanceToPerpendicularStart, minDistance);

    }

    if (data.handles.perpendicularEnd.x && data.handles.perpendicularEnd.y) {
        var distanceToPerpendicularEnd = cornerstoneMath.point.distance(data.handles.perpendicularEnd, data.handles.textBox);
        distancesArr.push({
            distance: distanceToPerpendicularEnd,
            point: data.handles.perpendicularEnd
        });

        minDistance = Math.min(distanceToPerpendicularEnd, minDistance);
    }

    for (var i = 0; i < distancesArr.length; i++) {
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

    // LT-29 Disable Target Measurements when pixel spacing is not available
    if (!eventData.image.rowPixelSpacing || !eventData.image.columnPixelSpacing) {
        return;
    }

    // we have tool data for this element - iterate over each one and draw it
    var context = eventData.canvasContext.canvas.getContext('2d');
    context.setTransform(1, 0, 0, 1, 0, 0);

    var color;
    var element = eventData.element;
    var lineWidth = cornerstoneTools.toolStyle.getToolWidth();
    var config = cornerstoneTools.bidirectional.getConfiguration();

    for (var i = 0; i < toolData.data.length; i++) {
        var data = toolData.data[i];
        var strokeWidth = lineWidth;

        context.save();

        // configurable shadow from CornerstoneTools
        if (config && config.shadow) {
            context.shadowColor = config.shadowColor || '#000000';
            context.shadowOffsetX = config.shadowOffsetX || 1;
            context.shadowOffsetY = config.shadowOffsetY || 1;
        }

        const activeColor = cornerstoneTools.toolColors.getActiveColor();
        if (data.active) {
            color = activeColor;
        } else {
            color = cornerstoneTools.toolColors.getToolColor();
        }

        // draw the line
        var handleStartCanvas = cornerstone.pixelToCanvas(element, data.handles.start);
        var handleEndCanvas = cornerstone.pixelToCanvas(element, data.handles.end);
        var canvasTextLocation = cornerstone.pixelToCanvas(element, data.handles.textBox);

        context.beginPath();
        context.strokeStyle = color;
        context.lineWidth = strokeWidth;
        context.moveTo(handleStartCanvas.x, handleStartCanvas.y);
        context.lineTo(handleEndCanvas.x, handleEndCanvas.y);
        context.stroke();

        // Draw perpendicular line
        updatePerpendicularLineHandles(eventData, data);
        drawPerpendicularLine(context, element, data, color, strokeWidth);

        // Draw the handles
        const handlesColor = color;
        drawHandles(context, eventData, data.handles, handlesColor, { drawHandlesIfActive: true });

        // Draw the selected marker
        drawSelectedMarker(eventData, data.handles, '#FF9999');

        // Calculate the long axis length
        var dx = (data.handles.start.x - data.handles.end.x) * (eventData.image.columnPixelSpacing || 1);
        var dy = (data.handles.start.y - data.handles.end.y) * (eventData.image.rowPixelSpacing || 1);
        var length = Math.sqrt(dx * dx + dy * dy);

        // Calculate the short axis length
        var wx = (data.handles.perpendicularStart.x - data.handles.perpendicularEnd.x) * (eventData.image.columnPixelSpacing || 1);
        var wy = (data.handles.perpendicularStart.y - data.handles.perpendicularEnd.y) * (eventData.image.rowPixelSpacing || 1);
        var width = Math.sqrt(wx * wx + wy * wy);
        if (!width) {
            width = 0;
        }

        // Length is always longer than width
        if (width > length) {
            var tempW = width;
            var tempL = length;
            length = tempW;
            width = tempL;
        }

        if (data.measurementNumber) {
            // Draw the textbox
            var suffix = ' mm';
            if (!eventData.image.rowPixelSpacing || !eventData.image.columnPixelSpacing) {
                suffix = ' pixels';
            }

            var lengthText = ' L ' + length.toFixed(1) + suffix;
            var widthText = ' W ' + width.toFixed(1) + suffix;
            var textLines = [`Target ${data.measurementNumber}`, lengthText, widthText];

            var boundingBox = cornerstoneTools.drawTextBox(context,
                textLines,
                canvasTextLocation.x, canvasTextLocation.y, color, config.textBox);

            data.handles.textBox.boundingBox = boundingBox;

            OHIF.cornerstone.repositionTextBox(eventData, data, config.textBox);

            // Draw linked line as dashed
            var link = {
                start: {},
                end: {}
            };

            var midpointCanvas = {
                x: (handleStartCanvas.x + handleEndCanvas.x) / 2,
                y: (handleStartCanvas.y + handleEndCanvas.y) / 2,
            };

            var points = [ handleStartCanvas, handleEndCanvas, midpointCanvas ];

            link.end.x = canvasTextLocation.x;
            link.end.y = canvasTextLocation.y;

            link.start = cornerstoneMath.point.findClosestPoint(points, link.end);

            var boundingBoxPoints = [ {
                    // Top middle point of bounding box
                    x: boundingBox.left + boundingBox.width / 2,
                    y: boundingBox.top
                }, {
                    // Left middle point of bounding box
                    x: boundingBox.left,
                    y: boundingBox.top + boundingBox.height / 2
                }, {
                    // Bottom middle point of bounding box
                    x: boundingBox.left + boundingBox.width / 2,
                    y: boundingBox.top + boundingBox.height
                }, {
                    // Right middle point of bounding box
                    x: boundingBox.left + boundingBox.width,
                    y: boundingBox.top + boundingBox.height / 2
                },
            ];

            link.end = cornerstoneMath.point.findClosestPoint(boundingBoxPoints, link.start);
            context.beginPath();
            context.strokeStyle = color;
            context.lineWidth = lineWidth;
            context.setLineDash([ 2, 3 ]);

            context.moveTo(link.start.x, link.start.y);
            context.lineTo(link.end.x, link.end.y);
            context.stroke();
        }

        // Set measurement text to show lesion table
        data.longestDiameter = length.toFixed(1);
        data.shortestDiameter = width.toFixed(1);

        context.restore();
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
        }
    }

    if (e.data && e.data.mouseButtonMask && !cornerstoneTools.isMouseButtonEnabled(eventData.which, e.data.mouseButtonMask)) {
        return false;
    }

    var config = cornerstoneTools.bidirectional.getConfiguration();

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
            config.changeMeasurementLocationCallback(data, eventData, doneCallback);

            e.stopImmediatePropagation();
            return false;
        }
    }
}

// module exports
cornerstoneTools.bidirectional = cornerstoneTools.mouseButtonTool({
    createNewMeasurement: createNewMeasurement,
    addNewMeasurement: addNewMeasurement,
    onImageRendered: onImageRendered,
    pointNearTool: pointNearTool,
    mouseDoubleClickCallback: doubleClickCallback,
    mouseDownCallback: mouseDownCallback,
    mouseMoveCallback: mouseMoveCallback,
    toolType: toolType
});

cornerstoneTools.bidirectionalTouch = cornerstoneTools.touchTool({
    createNewMeasurement: createNewMeasurement,
    addNewMeasurement: addNewMeasurementTouch,
    onImageRendered: onImageRendered,
    pointNearTool: pointNearTool,
    toolType: toolType
});

cornerstoneTools.bidirectional.setConfiguration(configuration);
