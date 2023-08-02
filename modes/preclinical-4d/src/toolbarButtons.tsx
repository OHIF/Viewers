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

  return _createCommands(
    'setWindowLevel',
    undefined,
    undefined,
    commandOptions
  );
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
    'notifications-warning',
    'Circular Brush',
    [..._createCommands('setToolActive', 'CircularBrush')],
    'Circular Brush'
  );
}

function _createCircularEraser() {
  return _createToolButton(
    'CircularEraser',
    'notifications-warning',
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
        toolGroupIds.PT,
      ]),
      {
        commandName: 'displayNotification',
        commandOptions: {
          title: 'RectangleROI Threshold Tip',
          text:
            'RectangleROI Threshold tool should be used on PT Axial Viewport',
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
    'notifications-warning',
    'Rectangle Scissor',
    [..._createCommands('setToolActive', 'RectangleScissor')],
    'Rectangle Scissor'
  );
}

function _createCircleScissor() {
  return _createToolButton(
    'CircleScissor',
    'notifications-warning',
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
    'notifications-warning',
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

// function _createCaptureToolButton() {
//   return {
//     id: 'Capture',
//     type: 'ohif.action',
//     props: {
//       icon: 'tool-capture',
//       label: 'Capture',
//       type: 'action',
//       commands: [
//         {
//           commandName: 'showDownloadViewportModal',
//           commandOptions: {},
//           context: 'CORNERSTONE',
//         },
//       ],
//     },
//   };
// }

// function _createLayoutToolbarButton() {
//   return {
//     id: 'Layout',
//     type: 'ohif.layoutSelector',
//     props: {
//       rows: 3,
//       columns: 3,
//     },
//   };
// }

// function _createMprToolButton() {
//   return {
//     id: 'MPR',
//     type: 'ohif.action',
//     props: {
//       type: 'toggle',
//       icon: 'icon-mpr',
//       label: 'MPR',
//       commands: [
//         {
//           commandName: 'toggleHangingProtocol',
//           commandOptions: {
//             protocolId: 'mpr',
//           },
//           context: 'DEFAULT',
//         },
//       ],
//     },
//   };
// }

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

// function _createResetToolbarButton() {
//   return _createActionButton(
//     'Reset',
//     'tool-reset',
//     'Reset View',
//     [
//       {
//         commandName: 'resetViewport',
//         commandOptions: {},
//         context: 'CORNERSTONE',
//       },
//     ],
//     'Reset'
//   );
// }

// function _createRotateRightToolbarButton() {
//   return _createActionButton(
//     'rotate-right',
//     'tool-rotate-right',
//     'Rotate Right',
//     [
//       {
//         commandName: 'rotateViewportCW',
//         commandOptions: {},
//         context: 'CORNERSTONE',
//       },
//     ],
//     'Rotate +90'
//   );
// }

// function _createFlipHorizontalToolbarButton() {
//   return _createActionButton(
//     'flip-horizontal',
//     'tool-flip-horizontal',
//     'Flip Horizontally',
//     [
//       {
//         commandName: 'flipViewportHorizontal',
//         commandOptions: {},
//         context: 'CORNERSTONE',
//       },
//     ],
//     'Flip Horizontal'
//   );
// }

// function _createStackImageSyncToolbarButton() {
//   return _createToggleButton('StackImageSync', 'link', 'Stack Image Sync', [
//     {
//       commandName: 'toggleStackImageSync',
//       commandOptions: {},
//       context: 'CORNERSTONE',
//     },
//   ]);
// }

// function _createReferenceLineToolbarButton() {
//   return _createToggleButton(
//     'ReferenceLines',
//     'tool-referenceLines', // change this with the new icon
//     'Reference Lines',
//     [
//       {
//         commandName: 'toggleReferenceLines',
//         commandOptions: {},
//         context: 'CORNERSTONE',
//       },
//     ]
//   );
// }

// function _createStackScrollToolbarButton() {
//   return _createToolButton(
//     'StackScroll',
//     'tool-stack-scroll',
//     'Stack Scroll',
//     [..._createCommands('setToolActive', 'StackScroll')],
//     'Stack Scroll'
//   );
// }

// function _createInvertToolbarButton() {
//   return _createActionButton(
//     'invert',
//     'tool-invert',
//     'Invert',
//     [
//       {
//         commandName: 'invertViewport',
//         commandOptions: {},
//         context: 'CORNERSTONE',
//       },
//     ],
//     'Invert Colors'
//   );
// }

// function _createProbeToolbarButton() {
//   return _createToolButton(
//     'Probe',
//     'tool-probe',
//     'Probe',
//     [..._createCommands('setToolActive', 'DragProbe')],
//     'Probe'
//   );
// }

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

// function _createAngleToolbarButton() {
//   return _createToolButton(
//     'Angle',
//     'tool-angle',
//     'Angle',
//     [..._createCommands('setToolActive', 'Angle')],
//     'Angle'
//   );
// }

// function _createCobbAngleToolbarButton() {
//   return _createToolButton(
//     'Cobb Angle',
//     'tool-cobb-angle',
//     'Cobb Angle',
//     [..._createCommands('setToolActive', 'CobbAngle')],
//     'Cobb Angle'
//   );
// }

// function _createPlanarFreehandROIToolbarButton() {
//   return _createToolButton(
//     'Planar Freehand ROI',
//     'tool-freehand',
//     'PlanarFreehandROI',
//     [..._createCommands('setToolActive', 'PlanarFreehandROI')],
//     'Planar Freehand ROI'
//   );
// }

// function _createMagnifyToolbarButton() {
//   return _createToolButton(
//     'Magnify',
//     'tool-magnify',
//     'Magnify',
//     [..._createCommands('setToolActive', 'Magnify')],
//     'Magnify'
//   );
// }

// function _createRectangleToolbarButton() {
//   return _createToolButton(
//     'Rectangle',
//     'tool-rectangle',
//     'Rectangle',
//     [..._createCommands('setToolActive', 'RectangleROI')],
//     'Rectangle'
//   );
// }

// function _createCalibrationLineToolbarButton() {
//   return _createToolButton(
//     'CalibrationLine',
//     'tool-calibration',
//     'Calibration',
//     [..._createCommands('setToolActive', 'CalibrationLine')],
//     'Calibration Line'
//   );
// }

// function _createTagBrowserToolbarButton() {
//   return _createActionButton(
//     'TagBrowser',
//     'list-bullets',
//     'Dicom Tag Browser',
//     [
//       {
//         commandName: 'openDICOMTagViewer',
//         commandOptions: {},
//         context: 'DEFAULT',
//       },
//     ],
//     'Dicom Tag Browser'
//   );
// }

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

  // _createCaptureToolButton(),
  // _createLayoutToolbarButton(),
  // _createMprToolButton(),
  // {
  //   id: 'MoreTools',
  //   type: 'ohif.splitButton',
  //   props: {
  //     isRadio: true,
  //     groupId: 'MoreTools',
  //     primary: _createResetToolbarButton(),
  //     secondary: {
  //       icon: 'chevron-down',
  //       label: '',
  //       isActive: true,
  //       tooltip: 'More Tools',
  //     },
  //     items: [
  //       _createResetToolbarButton(),
  //       _createRotateRightToolbarButton(),
  //       _createFlipHorizontalToolbarButton(),
  //       _createStackImageSyncToolbarButton(),
  //       _createReferenceLineToolbarButton(),
  //       _createStackScrollToolbarButton(),
  //       _createInvertToolbarButton(),
  //       _createProbeToolbarButton(),
  //       _createCineToolbarButton(),
  //       _createAngleToolbarButton(),

  //       // Next two tools can be added once icons are added
  //       // _createCobbAngleToolbarButton(),
  //       // _createPlanarFreehandROIToolbarButton(),

  //       _createMagnifyToolbarButton(),
  //       _createRectangleToolbarButton(),
  //       _createCalibrationLineToolbarButton(),
  //       _createTagBrowserToolbarButton(),
  //     ],
  //   },
  // },
];

export default toolbarButtons;
