const toolGroupIds = {
  default: 'dynamic4D-default',
  PT: 'dynamic4D-pt',
  Fusion: 'dynamic4D-fusion',
  CT: 'dynamic4D-ct',
};

const brushInstanceNames = {
  CircularBrush: 'CircularBrush',
  CircularEraser: 'CircularEraser',
  SphereBrush: 'SphereBrush',
  SphereEraser: 'SphereEraser',
  ThresholdBrush: 'ThresholdBrush',
};

const brushStrategies = {
  [brushInstanceNames.CircularBrush]: 'FILL_INSIDE_CIRCLE',
  [brushInstanceNames.CircularEraser]: 'ERASE_INSIDE_CIRCLE',
  [brushInstanceNames.SphereBrush]: 'FILL_INSIDE_SPHERE',
  [brushInstanceNames.SphereEraser]: 'ERASE_INSIDE_SPHERE',
  [brushInstanceNames.ThresholdBrush]: 'THRESHOLD_INSIDE_CIRCLE',
};

function _initToolGroups(toolNames, Enums, toolGroupService, commandsManager) {
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
      { toolName: toolNames.RectangleROIThreshold },
      { toolName: toolNames.RectangleScissors },
      { toolName: toolNames.CircleScissors },
      { toolName: toolNames.SphereScissors },
      { toolName: toolNames.PaintFill },
      { toolName: toolNames.StackScroll },
      { toolName: toolNames.Angle },
      { toolName: toolNames.CobbAngle },
      { toolName: toolNames.Magnify },
      {
        toolName: brushInstanceNames.CircularBrush,
        parentClassName: toolNames.Brush,
      },
      {
        toolName: brushInstanceNames.CircularEraser,
        parentClassName: toolNames.Brush,
        configuration: {
          activeStrategy: brushStrategies.CircularBrush,
        },
      },
      {
        toolName: brushInstanceNames.SphereBrush,
        parentClassName: toolNames.Brush,
        configuration: {
          activeStrategy: brushStrategies.SphereBrush,
        },
      },
      {
        toolName: brushInstanceNames.SphereEraser,
        parentClassName: toolNames.Brush,
        configuration: {
          activeStrategy: brushStrategies.SphereEraser,
        },
      },
      {
        toolName: brushInstanceNames.ThresholdBrush,
        parentClassName: toolNames.Brush,
        configuration: {
          activeStrategy: brushStrategies.ThresholdBrush,
        },
      },
    ],
    enabled: [{ toolName: toolNames.SegmentationDisplay }],
    disabled: [
      {
        toolName: toolNames.Crosshairs,
        configuration: {
          viewportIndicators: false,
          autoPan: {
            enabled: false,
            panSize: 10,
          },
        },
      },
    ],
  };

  toolGroupService.createToolGroupAndAddTools(toolGroupIds.PT, {
    ...tools,
    passive: [...tools.passive, { toolName: 'RectangleROIStartEndThreshold' }],
  });

  toolGroupService.createToolGroupAndAddTools(toolGroupIds.CT, {
    ...tools,
    passive: [...tools.passive, { toolName: 'RectangleROIStartEndThreshold' }],
  });

  toolGroupService.createToolGroupAndAddTools(toolGroupIds.Fusion, {
    ...tools,
    passive: [...tools.passive, { toolName: 'RectangleROIStartEndThreshold' }],
  });

  toolGroupService.createToolGroupAndAddTools(toolGroupIds.default, tools);
}

function initToolGroups({ toolNames, Enums, toolGroupService, commandsManager }) {
  _initToolGroups(toolNames, Enums, toolGroupService, commandsManager);
}

export { initToolGroups as default, toolGroupIds };
