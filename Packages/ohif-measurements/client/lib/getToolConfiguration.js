import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';

/**
 * Return the tool configuration of a given tool type
 *
 * @param {String} toolType The tool type of the desired configuration
 */
OHIF.measurements.getToolConfiguration = toolType => {
    const { MeasurementApi } = OHIF.measurements;
    const configuration = MeasurementApi.getConfiguration();
    const toolsGroupsMap = MeasurementApi.getToolsGroupsMap();

    const toolGroupId = toolsGroupsMap[toolType];
    const toolGroup = _.findWhere(configuration.measurementTools, { id: toolGroupId });

    let tool;
    if (toolGroup) {
        tool = _.findWhere(toolGroup.childTools, { id: toolType });
    }

    return {
        toolGroupId,
        toolGroup,
        tool
    };
};
