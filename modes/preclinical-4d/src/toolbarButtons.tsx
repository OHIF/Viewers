import { WindowLevelMenuItem } from '@ohif/ui';
import { defaults } from '@ohif/core';
import { toolGroupIds as ToolGroupIds, toolGroupIds } from './initToolGroups';

const { windowLevelPresets } = defaults;
/**
 *
 * @param {*} type - 'tool' | 'action' | 'toggle'
 * @param {*} id
 * @param {*} icon
 * @param {*} label
 */
function _createButton(type, id, icon, label, commands, tooltip, uiType) {
  return {
    id,
    icon,
    label,
    type,
    commands,
    tooltip,
    uiType,
  };
}

const _createActionButton = _createButton.bind(null, 'action');
const _createToggleButton = _createButton.bind(null, 'toggle');
const _createToolButton = _createButton.bind(null, 'tool');

function _createColormap(label, colormap) {
  return {
    id: label.toString(),
    title: label,
    subtitle: label,
    type: 'action',
    commands: [
      {
        commandName: 'setFusionPTColormap',
        commandOptions: {
          toolGroupId: ToolGroupIds.Fusion,
          colormap,
        },
      },
      {
        commandName: 'setFusionPTColormap',
        commandOptions: {
          toolGroupId: ToolGroupIds.Fusion,
          colormap,
        },
      },
    ],
  };
}

function _createCommands(
  commandName: string,
  toolName?: string,
  toolGroupIds?: string[],
  commandOptions?: any
) {
  toolGroupIds = toolGroupIds ?? [
    ToolGroupIds.default,
    ToolGroupIds.PT,
    ToolGroupIds.Fusion,
    ToolGroupIds.CT,
  ];

  return toolGroupIds.map(toolGroupId => ({
    /* It's a command that is being run when the button is clicked. */
    commandName,
    commandOptions: {
      ...(commandOptions ?? {}),
      toolName,
      toolGroupId,
    },
    context: 'CORNERSTONE',
  }));
}

function _createWindowLevelCommands(windowLevelPreset) {
  const commandOptions = { ...windowLevelPreset };

  return _createCommands('setWindowLevel', undefined, undefined, commandOptions);
}

function _createLengthToolButton() {
  return _createToolButton(
    'Length',
    'tool-length',
    'Length',
    [..._createCommands('setToolActive', 'Length')],
    'Length'
  );
}

function _createBidirectionalToolButton() {
  return _createToolButton(
    'Bidirectional',
    'tool-bidirectional',
    'Bidirectional',
    [..._createCommands('setToolActive', 'Bidirectional')],
    'Bidirectional Tool'
  );
}

function _createArrowAnnotateToolButton() {
  return _createToolButton(
    'ArrowAnnotate',
    'tool-annotate',
    'Annotation',
    [..._createCommands('setToolActive', 'ArrowAnnotate')],
    'Arrow Annotate'
  );
}

function _createEllipticalROIToolButton() {
  return _createToolButton(
    'EllipticalROI',
    'tool-elipse',
    'Ellipse',
    [..._createCommands('setToolActive', 'EllipticalROI')],
    'Ellipse Tool'
  );
}

function _createZoomToolButton() {
  return {
    id: 'Zoom',
    type: 'ohif.radioGroup',
    props: {
      type: 'tool',
      icon: 'tool-zoom',
      label: 'Zoom',
      commands: [..._createCommands('setToolActive', 'Zoom')],
    },
  };
}

/**
 *
 * @param {*} preset - preset number (from above import)
 * @param {*} title
 * @param {*} subtitle
 */
function _createWwwcPreset(preset, title, subtitle) {
  return {
    id: preset.toString(),
    title,
    subtitle,
    type: 'action',
    commands: [..._createWindowLevelCommands(windowLevelPresets[preset])],
  };
}

function _createWindowLevelToolButton() {
  return {
    id: 'WindowLevel',
    type: 'ohif.splitButton',
    props: {
      groupId: 'WindowLevel',
      primary: _createToolButton(
        'WindowLevel',
        'tool-window-level',
        'Window Level',
        [..._createCommands('setToolActive', 'WindowLevel')],
        'Window Level'
      ),
      secondary: {
        icon: 'chevron-down',
        label: 'W/L Manual',
        isActive: true,
        tooltip: 'W/L Presets',
      },
      isAction: true,
      renderer: WindowLevelMenuItem,
      items: [
        _createWwwcPreset(1, 'Soft tissue', '400 / 40'),
        _createWwwcPreset(2, 'Lung', '1500 / -600'),
        _createWwwcPreset(3, 'Liver', '150 / 90'),
        _createWwwcPreset(4, 'Bone', '2500 / 480'),
        _createWwwcPreset(5, 'Brain', '80 / 40'),
      ],
    },
  };
}

function _createPanToolButton() {
  return {
    id: 'Pan',
    type: 'ohif.radioGroup',
    props: {
      type: 'tool',
      icon: 'tool-move',
      label: 'Pan',
      commands: [..._createCommands('setToolActive', 'Pan')],
    },
  };
}

function _createCircularBrush() {
  return _createToolButton(
    'CircularBrush',
    'tool-brush',
    'Circular Brush',
    [..._createCommands('setToolActive', 'CircularBrush')],
    'Circular Brush'
  );
}

function _createCircularEraser() {
  return _createToolButton(
    'CircularEraser',
    'tool-eraser',
    'Circular Eraser',
    [..._createCommands('setToolActive', 'CircularEraser')],
    'Circular Eraser'
  );
}

function _createSphereBrush() {
  return _createToolButton(
    'SphereBrush',
    'notifications-warning',
    'Sphere Brush',
    [..._createCommands('setToolActive', 'SphereBrush')],
    'Sphere Brush'
  );
}

