import { Viewerbase } from 'meteor/ohif:viewerbase';

(function(cornerstoneTools) {

    'use strict';

    // Delete a lesion if Ctrl+D or DELETE is pressed while a lesion is selected
    var keys = {
        D: 68,
        DELETE: 46
    };

    function removeMeasurementTimepoint(data, index, toolType, element) {
        var imageId = data.imageId;
        if (!imageId) {
            var enabledElement = cornerstone.getEnabledElement(element);
            imageId = enabledElement.image.imageId;
        }

        cornerstoneTools.removeToolState(element, toolType, data);
        cornerstone.updateImage(element);
    }

    // TODO = Check if we have the same function already in Cornerstone Tools
    function getNearbyToolData(element, coords, toolTypes) {
        var allTools = Viewerbase.toolManager.getTools();
        var pointNearTool = false;
        var touchDevice = Viewerbase.helpers.isTouchDevice();
        var nearbyTool = {},
            nearbyToolIndex,
            nearbyToolType;

        toolTypes.forEach(function(toolType) {
            var toolData = cornerstoneTools.getToolState(element, toolType);
            if (!toolData) {
                return;
            }

            for (var i = 0; i < toolData.data.length; i++) {
                var data = toolData.data[i];

                var toolInterface;
                if (touchDevice) {
                    toolInterface = allTools[toolType].touch;
                } else {
                    toolInterface = allTools[toolType].mouse;
                }

                if (toolInterface.pointNearTool(element, data, coords)) {
                    pointNearTool = true;
                    nearbyTool.tool = data;
                    nearbyTool.index = i;
                    nearbyTool.toolType = toolType;
                    break;
                }
            }

            if (pointNearTool === true) {
                return false;
            }
        });

        return pointNearTool ? nearbyTool : undefined;
    }

    function keyDownCallback(e, eventData) {
        var keyCode = eventData.which;

        if (keyCode === keys.DELETE ||
            (keyCode === keys.D && eventData.event.ctrlKey === true)) {

            var toolTypes = [ 'bidirectional', 'nonTarget', 'length', 'targetCR', 'targetUN', 'targetEX'];
            var nearbyToolData = getNearbyToolData(eventData.element, eventData.currentPoints.canvas, toolTypes);

            if (!nearbyToolData) {
                return;
            }

            const dialogSettings = {
                title: 'Delete measurements',
                message: 'Are you sure you want to delete this measurement?'
            };

            // TODO= Refactor this so the confirmation dialog is an
            // optional settable callback in the tool's configuration
            OHIF.ui.showDialog('dialogConfirm', dialogSettings).then(() => {
                removeMeasurementTimepoint(nearbyToolData.tool,
                    nearbyToolData.index,
                    nearbyToolData.toolType,
                    eventData.element
                );
            });
        }
    }

    // module/private exports
    cornerstoneTools.deleteLesionKeyboardTool = cornerstoneTools.keyboardTool(keyDownCallback);

})(cornerstoneTools);
