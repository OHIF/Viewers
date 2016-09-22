import { OHIF } from 'meteor/ohif:core';

/**
 * Sets all tool data entries value for 'active' to false
 * This is used to remove the active color on entire sets of tools
 *
 * @param element The Cornerstone element that is being used
 * @param toolType The tooltype of the tools that will be deactivated
 */
OHIF.measurements.deactivateAllToolData = (element, toolType) => {
    const toolData = cornerstoneTools.getToolState(element, toolType);
    if (!toolData) {
        return;
    }

    for (let i = 0; i < toolData.data.length; i++) {
        toolData.data[i].active = false;
    }
};
