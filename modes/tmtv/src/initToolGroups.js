export const toolGroupIds = {
  CT: 'ctToolGroup',
  PT: 'ptToolGroup',
  Fusion: 'fusionToolGroup',
  MIP: 'mipToolGroup',
  default: 'default',
  // MPR: 'mpr',
};

function _initToolGroups(toolNames, Enums, ToolGroupService, commandsManager) {
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
      { toolName: toolNames.Probe },
      { toolName: toolNames.EllipticalROI },
      { toolName: toolNames.RectangleROI },
      { toolName: toolNames.StackScroll },
      { toolName: toolNames.Angle },
      { toolName: toolNames.Magnify },
    ],
    enabled: [{ toolName: toolNames.SegmentationDisplay }],
    disabled: [{ toolName: toolNames.Crosshairs }],
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
      getTextCallback: (callback, eventDetails) => {
        commandsManager.runCommand('arrowTextCallback', {
          callback,
          eventDetails,
        });
      },

      changeTextCallback: (data, eventDetails, callback) =>
        commandsManager.runCommand('arrowTextCallback', {
          callback,
          data,
          eventDetails,
        }),
    },
  };

  ToolGroupService.createToolGroupAndAddTools(
    toolGroupIds.CT,
    tools,
    toolsConfig
  );
  ToolGroupService.createToolGroupAndAddTools(
    toolGroupIds.PT,
    {
      active: tools.active,
      passive: [
        ...tools.passive,
        { toolName: 'RectangleROIStartEndThreshold' },
      ],
      enabled: tools.enabled,
      disabled: tools.disabled,
    },
    toolsConfig
  );
  ToolGroupService.createToolGroupAndAddTools(
    toolGroupIds.Fusion,
    tools,
    toolsConfig
  );
  ToolGroupService.createToolGroupAndAddTools(
    toolGroupIds.default,
    tools,
    toolsConfig
  );

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
    enabled: [{ toolName: toolNames.SegmentationDisplay }],
  };

  const mipToolsConfig = {
    [toolNames.VolumeRotateMouseWheel]: {
      rotateIncrementDegrees: 0.1,
    },
    [toolNames.MipJumpToClick]: {
      targetViewportIds: ['ptAXIAL', 'ptCORONAL', 'ptSAGITTAL'],
    },
  };

  ToolGroupService.createToolGroupAndAddTools(
    toolGroupIds.MIP,
    mipTools,
    mipToolsConfig
  );
}

function initMPRToolGroup(toolNames, Enums, ToolGroupService, commandsManager) {
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

function initToolGroups(toolNames, Enums, ToolGroupService, commandsManager) {
  _initToolGroups(toolNames, Enums, ToolGroupService, commandsManager);
  // initMPRToolGroup(toolNames, Enums, ToolGroupService, commandsManager);
}

export default initToolGroups;
