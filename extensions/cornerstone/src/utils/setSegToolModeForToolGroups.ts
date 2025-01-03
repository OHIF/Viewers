import { Enums } from '@cornerstonejs/tools';
import ToolGroupService from '../services/ToolGroupService';
import { segmentationTools } from './SegmentationTools';

/**
 * Sets the mode for segmentation tools in all tool groups managed by the tool group service.
 *
 * @param toolGroupService - The service managing the tool groups.
 * @param mode - The mode to set for the tools (e.g., Active, Enabled, Passive, Disabled).
 */
const setSegToolModeForToolGroups = (toolGroupService: ToolGroupService, mode: Enums.ToolModes) => {
  const toolGroupIds = toolGroupService.getToolGroupIds();
  toolGroupIds.forEach(toolGroupId => {
    const toolGroup = toolGroupService.getToolGroup(toolGroupId);
    if (!toolGroup) {
      return;
    }
    const toolName = toolGroup.currentActivePrimaryToolName;
    if (!toolName || !toolGroup.hasTool(toolName) || !segmentationTools.includes(toolName)) {
      return;
    }
    let options;

    if (mode === Enums.ToolModes.Active) {
      options = {
        bindings: [{ mouseButton: Enums.MouseBindings.Primary }],
      };
    }
    toolGroup.setToolMode(toolName, mode, options);
  });
};

export default setSegToolModeForToolGroups;
