import { OHIF } from 'meteor/ohif:core';
import { cornerstone, cornerstoneTools } from 'meteor/ohif:cornerstone';

// Delete a lesion if Ctrl+D or DELETE is pressed while a lesion is selected
const keys = {
    D: 68,
    DELETE: 46
};

// Defined the toolTypes for which the delete dialog will be displayed when the keys are pressed
const toolTypes = [
    'bidirectional',
    'targetCR',
    'targetUN',
    'nonTarget',
    'length',
    'ellipticalRoi',
    'rectangleRoi'
];

// Flag to prevent dialog from being displayed twice
let locked = false;

// Handler to unlock the keydown handling
const unlock = () => {
    locked = false;
};

function removeMeasurementTimepoint(data, index, toolType, element) {
    let { imageId } = data;
    if (!imageId) {
        const enabledElement = cornerstone.getEnabledElement(element);
        imageId = enabledElement.image.imageId;
    }

    cornerstoneTools.removeToolState(element, toolType, data);
    cornerstone.updateImage(element);
}

function keyDownCallback(event) {
    const eventData = event.detail;
    const keyCode = eventData.which;

    // Stop here if the locked flag is set to true
    if (locked) return;

    if (keyCode === keys.DELETE ||
        (keyCode === keys.D && eventData.event.ctrlKey === true)) {

        const nearbyToolData = OHIF.viewerbase.toolManager.getNearbyToolData(eventData.element, eventData.currentPoints.canvas, toolTypes);

        if (!nearbyToolData || nearbyToolData.tool.isCreating) return;

        const dialogSettings = {
            class: 'themed',
            title: 'Delete measurements',
            message: 'Are you sure you want to delete this measurement?',
            position: eventData.currentPoints.page
        };

        // Set the locked flag to true
        locked = true;

        // TODO= Refactor this so the confirmation dialog is an
        // optional settable callback in the tool's configuration
        OHIF.ui.showDialog('dialogConfirm', dialogSettings).then(() => {
            unlock();
            removeMeasurementTimepoint(nearbyToolData.tool,
                nearbyToolData.index,
                nearbyToolData.toolType,
                eventData.element
            );

            // Notify that viewer suffered changes
            OHIF.measurements.triggerTimepointUnsavedChanges('deleted');
        }).catch(unlock);
    }
}

// module/private exports
const tool = cornerstoneTools.keyboardTool(keyDownCallback);
tool.toolTypes = toolTypes;
cornerstoneTools.deleteLesionKeyboardTool = tool;
