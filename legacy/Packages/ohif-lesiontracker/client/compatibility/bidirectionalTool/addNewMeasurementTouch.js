import { cornerstone, cornerstoneTools } from 'meteor/ohif:cornerstone';
import { toolType } from './definitions';
import createNewMeasurement from './createNewMeasurement';
import updatePerpendicularLineHandles from './updatePerpendicularLineHandles';

export default function(touchEventData) {
    const element = { touchEventData };

    // LT-29 Disable Target Measurements when pixel spacing is not available
    if (!touchEventData.image.rowPixelSpacing || !touchEventData.image.columnPixelSpacing) return;

    const doneCallback = () => {
        measurementData.active = false;
        cornerstone.updateImage(element);
    };

    const measurementData = createNewMeasurement(touchEventData);
    const { cancelled, handles } = measurementData;
    const config = cornerstoneTools[toolType].getConfiguration();

    // associate this data with this imageId so we can render it and manipulate it
    cornerstoneTools.addToolState(element, toolType, measurementData);

    // since we are dragging to another place to drop the end point, we can just activate
    // the end point and let the moveHandle move it for us.
    const { touchMoveHandle, tapCallback, touchDownActivateCallback } = cornerstoneTools[toolType];
    element.removeEventListener('cornerstonetoolstouchdrag', touchMoveHandle);
    element.removeEventListener('cornerstonetoolstap', tapCallback);
    element.removeEventListener('cornerstonetoolsdragstartactive', touchDownActivateCallback);

    // Update the perpendicular line handles position
    const updateHandler = event => updatePerpendicularLineHandles(event.detail, measurementData);
    element.addEventListener('cornerstonetoolstouchdrag', updateHandler);
    element.addEventListener('cornerstonetoolstouchend', updateHandler);

    cornerstone.updateImage(element);
    const { end, perpendicularStart } = handles;
    cornerstoneTools.moveNewHandleTouch(touchEventData, toolType, measurementData, end, () => {
        if (cancelled || cornerstoneTools.anyHandlesOutsideImage(touchEventData, handles)) {
            // delete the measurement
            cornerstoneTools.removeToolState(element, toolType, measurementData);
        } else {
            // Set lesionMeasurementData Session
            config.getMeasurementLocationCallback(measurementData, touchEventData, doneCallback);
        }

        // perpendicular line is not connected to long-line
        perpendicularStart.locked = false;

        // Unbind the handlers to update perpendicular line
        element.removeEventListener('cornerstonetoolstouchdrag', updateHandler);
        element.removeEventListener('cornerstonetoolstouchend', updateHandler);

        element.addEventListener('cornerstonetoolstouchdrag', touchMoveHandle);
        element.addEventListener('cornerstonetoolstap', tapCallback);
        element.addEventListener('cornerstonetoolsdragstartactive', touchDownActivateCallback);
        cornerstone.updateImage(element);
    });
}
