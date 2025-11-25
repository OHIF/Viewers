function initDefaultToolGroup(extensionManager, toolGroupService, commandsManager, toolGroupId) {
  const utilityModule = extensionManager.getModuleEntry(
    '@ohif/extension-cornerstone.utilityModule.tools'
  );

  if (!utilityModule) {
    console.warn('Cornerstone utility module not found for dental mode');
    return;
  }

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
        bindings: [{ mouseButton: Enums.MouseBindings.Secondary }, { numTouchPoints: 2 }],
      },
      {
        toolName: toolNames.StackScroll,
        bindings: [{ mouseButton: Enums.MouseBindings.Wheel }, { numTouchPoints: 3 }],
      },
    ],
    passive: [{ toolName: toolNames.Length }, { toolName: toolNames.Angle }],
  };

  toolGroupService.createToolGroupAndAddTools(toolGroupId, tools);
}

function initSRToolGroup(extensionManager, toolGroupService) {
  const SRUtilityModule = extensionManager.getModuleEntry(
    '@ohif/extension-cornerstone-dicom-sr.utilityModule.tools'
  );

  if (!SRUtilityModule) {
    console.warn('SR utility module not found for dental mode - SR functionality will be limited');
    return;
  }

  const CS3DUtilityModule = extensionManager.getModuleEntry(
    '@ohif/extension-cornerstone.utilityModule.tools'
  );

  const { toolNames: SRToolNames } = SRUtilityModule.exports;
  const { toolNames, Enums } = CS3DUtilityModule.exports;

  const tools = {
    active: [
      {
        toolName: toolNames.WindowLevel,
        bindings: [
          {
            mouseButton: Enums.MouseBindings.Primary,
          },
        ],
      },
      {
        toolName: toolNames.Pan,
        bindings: [
          {
            mouseButton: Enums.MouseBindings.Auxiliary,
          },
        ],
      },
      {
        toolName: toolNames.Zoom,
        bindings: [
          {
            mouseButton: Enums.MouseBindings.Secondary,
          },
          { numTouchPoints: 2 },
        ],
      },
      {
        toolName: toolNames.StackScroll,
        bindings: [{ mouseButton: Enums.MouseBindings.Wheel }, { numTouchPoints: 3 }],
      },
    ],
    passive: [
      { toolName: SRToolNames.SRLength },
      { toolName: SRToolNames.SRArrowAnnotate },
      { toolName: SRToolNames.SRBidirectional },
      { toolName: SRToolNames.SREllipticalROI },
      { toolName: SRToolNames.SRCircleROI },
      { toolName: SRToolNames.SRPlanarFreehandROI },
      { toolName: SRToolNames.SRRectangleROI },
      { toolName: toolNames.WindowLevelRegion },
    ],
    enabled: [
      {
        toolName: SRToolNames.DICOMSRDisplay,
      },
    ],
  };

  const toolGroupId = 'SRToolGroup';
  toolGroupService.createToolGroupAndAddTools(toolGroupId, tools);
}

export default function initDentalToolGroups(extensionManager, toolGroupService, commandsManager) {
  // Initialize separate tool groups for each viewport in 2x2 layout
  initDefaultToolGroup(extensionManager, toolGroupService, commandsManager, 'dental-current');
  initDefaultToolGroup(extensionManager, toolGroupService, commandsManager, 'dental-prior');
  initDefaultToolGroup(extensionManager, toolGroupService, commandsManager, 'dental-bitewing-left');
  initDefaultToolGroup(
    extensionManager,
    toolGroupService,
    commandsManager,
    'dental-bitewing-right'
  );

  // Keep 'default' for compatibility with other modes/protocols
  initDefaultToolGroup(extensionManager, toolGroupService, commandsManager, 'default');

  // SR tool group for structured reports
  initSRToolGroup(extensionManager, toolGroupService);
}
