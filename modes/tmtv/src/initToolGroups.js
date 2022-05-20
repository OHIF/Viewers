export const toolGroupIds = {
  CT: 'ctToolGroup',
  PT: 'ptToolGroup',
  Fusion: 'fusionToolGroup',
  MIP: 'mipToolGroup',
  default: 'default',
};

function initToolGroups(extensionManager, ToolGroupService) {
  const utilityModule = extensionManager.getModuleEntry(
    '@ohif/extension-cornerstone-3d.utilityModule.tools'
  );

  const { toolNames, Enums } = utilityModule.exports;

  const tools = {
    active: [
      {
        toolName: toolNames.WindowLevel,
        bindings: [{ mouseButton: Enums.MouseBindings.Primary }],
      },
      {
        toolName: toolNames.Pan,
        bindings: [{ mouseButton: Enums.MouseBindings.Auxiliary }],
      },
      {
        toolName: toolNames.Zoom,
        bindings: [{ mouseButton: Enums.MouseBindings.Secondary }],
      },
      { toolName: toolNames.StackScrollMouseWheel, bindings: [] },
    ],
    passive: [
      { toolName: toolNames.Length },
      { toolName: toolNames.ArrowAnnotate },
      { toolName: toolNames.Bidirectional },
      { toolName: toolNames.DragProbe },
      { toolName: toolNames.EllipticalROI },
      { toolName: toolNames.RectangleROI },
      { toolName: toolNames.StackScroll },
      { toolName: toolNames.Angle },
      { toolName: toolNames.Magnify },
    ],
    // enabled
    // disabled
  };

  ToolGroupService.createToolGroupAndAddTools(toolGroupIds.CT, tools);
  ToolGroupService.createToolGroupAndAddTools(toolGroupIds.PT, tools);
  ToolGroupService.createToolGroupAndAddTools(toolGroupIds.Fusion, tools);
  ToolGroupService.createToolGroupAndAddTools(toolGroupIds.default, tools);

  const mipTools = {
    active: [
      {
        toolName: toolNames.VolumeRotateMouseWheel,
      },
      {
        toolName: toolNames.MipJumpToClick,
        bindings: [{ mouseButton: Enums.MouseBindings.Primary }],
      },
    ],
  };

  ToolGroupService.createToolGroupAndAddTools(toolGroupIds.MIP, mipTools);
}

export default initToolGroups;
