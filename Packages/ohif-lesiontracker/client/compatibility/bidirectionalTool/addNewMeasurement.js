import { cornerstone, cornerstoneTools, cornerstoneMath } from 'meteor/ohif:cornerstone';
import { toolType } from './definitions';
import createNewMeasurement from './createNewMeasurement';
import mouseMoveCallback from './mouseMoveCallback';
import mouseDownCallback from './mouseDownCallback';
import doubleClickCallback from './doubleClickCallback';
import updatePerpendicularLineHandles from './updatePerpendicularLineHandles';

export default function(mouseEventData) {
    const { element } = mouseEventData;
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

    const eventData = { mouseButtonMask: mouseEventData.which };

    const tool = cornerstoneTools[toolType];
    const config = tool.getConfiguration();
    const { mouseDownActivateCallback } = tool;

    // associate this data with this imageId so we can render it and manipulate it
    cornerstoneTools.addToolState(element, toolType, measurementData);

    const disableDefaultHandlers = () => {
        // since we are dragging to another place to drop the end point, we can just activate
        // the end point and let the moveHandle move it for us.
        $element.off('CornerstoneToolsMouseMove', mouseMoveCallback);
        $element.off('CornerstoneToolsMouseDown', mouseDownCallback);
        $element.off('CornerstoneToolsMouseDownActivate', mouseDownActivateCallback);
        $element.off('CornerstoneToolsMouseDoubleClick', doubleClickCallback);
    };

    disableDefaultHandlers();

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
        if (event.which === 27) {
            cancelAction();
        }

        // Don't propagate this keydown event so it can't interfere
        // with anything outside of this tool
        return false;
    };

    // Bind a one-time event listener for the Esc key
    $element.one('keydown', keyDownHandler);

    // Bind a mousedown handler to cancel the measurement if it's zero-sized
    const mousedownHandler = () => {
        const { start, end } = measurementData.handles;
        if (!cornerstoneMath.point.distance(start, end)) {
            cancelAction();
        }
    };

    // Bind a one-time event listener for mouse down
    $element.one('mousedown', mousedownHandler);

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
    const { end, perpendicularStart } = measurementData.handles;
    cornerstoneTools.moveNewHandle(mouseEventData, toolType, measurementData, end, () => {
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

        // Unbind the mouse down hook
        $element.off('mousedown', mousedownHandler);

        // Unbind the event listener for image rendering
        $element.off('CornerstoneImageRendered', imageRenderedHandler);

        // Unbind the tool deactivation and enlargement handlers
        $element.off('CornerstoneToolsToolDeactivated', cancelAction);
        $element.off('ohif.viewer.viewport.toggleEnlargement', cancelAction);

        // perpendicular line is not connected to long-line
        perpendicularStart.locked = false;

        // Unbind the handlers to update perpendicular line
        $element.off('CornerstoneToolsMouseDrag', updateHandler);
        $element.off('CornerstoneToolsMouseUp', updateHandler);

        // Disable the default handlers and re-enable again
        disableDefaultHandlers();
        $element.on('CornerstoneToolsMouseMove', eventData, mouseMoveCallback);
        $element.on('CornerstoneToolsMouseDown', eventData, mouseDownCallback);
        $element.on('CornerstoneToolsMouseDownActivate', eventData, mouseDownActivateCallback);
        $element.on('CornerstoneToolsMouseDoubleClick', eventData, doubleClickCallback);

        cornerstone.updateImage(element);
    });
}
