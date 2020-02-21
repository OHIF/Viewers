import cornerstoneTools from 'cornerstone-tools';
import RTStructDisplayTool from './tools/RTStructDisplayTool';
import rtStructModule from './tools/modules/rtStructModule';

import TOOL_NAMES from './utils/toolNames';

const defaultConfig = {
  TOOL_NAMES: {
    RT_STRUCT_DISPLAY_TOOL: 'RTStructDisplayTool',
  },
};

/**
 *
 * @param {object} configuration
 * @param {Object|Array} configuration.csToolsConfig
 */
export default function init({ servicesManager, configuration = {} }) {
  const conifg = Object.assign({}, defaultConfig, configuration);

  TOOL_NAMES.RT_STRUCT_DISPLAY_TOOL = conifg.TOOL_NAMES.RT_STRUCT_DISPLAY_TOOL;

  cornerstoneTools.register('module', 'rtstruct', rtStructModule);
  cornerstoneTools.addTool(RTStructDisplayTool);
}
