function initDefaultToolGroup(
  extensionManager,
  toolGroupService,
  commandsManager,
  toolGroupId,
  modeLabelConfig
) {
  const utilityModule = extensionManager.getModuleEntry(
    '@ohif/extension-cornerstone.utilityModule.tools'
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
      {
        toolName: toolNames.StackScroll,
        bindings: [{ mouseButton: Enums.MouseBindings.Wheel }, { numTouchPoints: 3 }],
      },
    ],
    passive: [
      { toolName: toolNames.Length },
      { toolName: toolNames.Probe },
      { toolName: toolNames.RectangleROI },
      { toolName: toolNames.Angle },
      { toolName: toolNames.CalibrationLine },
      { toolName: toolNames.WindowLevelRegion },
    ],
  };

  toolGroupService.createToolGroupAndAddTools(toolGroupId, tools);
}

function initToolGroups(extensionManager, toolGroupService, commandsManager, modeLabelConfig) {
  initDefaultToolGroup(
    extensionManager,
    toolGroupService,
    commandsManager,
    'default',
    modeLabelConfig
  );
}

export default initToolGroups;
