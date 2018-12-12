/* jshint -W083 */

import { cornerstone, cornerstoneTools } from 'meteor/ohif:cornerstone';
import { toolType, distanceThreshold } from './definitions';
import mouseMoveCallback from './mouseMoveCallback';
import pointNearTool from './pointNearTool';
import moveHandle from './moveHandle';
import invertHandles from './invertHandles';

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
    const toolData = cornerstoneTools.getToolState(event.target, 'bidirectional');
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

// mouseDownCallback is used to restrict behaviour of perpendicular-line
export default function(event) {
    const eventData = event.detail;
    let data;
    const element = eventData.element;
    const $element = $(element);
    const options = cornerstoneTools.getToolOptions(toolType, element);

    if (!cornerstoneTools.isMouseButtonEnabled(eventData.which, options.mouseButtonMask)) return;

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
        element.addEventListener('cornerstonetoolsmousemove', mouseMoveCallback);
    }

    const coords = eventData.startPoints.canvas;
    const toolData = cornerstoneTools.getToolState(event.currentTarget, toolType);

    if (!toolData) return;

    // now check to see if there is a handle we can move
    for (let i = 0; i < toolData.data.length; i++) {
        data = toolData.data[i];
        const handleParams = [element, data.handles, coords, distanceThreshold];
        let handle = cornerstoneTools.getHandleNearImagePoint(...handleParams);

        if (handle) {
            handle.moving = true;

            // Invert handles if needed
            handle = invertHandles(eventData, data, handle);

            // Hide the cursor to improve precision while resizing the line or set to move
            // if dragging text box
            $element.css('cursor', handle.hasBoundingBox ? 'move' : 'none');

            element.removeEventListener('cornerstonetoolsmousemove', mouseMoveCallback);
            data.active = true;

            unselectAllHandles(data.handles);
            moveHandle(eventData, toolType, data, handle, () => handleDoneMove(handle));
            event.stopImmediatePropagation();
            event.stopPropagation();
            event.preventDefault();

            return;
        }
    }

    // Now check to see if there is a line we can move
    // Now check to see if we have a tool that we can move
    const opt = {
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

            element.removeEventListener('cornerstonetoolsmousemove', mouseMoveCallback);
            data.active = true;

            unselectAllHandles(data.handles);
            setHandlesMovingState(data.handles, true);

            const doneMovingCallback = getDoneMovingCallback(data.handles);
            const allHandlesParams = [event, data, toolData, toolType, opt, doneMovingCallback];
            cornerstoneTools.moveAllHandles(...allHandlesParams);
            event.stopImmediatePropagation();
            event.stopPropagation();
            event.preventDefault();

            return;
        }
    }
}
