// TODO: torn, can either bake this here; or have to create a whole new button type
// Only ways that you can pass in a custom React component for render :l
import {
  // ExpandableToolbarButton,
  // ListMenu,
  WindowLevelMenuItem,
} from '@ohif/ui';
import { defaults } from '@ohif/core';

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

function _createLengthToolButton() {
  return _createToolButton(
    'Length',
    'tool-length',
    'Length',
    [
      {
        commandName: 'setToolActive',
        commandOptions: {
          toolName: 'Length',
        },
        context: 'CORNERSTONE',
      },
      {
        commandName: 'setToolActive',
        commandOptions: {
          toolName: 'SRLength',
          toolGroupId: 'SRToolGroup',
        },
        // we can use the setToolActive command for this from Cornerstone commandsModule
        context: 'CORNERSTONE',
      },
    ],
    'Length'
  );
}

function _createBidirectionalToolButton() {
  return _createToolButton(
    'Bidirectional',
    'tool-bidirectional',
    'Bidirectional',
    [
      {
        commandName: 'setToolActive',
        commandOptions: {
          toolName: 'Bidirectional',
        },
        context: 'CORNERSTONE',
      },
      {
        commandName: 'setToolActive',
        commandOptions: {
          toolName: 'SRBidirectional',
          toolGroupId: 'SRToolGroup',
        },
        context: 'CORNERSTONE',
      },
    ],
    'Bidirectional Tool'
  );
}

function _createArrowAnnotateToolButton() {
  return _createToolButton(
    'ArrowAnnotate',
    'tool-annotate',
    'Annotation',
    [
      {
        commandName: 'setToolActive',
        commandOptions: {
          toolName: 'ArrowAnnotate',
        },
        context: 'CORNERSTONE',
      },
      {
        commandName: 'setToolActive',
        commandOptions: {
          toolName: 'SRArrowAnnotate',
          toolGroupId: 'SRToolGroup',
        },
        context: 'CORNERSTONE',
      },
    ],
    'Arrow Annotate'
  );
}

function _createEllipticalROIToolButton() {
  return _createToolButton(
    'EllipticalROI',
    'tool-elipse',
    'Ellipse',
    [
      {
        commandName: 'setToolActive',
        commandOptions: {
          toolName: 'EllipticalROI',
        },
        context: 'CORNERSTONE',
      },
      {
        commandName: 'setToolActive',
        commandOptions: {
          toolName: 'SREllipticalROI',
          toolGroupId: 'SRToolGroup',
        },
        context: 'CORNERSTONE',
      },
    ],
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
      commands: [
        {
          commandName: 'setToolActive',
          commandOptions: {
            toolName: 'Zoom',
          },
          context: 'CORNERSTONE',
        },
      ],
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
    commands: [
      {
        commandName: 'setWindowLevel',
        commandOptions: {
          ...windowLevelPresets[preset],
        },
        context: 'CORNERSTONE',
      },
    ],
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
        [
          {
            commandName: 'setToolActive',
            commandOptions: {
              toolName: 'WindowLevel',
            },
            context: 'CORNERSTONE',
          },
        ],
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
      commands: [
        {
          commandName: 'setToolActive',
          commandOptions: {
            toolName: 'Pan',
          },
          context: 'CORNERSTONE',
        },
      ],
    },
  };
}

function _createCaptureToolButton() {
  return {
    id: 'Capture',
    type: 'ohif.action',
    props: {
      icon: 'tool-capture',
      label: 'Capture',
      type: 'action',
      commands: [
        {
          commandName: 'showDownloadViewportModal',
          commandOptions: {},
          context: 'CORNERSTONE',
        },
      ],
    },
  };
}

function _createLayoutToolbarButton() {
  return {
    id: 'Layout',
    type: 'ohif.layoutSelector',
    props: {
      rows: 3,
      columns: 3,
    },
  };
}

