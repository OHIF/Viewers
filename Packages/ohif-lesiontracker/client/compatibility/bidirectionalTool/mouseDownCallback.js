/* jshint -W083 */

import { cornerstone, cornerstoneTools } from 'meteor/ohif:cornerstone';
import { toolType, distanceThreshold } from './definitions';
import mouseMoveCallback from './mouseMoveCallback';
import pointNearTool from './pointNearTool';
import moveHandle from './moveHandle';

// Clear the selected state for the given handles object
const unselectAllHandles = handles => {
    let imageNeedsUpdate = false;
    Object.keys(handles).forEach(handleKey => {
        if (handleKey === 'textBox') return;
        handles[handleKey].selected = false;
        imageNeedsUpdate = handles[handleKey].active || imageNeedsUpdate;
        handles[handleKey].active = false;
    });
    return imageNeedsUpdate;
};

// Clear the bidirectional tool's selection for all tool handles
const clearBidirectionalSelection = event => {
    let imageNeedsUpdate = false;
    const toolData = cornerstoneTools.getToolState(event.currentTarget, 'bidirectional');
    if (!toolData) return;
    toolData.data.forEach(data => {
        const unselectResult = unselectAllHandles(data.handles);
        imageNeedsUpdate = imageNeedsUpdate || unselectResult;
    });
    return imageNeedsUpdate;
};

const setHandlesMovingState = (handles, state) => {
    Object.keys(handles).forEach(handleKey => {
        if (handleKey === 'textBox') return;
        handles[handleKey].moving = state;
    });
};

// mouseDowCallback is used to restrict behaviour of perpendicular-line
export default function(event, eventData) {
    let data;
    const element = eventData.element;
    const $element = $(element);

    // Add an event listener to clear the selected state when a measurement is activated
    const activateEventKey = 'ViewerMeasurementsActivated';
    $element.off(activateEventKey).on(activateEventKey, () => clearBidirectionalSelection(event));

    // Clear selection on left mouse button click
    if (eventData.which === 1) {
        const imageNeedsUpdate = clearBidirectionalSelection(event);
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

    if (cornerstoneTools.isMouseButtonEnabled(eventData.which, event.data.mouseButtonMask)) {
        const coords = eventData.startPoints.canvas;
        const toolData = cornerstoneTools.getToolState(event.currentTarget, toolType);

        // now check to see if there is a handle we can move
        if (toolData) {
            for (let i = 0; i < toolData.data.length; i++) {
                data = toolData.data[i];
                const handle = cornerstoneTools.getHandleNearImagePoint(
                    element,
                    data.handles,
                    coords,
                    distanceThreshold
                );

                if (handle) {
                    // Hide the cursor to improve precision while resizing the line or set to move
                    // if dragging text box
                    $element.css('cursor', handle.hasBoundingBox ? 'move' : 'none');

                    $element.off('CornerstoneToolsMouseMove', mouseMoveCallback);
                    data.active = true;

                    unselectAllHandles(data.handles);
                    handle.moving = true;
                    moveHandle(eventData, toolType, data, handle, () => handleDoneMove(handle));
                    event.stopImmediatePropagation();
                    return false;
                }
            }
        }

        // Now check to see if there is a line we can move
        // Now check to see if we have a tool that we can move
        if (toolData) {
            const options = {
                deleteIfHandleOutsideImage: true,
                preventHandleOutsideImage: false
            };

            const getDoneMovingCallback = handles => () => {
                setHandlesMovingState(handles, false);
                handleDoneMove();
            };

            for (let i = 0; i < toolData.data.length; i++) {
                data = toolData.data[i];
                if (pointNearTool(element, data, coords)) {
                    // Set the cursor to move
                    $element.css('cursor', 'move');

                    $element.off('CornerstoneToolsMouseMove', mouseMoveCallback);
                    data.active = true;

                    unselectAllHandles(data.handles);
                    setHandlesMovingState(data.handles, true);

                    const doneMovingCallback = getDoneMovingCallback(data.handles);
                    cornerstoneTools.moveAllHandles(event, data, toolData, toolType, options, doneMovingCallback);
                    event.stopImmediatePropagation();
                    return false;
                }
            }
        }
    }
}
