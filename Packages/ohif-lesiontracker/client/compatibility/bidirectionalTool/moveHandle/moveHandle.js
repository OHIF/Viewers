import { cornerstone } from 'meteor/ohif:cornerstone';
import setHandlesPosition from './setHandlesPosition';

export default function (mouseEventData, toolType, data, handle, doneMovingCallback, preventHandleOutsideImage) {
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

        const eventType = 'CornerstoneToolsMeasurementModified';
        const modifiedEventData = {
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
