import cornerstoneTools from 'cornerstone-tools';
import SphericalGrowCutSegmentationTool from './tools/segmentation/SphericalGrowCutSegmentationTool';
import { init as initOhifStep } from 'ohif-step';

/**
 *
 * @param {object} configuration
 * @param {Object|Array} configuration.csToolsConfig
 */
export default function init({ servicesManager, configuration = {} }) {
  initOhifStep();

  cornerstoneTools.addTool(SphericalGrowCutSegmentationTool, {});
}
