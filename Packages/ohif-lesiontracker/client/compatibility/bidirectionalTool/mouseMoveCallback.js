/* jshint -W083 */

import { cornerstone, cornerstoneTools } from 'meteor/ohif:cornerstone';
import { toolType } from './definitions';
import pointNearTool from './pointNearTool';

// Replaces the cornerstoneTools.handleActivator function by skiping the active handle comparison
const handleActivator = (element, handles, canvasPoint, distanceThreshold=6) => {
    const getHandle = cornerstoneTools.getHandleNearImagePoint;
    const nearbyHandle = getHandle(element, handles, canvasPoint, distanceThreshold);

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
};

// mouseMoveCallback is used to hide handles when mouse is away
export default function (event) {
    const eventData = event.detail;
    const { element } = eventData;
    cornerstoneTools.toolCoordinates.setCoords(eventData);

    // if we have no tool data for this element, do nothing
    const toolData = cornerstoneTools.getToolState(element, toolType);
    if (!toolData) return;

    // We have tool data, search through all data and see if we can activate a handle
    let imageNeedsUpdate = false;
    for (let i = 0; i < toolData.data.length; i++) {
        // get the cursor position in canvas coordinates
        const coords = eventData.currentPoints.canvas;

        const data = toolData.data[i];
        const handleActivatorChanged = handleActivator(element, data.handles, coords);
        Object.keys(data.handles).forEach(handleKey => {
            if (handleKey === 'textBox') return;
            const handle = data.handles[handleKey];
            handle.hover = handle.active;
        });

        if (handleActivatorChanged) {
            imageNeedsUpdate = true;
        }

        const nearToolAndInactive = pointNearTool(element, data, coords) && !data.active;
        const notNearToolAndActive = !pointNearTool(element, data, coords) && data.active;
        if (nearToolAndInactive || notNearToolAndActive) {
            data.active = !data.active;
            imageNeedsUpdate = true;
        }
    }

    // Handle activation status changed, redraw the image
    if (imageNeedsUpdate === true) {
        cornerstone.updateImage(element);
    }
}
