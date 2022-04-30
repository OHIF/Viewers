import { addTool } from '@cornerstonejs/tools';
import dicomSRModule from './tools/modules/dicomSRModule';

import DICOMSRDisplayTool from './tools/DICOMSRDisplayTool';
import SRLengthTool from './tools/annotationTools/SRLengthTool';

/**
 * @param {object} configuration
 */
export default function init({ configuration = {} }) {
  // const config = Object.assign({}, defaultConfig, configuration);

  // TOOL_NAMES.DICOM_SR_DISPLAY_TOOL = config.TOOL_NAMES.DICOM_SR_DISPLAY_TOOL;
  addTool(DICOMSRDisplayTool);
  addTool(SRLengthTool);

  // cornerstoneTools.register('module', id, dicomSRModule);
}
