import cornerstoneTools from 'cornerstone-tools';
import DICOMSRDisplayTool from './tools/DICOMSRDisplayTool';
import dicomSRModule from './tools/modules/dicomSRModule';
import id from './id';

import TOOL_NAMES from './constants/toolNames';

const defaultConfig = {
  TOOL_NAMES: {
    DICOM_SR_DISPLAY_TOOL: 'DICOMSRDisplayTool',
  },
};

/**
 * @param {object} configuration
 */
export default function init({ configuration = {}, servicesManager }) {
  const config = Object.assign({}, defaultConfig, configuration);

  TOOL_NAMES.DICOM_SR_DISPLAY_TOOL = config.TOOL_NAMES.DICOM_SR_DISPLAY_TOOL;

  cornerstoneTools.register('module', id, dicomSRModule);
  cornerstoneTools.addTool(DICOMSRDisplayTool);
  cornerstoneTools.setToolEnabled(TOOL_NAMES.DICOM_SR_DISPLAY_TOOL);

  const { DisplaySetService } = servicesManager.services;

  DisplaySetService.subscribe(
    DisplaySetService.EVENTS.DISPLAY_SETS_ADDED,
    data => {
      const { displaySetsAdded, options } = data;
      displaySetsAdded.forEach(dSet => {
        if (options.madeInClient) {
          // Set just made displaySets as hydrated.
          if (!dSet.isLoaded) {
            dSet.load();
          }
          dSet.isHydrated = true;
        }
      });
    }
  );
}
