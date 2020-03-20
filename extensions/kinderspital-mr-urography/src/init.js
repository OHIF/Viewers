import csTools from 'cornerstone-tools';
import KinderSpitalFreehandRoiTool from './tools/KinderspitalFreehandRoiTool';
import KinderspitalFreehandRoiSculptorTool from './tools/KinderspitalFreehandRoiSculptorTool';

/**
 *
 * @param {object} configuration
 * @param {Object|Array} configuration.csToolsConfig
 */
export default function init({ servicesManager, configuration = {} }) {
  csTools.addTool(KinderSpitalFreehandRoiTool);
  csTools.addTool(KinderspitalFreehandRoiSculptorTool);
}