function _createSphereEraser() {
  return _createToolButton(
    'SphereEraser',
    'notifications-warning',
    'Sphere Eraser',
    [..._createCommands('setToolActive', 'SphereEraser')],
    'Sphere Eraser'
  );
}

function _createThresholdBrush() {
  return _createToolButton(
    'ThresholdBrush',
    'notifications-warning',
    'Threshold Brush',
    [..._createCommands('setToolActive', 'ThresholdBrush')],
    'Threshold Brush'
  );
}

function _createRectangleROIStartEndThreshold() {
  return _createToolButton(
    'RectangleROIStartEndThreshold',
    'tool-create-threshold',
    'Rectangle ROI Threshold (start/end)',
    [
      ..._createCommands('setToolActive', 'RectangleROIStartEndThreshold', [
        toolGroupIds.Fusion,
        toolGroupIds.PT,
      ]),
      {
        commandName: 'displayNotification',
        commandOptions: {
          title: 'RectangleROI Threshold Tip',
          text: 'RectangleROI Threshold tool should be used on PT Axial Viewport',
          type: 'info',
        },
      },
    ],
    'Rectangle ROI Threshold (start/end)'
  );
}

function _createRectangleROIThreshold() {
  return _createToolButton(
    'RectangleROIThreshold',
    'notifications-warning',
    'Rectangle ROI Threshold',
    [..._createCommands('setToolActive', 'RectangleROIThreshold')],
    'Rectangle ROI Threshold'
  );
}

function _createRectangleScissor() {
  return _createToolButton(
    'RectangleScissor',
    'tool-scissor-rect',
    'Rectangle Scissor',
    [..._createCommands('setToolActive', 'RectangleScissor')],
    'Rectangle Scissor'
  );
}

function _createCircleScissor() {
  return _createToolButton(
    'CircleScissor',
    'tool-scissor-circle',
    'Circle Scissor',
    [..._createCommands('setToolActive', 'CircleScissor')],
    'Circle Scissor'
  );
}

function _createSphereScissor() {
  return _createToolButton(
    'SphereScissor',
    'notifications-warning',
    'Sphere Scissor',
    [..._createCommands('setToolActive', 'SphereScissor')],
    'Sphere Scissor'
  );
}

function _createPaintFill() {
  return _createToolButton(
    'PaintFill',
    'tool-paint-fill',
    'Paint Fill',
    [..._createCommands('setToolActive', 'PaintFill')],
    'Paint Fill'
  );
}

function _createFusionPTColormap() {
  return {
    id: 'fusionPTColormap',
    type: 'ohif.splitButton',
    props: {
      groupId: 'fusionPTColormap',
      primary: _createToolButton(
        'fusionPTColormap',
        'tool-fusion-color',
        'Fusion PT Colormap',
        [],
        'Fusion PT Colormap'
      ),
      secondary: {
        icon: 'chevron-down',
        label: 'PT Colormap',
        isActive: true,
        tooltip: 'PET Image Colormap',
      },
      isAction: true,
      renderer: WindowLevelMenuItem,
      items: [
        _createColormap('HSV', 'hsv'),
        _createColormap('Hot Iron', 'hot_iron'),
        _createColormap('S PET', 's_pet'),
        _createColormap('Red Hot', 'red_hot'),
        _createColormap('Perfusion', 'perfusion'),
        _createColormap('Rainbow', 'rainbow_2'),
        _createColormap('SUV', 'suv'),
        _createColormap('GE 256', 'ge_256'),
        _createColormap('GE', 'ge'),
        _createColormap('Siemens', 'siemens'),
      ],
    },
  };
}

function _createCrosshairsToolButton() {
  return {
    id: 'Crosshairs',
    type: 'ohif.radioGroup',
    props: {
      type: 'tool',
      icon: 'tool-crosshair',
      label: 'Crosshairs',
      commands: [..._createCommands('setToolActive', 'Crosshairs')],
    },
  };
}

function _createCineToolbarButton() {
  return {
    id: 'Cine',
    type: 'ohif.toggle',
    props: {
      type: 'toggle',
      icon: 'tool-cine',
      label: 'Cine',
      commands: [
        {
          commandName: 'toggleCine',
          context: 'CORNERSTONE',
        },
      ],
    },
  };
}

const toolbarButtons = [
  {
    id: 'MeasurementTools',
    type: 'ohif.splitButton',
    props: {
      groupId: 'MeasurementTools',
      isRadio: true,
      primary: _createLengthToolButton(),
      secondary: {
        icon: 'chevron-down',
        label: '',
        isActive: true,
        tooltip: 'More Measure Tools',
      },
      items: [
        _createLengthToolButton(),
        _createBidirectionalToolButton(),
        _createArrowAnnotateToolButton(),
        _createEllipticalROIToolButton(),
      ],
    },
  },
  _createZoomToolButton(),
  _createWindowLevelToolButton(),
  _createCrosshairsToolButton(),
  _createPanToolButton(),
  _createFusionPTColormap(),
  _createCineToolbarButton(),
  {
    id: 'SegmentationTools',
    type: 'ohif.splitButton',
    props: {
      groupId: 'SegmentationTools',
      isRadio: true,
      primary: _createCircularBrush(),
      secondary: {
        icon: 'chevron-down',
        label: '',
        isActive: true,
        tooltip: 'More Segmentation Tools',
      },
      items: [
        _createCircularBrush(),
        _createCircularEraser(),
        _createSphereBrush(),
        _createSphereEraser(),
        _createThresholdBrush(),
        _createRectangleROIStartEndThreshold(),
        _createRectangleROIThreshold(),
        _createRectangleScissor(),
        _createCircleScissor(),
        _createSphereScissor(),
        _createPaintFill(),
      ],
    },
  },
];

export default toolbarButtons;
