import { OHIF } from 'meteor/ohif:core';

/**
 * Return the parent tool data if it's a child tool or the tool data itself if not
 *
 * @param measurementData measurement data that must contain the toolType and measurement's _id
 * @returns {Object} Parent measurement data
 */
OHIF.measurements.getParentToolData = measurementData => {
    const { toolType, _id } = measurementData;
    const { tool } = OHIF.measurements.getToolConfiguration(toolType);
    const parentToolType = tool.parentTool || toolType;
    const parentToolData = OHIF.viewer.measurementApi.tools[parentToolType].findOne(_id);
    return parentToolData;
};
