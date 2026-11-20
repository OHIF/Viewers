import { Enums } from '@cornerstonejs/tools';
import { toolNames } from '../initCornerstoneTools';

/**
 * The state of the crop tool as the user sees it: Active when it is the primary tool,
 * Passive when the crop box shows but another tool is primary, Disabled when it is off.
 * The CS3D mode alone is not enough: a tool keeps Active mode while its SHIFT binding
 * remains, after another tool takes the primary button.
 */
export function getVolumeCroppingState(toolGroup): Enums.ToolModes {
  const mode = toolGroup?.getToolOptions(toolNames.VolumeCropping)?.mode;
  if (!mode || mode === Enums.ToolModes.Disabled) {
    return Enums.ToolModes.Disabled;
  }
  return toolGroup.getActivePrimaryMouseButtonTool() === toolNames.VolumeCropping
    ? Enums.ToolModes.Active
    : Enums.ToolModes.Passive;
}

/**
 * The tool group that holds VolumeCropping: the group of `viewportId` when it has the
 * tool, otherwise the first group with the tool that has viewports. The second case
 * lets the main toolbar work while an MPR viewport is active.
 */
export default function getVolumeCroppingToolGroup(
  toolGroupService: AppTypes.Services['toolGroupService'],
  viewportId?: string
) {
  const hasCropping = toolGroup =>
    toolGroup?.hasTool(toolNames.VolumeCropping) ? toolGroup : undefined;
  return (
    (viewportId && hasCropping(toolGroupService.getToolGroupForViewport(viewportId))) ||
    toolGroupService
      .getToolGroupIds()
      .map(id => hasCropping(toolGroupService.getToolGroup(id)))
      .find(toolGroup => toolGroup?.getViewportIds().length)
  );
}
