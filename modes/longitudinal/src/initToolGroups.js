function initDefaultToolGroup(
  extensionManager,
  ToolGroupService,
  commandsManager,
  toolGroupId
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
      { toolName: toolNames.SegmentationDisplay },
    ],
    // enabled
    // disabled
    disabled: [{ toolName: toolNames.ReferenceLines }],
  };

  const toolsConfig = {
    [toolNames.ArrowAnnotate]: {
      getTextCallback: (callback, eventDetails) =>
        commandsManager.runCommand('arrowTextCallback', {
          callback,
          eventDetails,
        }),

      changeTextCallback: (data, eventDetails, callback) =>
        commandsManager.runCommand('arrowTextCallback', {
          callback,
          data,
          eventDetails,
        }),
    },
  };

  ToolGroupService.createToolGroupAndAddTools(toolGroupId, tools, toolsConfig);
}

function initSRToolGroup(extensionManager, ToolGroupService, commandsManager) {
  const SRUtilityModule = extensionManager.getModuleEntry(
    '@ohif/extension-cornerstone-dicom-sr.utilityModule.tools'
  );

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
        ],
      },
      {
        toolName: toolNames.StackScrollMouseWheel,
        bindings: [],
      },
    ],
    passive: [
      { toolName: SRToolNames.SRLength },
      { toolName: SRToolNames.SRArrowAnnotate },
      { toolName: SRToolNames.SRBidirectional },
      { toolName: SRToolNames.SREllipticalROI },
    ],
    enabled: [
      {
        toolName: SRToolNames.DICOMSRDisplay,
        bindings: [],
      },
    ],
    // disabled
  };

  const toolsConfig = {
    [toolNames.ArrowAnnotate]: {
      getTextCallback: (callback, eventDetails) =>
        commandsManager.runCommand('arrowTextCallback', {
          callback,
          eventDetails,
        }),

      changeTextCallback: (data, eventDetails, callback) =>
        commandsManager.runCommand('arrowTextCallback', {
          callback,
          data,
          eventDetails,
        }),
    },
  };

  const toolGroupId = 'SRToolGroup';
  ToolGroupService.createToolGroupAndAddTools(toolGroupId, tools, toolsConfig);
}

function initMPRToolGroup(extensionManager, ToolGroupService, commandsManager) {
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
      { toolName: toolNames.SegmentationDisplay },
    ],
    disabled: [{ toolName: toolNames.Crosshairs }],

    // enabled
    // disabled
  };

  const toolsConfig = {
    [toolNames.Crosshairs]: {
      viewportIndicators: false,
      autoPan: {
        enabled: false,
        panSize: 10,
      },
    },
    [toolNames.ArrowAnnotate]: {
      getTextCallback: (callback, eventDetails) =>
        commandsManager.runCommand('arrowTextCallback', {
          callback,
          eventDetails,
        }),

      changeTextCallback: (data, eventDetails, callback) =>
        commandsManager.runCommand('arrowTextCallback', {
          callback,
          data,
          eventDetails,
        }),
    },
  };

  ToolGroupService.createToolGroupAndAddTools('mpr', tools, toolsConfig);
}

function initToolGroups(extensionManager, ToolGroupService, commandsManager) {
  initDefaultToolGroup(
    extensionManager,
    ToolGroupService,
    commandsManager,
    'default'
  );
  initSRToolGroup(extensionManager, ToolGroupService, commandsManager);
  initMPRToolGroup(extensionManager, ToolGroupService, commandsManager);
}

export default initToolGroups;
