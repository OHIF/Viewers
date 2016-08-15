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

        var enabledElements = cornerstone.getEnabledElementsByImageId(imageId);
        enabledElements.forEach(function(enabledElement) {
            var element = enabledElement.element;

            // The HandleMeasurementRemoved handler should do the rest
            cornerstoneTools.removeToolState(element, toolType, data);

            //Update element
            cornerstone.updateImage(element);
        });
    }

    // TODO = Check if we have the same function already in Cornerstone Tools
    function getNearbyToolData(element, coords, toolTypes) {
        var allTools = toolManager.getTools();
        var pointNearTool = false;
        var touchDevice = isTouchDevice();
        var nearbyTool,
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
                    nearbyTool = data;
                    nearbyToolIndex = i;
                    nearbyToolType = toolType;
                    break;
                }
            }

            if (pointNearTool === true) {
                return false;
            }
        });

        if (pointNearTool === true) {
            return {
                nearbyTool: nearbyTool,
                nearbyToolIndex: nearbyToolIndex,
                nearbyToolType: nearbyToolType
            };
        }
    }

    function keyDownCallback(e, eventData) {
        var keyCode = eventData.which;
        if (keyCode === keys.DELETE ||
            (keyCode === keys.D && eventData.event.ctrlKey === true)) {

            var toolTypes = [ 'bidirectional', 'nonTarget', 'length', 'crTool', 'unTool', 'exTool'];
            var nearbyToolData = getNearbyToolData(eventData.element, eventData.currentPoints.canvas, toolTypes);

            if (!nearbyToolData) {
                return;
            }

            // TODO= Refactor this so the confirmation dialog is an
            // optional settable callback in the tool's configuration
            showConfirmDialog(function() {
                removeMeasurementTimepoint(nearbyToolData.nearbyTool,
                    nearbyToolData.nearbyToolIndex,
                    nearbyToolData.nearbyToolType,
                    eventData.element
                );
            });
        }
    }

    // module/private exports
    cornerstoneTools.deleteLesionKeyboardTool = cornerstoneTools.keyboardTool(keyDownCallback);

})(cornerstoneTools);
