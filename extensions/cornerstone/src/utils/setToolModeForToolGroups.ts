import { Enums } from '@cornerstonejs/tools';
import ToolGroupService from '../services/ToolGroupService';

/**
 * Sets the mode for tools in all tool groups managed by the tool group service.
 *
 * @param toolGroupService - The service managing the tool groups.
 * @param mode - The mode to set for the tools (e.g., Active, Enabled, Passive, Disabled).
 */
const setToolModeForToolGroups = (toolGroupService: ToolGroupService, mode: Enums.ToolModes) => {
  const toolGroupIds = toolGroupService.getToolGroupIds();
  toolGroupIds.forEach(toolGroupId => {
    const toolGroup = toolGroupService.getToolGroup(toolGroupId);
    if (!toolGroup) {
      return;
    }
    const toolName = toolGroup.currentActivePrimaryToolName;
    let options;

    if (mode === Enums.ToolModes.Active) {
      options = {
        bindings: [{ mouseButton: Enums.MouseBindings.Primary }],
      };
    }
    toolGroup.setToolMode(toolName, mode, options);
  });
};

export default setToolModeForToolGroups;
