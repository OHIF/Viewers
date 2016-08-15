/**
 * Sets all tool data entries value for 'active' to false
 * This is used to remove the active color on entire sets of tools
 *
 * @param element The Cornerstone element that is being used
 * @param toolType The tooltype of the tools that will be deactivated
 */
deactivateAllToolData = function(element, toolType) {
    var toolData = cornerstoneTools.getToolState(element, toolType);
    if (!toolData) {
        return;
    }

    for (var i = 0; i < toolData.data.length; i++) {
        var data = toolData.data[i];
        data.active = false;
    }
};
