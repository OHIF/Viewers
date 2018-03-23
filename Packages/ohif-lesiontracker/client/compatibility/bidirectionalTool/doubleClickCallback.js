import { cornerstone, cornerstoneTools } from 'meteor/ohif:cornerstone';
import { toolType } from './definitions';
import pointNearTool from './pointNearTool';

export default function (event) {
    const eventData = event.detail;
    const { element } = eventData.element;

    function doneCallback(data, deleteTool) {
        if (deleteTool === true) {
            cornerstoneTools.removeToolState(element, toolType, data);
            cornerstone.updateImage(element);
        }
    }

    const buttonMask = event.data && event.data.mouseButtonMask;
    if (buttonMask && !cornerstoneTools.isMouseButtonEnabled(eventData.which, buttonMask)) {
        return false;
    }

    // Check if the element is enabled and stop here if not
    try {
        cornerstone.getEnabledElement(element);
    } catch (error) {
        return;
    }

    const config = cornerstoneTools.bidirectional.getConfiguration();

    const coords = eventData.currentPoints.canvas;
    const toolData = cornerstoneTools.getToolState(element, toolType);

    // now check to see if there is a handle we can move
    if (!toolData) return;

    let data;
    for (let i = 0; i < toolData.data.length; i++) {
        data = toolData.data[i];
        if (pointNearTool(element, data, coords)) {
            data.active = true;
            cornerstone.updateImage(element);
            // Allow relabelling via a callback
            config.changeMeasurementLocationCallback(data, eventData, doneCallback);

            event.stopImmediatePropagation();
            return false;
        }
    }
}
