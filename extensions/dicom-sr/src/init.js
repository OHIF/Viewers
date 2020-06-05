import cornerstoneTools from 'cornerstone-tools';
import DICOMSRDisplayTool from './tools/DICOMSRDisplayTool';

import TOOL_NAMES from './constants/toolNames';

const defaultConfig = {
  TOOL_NAMES: {
    DICOM_SR_DISPLAY_TOOL: 'DICOMSRDisplayTool',
  },
};

/**
 * @param {object} configuration
 */
export default function init({ configuration = {} }) {
  const conifg = Object.assign({}, defaultConfig, configuration);

  TOOL_NAMES.DICOM_SR_DISPLAY_TOOL = conifg.TOOL_NAMES.DICOM_SR_DISPLAY_TOOL;

  cornerstoneTools.addTool(DICOMSRDisplayTool);
}
