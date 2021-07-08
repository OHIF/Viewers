import cornerstoneTools from 'cornerstone-tools';

/** Internal imports */
import id from './id';
import dicomSRModule from './tools/modules/dicomSRModule';
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
  const config = Object.assign({}, defaultConfig, configuration);

  TOOL_NAMES.DICOM_SR_DISPLAY_TOOL = config.TOOL_NAMES.DICOM_SR_DISPLAY_TOOL;

  cornerstoneTools.register('module', id, dicomSRModule);
}
