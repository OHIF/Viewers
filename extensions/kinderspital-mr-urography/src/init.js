import csTools from 'cornerstone-tools';
import TOOL_NAMES from './tools/toolNames';
import KinderSpitalFreehandRoiTool from './tools/KinderspitalFreehandRoiTool';
import KinderspitalFreehandRoiSculptorTool from './tools/KinderspitalFreehandRoiSculptorTool';

/**
 *
 * @param {object} configuration
 * @param {Object|Array} configuration.csToolsConfig
 */
export default function init({ servicesManager, configuration = {} }) {
  console.log('UROGRAPHY REGISTERED!');

  // const { FreehandRoiSculptorTool } = csTools;

  csTools.addTool(KinderSpitalFreehandRoiTool);
  csTools.addTool(KinderspitalFreehandRoiSculptorTool);
  // csTools.addTool(FreehandRoiSculptorTool, {
  //   name: TOOL_NAMES.KINDERSPITAL_FREEHAND_ROI_SCULPTOR_TOOL,
  //   referencedToolName: TOOL_NAMES.KINDERSPITAL_FREEHAND_ROI_TOOL,
  // });
}
