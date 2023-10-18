const brushInstanceNames = {
  CircularBrush: 'CircularBrush',
  CircularEraser: 'CircularEraser',
  SphereBrush: 'SphereBrush',
  SphereEraser: 'SphereEraser',
  ThresholdCircularBrush: 'ThresholdCircularBrush',
  ThresholdSphereBrush: 'ThresholdSphereBrush',
};

const brushStrategies = {
  CircularBrush: 'FILL_INSIDE_CIRCLE',
  CircularEraser: 'ERASE_INSIDE_CIRCLE',
  SphereBrush: 'FILL_INSIDE_SPHERE',
  SphereEraser: 'ERASE_INSIDE_SPHERE',
  ThresholdCircularBrush: 'THRESHOLD_INSIDE_CIRCLE',
  ThresholdSphereBrush: 'THRESHOLD_INSIDE_SPHERE',
};

function initDefaultToolGroup(
  extensionManager,
  toolGroupService,
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
        toolName: toolNames.Pan,
        bindings: [{ mouseButton: Enums.MouseBindings.Auxiliary }],
      },
      {
        toolName: toolNames.Zoom,
        bindings: [{ mouseButton: Enums.MouseBindings.Secondary }],
      },
      { toolName: toolNames.StackScrollMouseWheel, bindings: [] },
    ],
    passive: Object.keys(brushInstanceNames)
      .map((brushName) => ({
        toolName: brushName,
        parentTool: 'Brush',
        configuration: {
          activeStrategy: brushStrategies[brushName],
        },
      }))
      .concat([
        { toolName: toolNames.CircleScissors },
        { toolName: toolNames.RectangleScissors },
        { toolName: toolNames.SphereScissors },
        { toolName: toolNames.StackScroll },
        { toolName: toolNames.Magnify },
        { toolName: toolNames.SegmentationDisplay },
        { toolName: toolNames.Length },
        { toolName: toolNames.ArrowAnnotate },
        { toolName: toolNames.Bidirectional },
        { toolName: toolNames.DragProbe },
        { toolName: toolNames.EllipticalROI },
        { toolName: toolNames.CircleROI },
        { toolName: toolNames.RectangleROI },
        { toolName: toolNames.StackScroll },
        { toolName: toolNames.Angle },
        { toolName: toolNames.CobbAngle },
        { toolName: toolNames.PlanarFreehandROI },
        { toolName: toolNames.Magnify },
        { toolName: toolNames.SegmentationDisplay },
        { toolName: toolNames.CalibrationLine },
        { toolName: 'RectangleROIStartEndThreshold' },
      ]),
    // enabled
    // disabled
    enabled: [],
    disabled: [
      { toolName: toolNames.ReferenceLines },
      { toolName: toolNames.Crosshairs },
      {
        toolName: toolNames.WindowLevel,
      },
    ],
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
  console.log(tools);
  toolGroupService.createToolGroupAndAddTools(toolGroupId, tools, toolsConfig);
}

function initSRToolGroup(extensionManager, toolGroupService, commandsManager) {
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
      { toolName: SRToolNames.SRCircleROI },
      { toolName: 'RectangleROIStartEndThreshold' },
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
  toolGroupService.createToolGroupAndAddTools(toolGroupId, tools, toolsConfig);
}

function initMPRToolGroup(extensionManager, toolGroupService, commandsManager) {
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
    passive: Object.keys(brushInstanceNames)
      .map((brushName) => ({
        toolName: brushName,
        parentTool: 'Brush',
        configuration: {
          activeStrategy: brushStrategies[brushName],
        },
      }))
      .concat([
        { toolName: toolNames.CircleScissors },
        { toolName: toolNames.RectangleScissors },
        { toolName: toolNames.SphereScissors },
        { toolName: toolNames.StackScroll },
        { toolName: toolNames.Magnify },
        { toolName: toolNames.SegmentationDisplay },
        { toolName: toolNames.Length },
        { toolName: toolNames.ArrowAnnotate },
        { toolName: toolNames.Bidirectional },
        { toolName: toolNames.DragProbe },
        { toolName: toolNames.EllipticalROI },
        { toolName: toolNames.CircleROI },
        { toolName: toolNames.RectangleROI },
        { toolName: toolNames.StackScroll },
        { toolName: toolNames.Angle },
        { toolName: toolNames.CobbAngle },
        { toolName: toolNames.PlanarFreehandROI },
        { toolName: toolNames.Magnify },
        { toolName: toolNames.SegmentationDisplay },
        { toolName: toolNames.CalibrationLine },
        { toolName: 'RectangleROIStartEndThreshold' },
      ]),
    disabled: [
      { toolName: toolNames.Crosshairs },
      { toolName: toolNames.ReferenceLines },
    ],

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

  toolGroupService.createToolGroupAndAddTools('mpr', tools, toolsConfig);
}
function initVolume3DToolGroup(extensionManager, toolGroupService) {
  const utilityModule = extensionManager.getModuleEntry(
    '@ohif/extension-cornerstone.utilityModule.tools'
  );

  const { toolNames, Enums } = utilityModule.exports;

  const tools = {
    active: [
      {
        toolName: toolNames.TrackballRotateTool,
        bindings: [{ mouseButton: Enums.MouseBindings.Primary }],
      },
      {
        toolName: toolNames.Zoom,
        bindings: [{ mouseButton: Enums.MouseBindings.Secondary }],
      },
      {
        toolName: toolNames.Pan,
        bindings: [{ mouseButton: Enums.MouseBindings.Auxiliary }],
      },
    ],
    passive: [
      {
        toolName: toolNames.SegmentationDisplay,
      },
    ],
  };

  toolGroupService.createToolGroupAndAddTools('volume3d', tools);
}

function initToolGroups(extensionManager, toolGroupService, commandsManager) {
  initDefaultToolGroup(
    extensionManager,
    toolGroupService,
    commandsManager,
    'default'
  );
  initSRToolGroup(extensionManager, toolGroupService, commandsManager);
  initMPRToolGroup(extensionManager, toolGroupService, commandsManager);
  initVolume3DToolGroup(extensionManager, toolGroupService);
}

export default initToolGroups;
