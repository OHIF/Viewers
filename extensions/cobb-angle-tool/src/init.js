import cornerstoneTools, { CobbAngleTool } from 'cornerstone-tools';

/**
 *
 * @param {object} configuration
 * @param {Object|Array} configuration.csToolsConfig
 */
export default function init() {
  cornerstoneTools.addTool(CobbAngleTool);
}