function _createMprToolButton() {
  return {
    id: 'MPR',
    type: 'ohif.action',
    props: {
      type: 'toggle',
      icon: 'icon-mpr',
      label: 'MPR',
      commands: [
        {
          commandName: 'toggleHangingProtocol',
          commandOptions: {
            protocolId: 'mpr',
          },
          context: 'DEFAULT',
        },
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
      commands: [
        {
          commandName: 'setToolActive',
          commandOptions: {
            toolName: 'Crosshairs',
            toolGroupId: 'dynamic4D-default',
          },
          context: 'CORNERSTONE',
        },
      ],
    },
  };
}

function _createResetToolbarButton() {
  return _createActionButton(
    'Reset',
    'tool-reset',
    'Reset View',
    [
      {
        commandName: 'resetViewport',
        commandOptions: {},
        context: 'CORNERSTONE',
      },
    ],
    'Reset'
  );
}

function _createRotateRightToolbarButton() {
  return _createActionButton(
    'rotate-right',
    'tool-rotate-right',
    'Rotate Right',
    [
      {
        commandName: 'rotateViewportCW',
        commandOptions: {},
        context: 'CORNERSTONE',
      },
    ],
    'Rotate +90'
  );
}

function _createFlipHorizontalToolbarButton() {
  return _createActionButton(
    'flip-horizontal',
    'tool-flip-horizontal',
    'Flip Horizontally',
    [
      {
        commandName: 'flipViewportHorizontal',
        commandOptions: {},
        context: 'CORNERSTONE',
      },
    ],
    'Flip Horizontal'
  );
}

function _createStackImageSyncToolbarButton() {
  return _createToggleButton('StackImageSync', 'link', 'Stack Image Sync', [
    {
      commandName: 'toggleStackImageSync',
      commandOptions: {},
      context: 'CORNERSTONE',
    },
  ]);
}

function _createReferenceLineToolbarButton() {
  return _createToggleButton(
    'ReferenceLines',
    'tool-referenceLines', // change this with the new icon
    'Reference Lines',
    [
      {
        commandName: 'toggleReferenceLines',
        commandOptions: {},
        context: 'CORNERSTONE',
      },
    ]
  );
}

function _createStackScrollToolbarButton() {
  return _createToolButton(
    'StackScroll',
    'tool-stack-scroll',
    'Stack Scroll',
    [
      {
        commandName: 'setToolActive',
        commandOptions: {
          toolName: 'StackScroll',
        },
        context: 'CORNERSTONE',
      },
    ],
    'Stack Scroll'
  );
}

function _createInvertToolbarButton() {
  return _createActionButton(
    'invert',
    'tool-invert',
    'Invert',
    [
      {
        commandName: 'invertViewport',
        commandOptions: {},
        context: 'CORNERSTONE',
      },
    ],
    'Invert Colors'
  );
}

function _createProbeToolbarButton() {
  return _createToolButton(
    'Probe',
    'tool-probe',
    'Probe',
    [
      {
        commandName: 'setToolActive',
        commandOptions: {
          toolName: 'DragProbe',
        },
        context: 'CORNERSTONE',
      },
    ],
    'Probe'
  );
}

function _createCineToolbarButton() {
  return _createToggleButton(
    'cine',
    'tool-cine',
    'Cine',
    [
      {
        commandName: 'toggleCine',
        context: 'CORNERSTONE',
      },
    ],
    'Cine'
  );
}

function _createAngleToolbarButton() {
  return _createToolButton(
    'Angle',
    'tool-angle',
    'Angle',
    [
      {
        commandName: 'setToolActive',
        commandOptions: {
          toolName: 'Angle',
        },
        context: 'CORNERSTONE',
      },
    ],
    'Angle'
  );
}

function _createCobbAngleToolbarButton() {
  return _createToolButton(
    'Cobb Angle',
    'tool-cobb-angle',
    'Cobb Angle',
    [
      {
        commandName: 'setToolActive',
        commandOptions: {
          toolName: 'CobbAngle',
        },
        context: 'CORNERSTONE',
      },
    ],
    'Cobb Angle'
  );
}

function _createPlanarFreehandROIToolbarButton() {
  return _createToolButton(
    'Planar Freehand ROI',
    'tool-freehand',
    'PlanarFreehandROI',
    [
      {
        commandName: 'setToolActive',
        commandOptions: {
          toolName: 'PlanarFreehandROI',
        },
        context: 'CORNERSTONE',
      },
    ],
    'Planar Freehand ROI'
  );
}

function _createMagnifyToolbarButton() {
  return _createToolButton(
    'Magnify',
    'tool-magnify',
    'Magnify',
    [
      {
        commandName: 'setToolActive',
        commandOptions: {
          toolName: 'Magnify',
        },
        context: 'CORNERSTONE',
      },
    ],
    'Magnify'
  );
}

function _createRectangleToolbarButton() {
  return _createToolButton(
    'Rectangle',
    'tool-rectangle',
    'Rectangle',
    [
      {
        commandName: 'setToolActive',
        commandOptions: {
          toolName: 'RectangleROI',
        },
        context: 'CORNERSTONE',
      },
    ],
    'Rectangle'
  );
}

function _createCalibrationLineToolbarButton() {
  return _createToolButton(
    'CalibrationLine',
    'tool-calibration',
    'Calibration',
    [
      {
        commandName: 'setToolActive',
        commandOptions: {
          toolName: 'CalibrationLine',
        },
        context: 'CORNERSTONE',
      },
    ],
    'Calibration Line'
  );
}

function _createTagBrowserToolbarButton() {
  return _createActionButton(
    'TagBrowser',
    'list-bullets',
    'Dicom Tag Browser',
    [
      {
        commandName: 'openDICOMTagViewer',
        commandOptions: {},
        context: 'DEFAULT',
      },
    ],
    'Dicom Tag Browser'
  );
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
  _createPanToolButton(),
  _createCaptureToolButton(),
  // _createLayoutToolbarButton(),
  // _createMprToolButton(),
  _createCrosshairsToolButton(),
  {
    id: 'MoreTools',
    type: 'ohif.splitButton',
    props: {
      isRadio: true,
      groupId: 'MoreTools',
      primary: _createResetToolbarButton(),
      secondary: {
        icon: 'chevron-down',
        label: '',
        isActive: true,
        tooltip: 'More Tools',
      },
      items: [
        _createResetToolbarButton(),
        _createRotateRightToolbarButton(),
        _createFlipHorizontalToolbarButton(),
        _createStackImageSyncToolbarButton(),
        _createReferenceLineToolbarButton(),
        _createStackScrollToolbarButton(),
        _createInvertToolbarButton(),
        _createProbeToolbarButton(),
        _createCineToolbarButton(),
        _createAngleToolbarButton(),

        // Next two tools can be added once icons are added
        // _createCobbAngleToolbarButton(),
        // _createPlanarFreehandROIToolbarButton(),

        _createMagnifyToolbarButton(),
        _createRectangleToolbarButton(),
        _createCalibrationLineToolbarButton(),
        _createTagBrowserToolbarButton(),
      ],
    },
  },
];

export default toolbarButtons;
