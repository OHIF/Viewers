// TODO: torn, can either bake this here; or have to create a whole new button type
// Only ways that you can pass in a custom React component for render :l
import { WindowLevelMenuItem } from '@ohif/ui';
import { defaults } from '@ohif/core';
import { toolGroupIds } from './initToolGroups';
const { windowLevelPresets } = defaults;
/**
 *
 * @param {*} type - 'tool' | 'action' | 'toggle'
 * @param {*} id
 * @param {*} icon
 * @param {*} label
 */
function _createButton(type, id, icon, label, commands, tooltip) {
  return {
    id,
    icon,
    label,
    type,
    commands,
    tooltip,
  };
}

function _createColormap(label, colormap) {
  return {
    id: label,
    label,
    type: 'action',
    commands: [
      {
        commandName: 'setFusionPTColormap',
        commandOptions: {
          toolGroupId: toolGroupIds.Fusion,
          colormap,
        },
      },
    ],
  };
}

const _createActionButton = _createButton.bind(null, 'action');
const _createToggleButton = _createButton.bind(null, 'toggle');
const _createToolButton = _createButton.bind(null, 'tool');

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

function _createCommands(commandName, toolName, toolGroupIds) {
  return toolGroupIds.map(toolGroupId => ({
    /* It's a command that is being run when the button is clicked. */
    commandName,
    commandOptions: {
      toolName,
      toolGroupId,
    },
    context: 'CORNERSTONE',
  }));
}

const toolbarButtons = [
  // Measurement
  {
    id: 'MeasurementTools',
    type: 'ohif.splitButton',
    props: {
      groupId: 'MeasurementTools',
      isRadio: true, // ?
      // Switch?
      primary: _createToolButton(
        'Length',
        'tool-length',
        'Length',
        [
          ..._createCommands('setToolActive', 'Length', [
            toolGroupIds.CT,
            toolGroupIds.PT,
            toolGroupIds.Fusion,
            // toolGroupIds.MPR,
          ]),
        ],
        'Length'
      ),
      secondary: {
        icon: 'chevron-down',
        label: '',
        isActive: true,
        tooltip: 'More Measure Tools',
      },
      items: [
        _createToolButton(
          'Length',
          'tool-length',
          'Length',
          [
            ..._createCommands('setToolActive', 'Length', [
              toolGroupIds.CT,
              toolGroupIds.PT,
              toolGroupIds.Fusion,
              // toolGroupIds.MPR,
            ]),
          ],
          'Length Tool'
        ),
        _createToolButton(
          'Bidirectional',
          'tool-bidirectional',
          'Bidirectional',
          [
            ..._createCommands('setToolActive', 'Bidirectional', [
              toolGroupIds.CT,
              toolGroupIds.PT,
              toolGroupIds.Fusion,
              // toolGroupIds.MPR,
            ]),
          ],
          'Bidirectional Tool'
        ),
        _createToolButton(
          'ArrowAnnotate',
          'tool-annotate',
          'Annotation',
          [
            ..._createCommands('setToolActive', 'ArrowAnnotate', [
              toolGroupIds.CT,
              toolGroupIds.PT,
              toolGroupIds.Fusion,
              // toolGroupIds.MPR,
            ]),
          ],
          'Arrow Annotate'
        ),
        _createToolButton(
          'EllipticalROI',
          'tool-elipse',
          'Ellipse',
          [
            ..._createCommands('setToolActive', 'EllipticalROI', [
              toolGroupIds.CT,
              toolGroupIds.PT,
              toolGroupIds.Fusion,
              // toolGroupIds.MPR,
            ]),
          ],
          'Ellipse Tool'
        ),
      ],
    },
  },
  // Zoom..
  {
    id: 'Zoom',
    type: 'ohif.radioGroup',
    props: {
      type: 'tool',
      icon: 'tool-zoom',
      label: 'Zoom',
      commands: [
        ..._createCommands('setToolActive', 'Zoom', [
          toolGroupIds.CT,
          toolGroupIds.PT,
          toolGroupIds.Fusion,
          // toolGroupIds.MPR,
        ]),
      ],
    },
  },
  {
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
  },
  // Window Level + Presets...
  {
    id: 'WindowLevel',
    type: 'ohif.splitButton',
    props: {
      groupId: 'WindowLevel',
      primary: _createToolButton(
        'WindowLevel',
        'tool-window-level',
        'Window Level',
        [
          ..._createCommands('setToolActive', 'WindowLevel', [
            toolGroupIds.CT,
            toolGroupIds.PT,
            toolGroupIds.Fusion,
            // toolGroupIds.MPR,
          ]),
        ],
        'Window Level'
      ),
      secondary: {
        icon: 'chevron-down',
        label: 'W/L Manual',
        isActive: true,
        tooltip: 'W/L Presets',
      },
      isAction: true, // ?
      renderer: WindowLevelMenuItem,
      items: [
        _createWwwcPreset(1, 'Soft tissue', '400 / 40'),
        _createWwwcPreset(2, 'Lung', '1500 / -600'),
        _createWwwcPreset(3, 'Liver', '150 / 90'),
        _createWwwcPreset(4, 'Bone', '2500 / 480'),
        _createWwwcPreset(5, 'Brain', '80 / 40'),
      ],
    },
  },
  {
    id: 'Crosshairs',
    type: 'ohif.radioGroup',
    props: {
      type: 'tool',
      icon: 'tool-crosshair',
      label: 'Crosshairs',
      commands: [
        ..._createCommands('setToolActive', 'Crosshairs', [
          toolGroupIds.CT,
          toolGroupIds.PT,
          toolGroupIds.Fusion,
          // toolGroupIds.MPR,
        ]),
      ],
    },
  },
  // Pan...
  {
    id: 'Pan',
    type: 'ohif.radioGroup',
    props: {
      type: 'tool',
      icon: 'tool-move',
      label: 'Pan',
      commands: [
        ..._createCommands('setToolActive', 'Pan', [
          toolGroupIds.CT,
          toolGroupIds.PT,
          toolGroupIds.Fusion,
          // toolGroupIds.MPR,
        ]),
      ],
    },
  },
  {
    id: 'RectangleROIStartEndThreshold',
    type: 'ohif.radioGroup',
    props: {
      type: 'tool',
      icon: 'tool-create-threshold',
      label: 'Rectangle ROI Threshold',
      commands: [
        ..._createCommands('setToolActive', 'RectangleROIStartEndThreshold', [toolGroupIds.PT]),
        {
          commandName: 'displayNotification',
          commandOptions: {
            title: 'RectangleROI Threshold Tip',
            text: 'RectangleROI Threshold tool should be used on PT Axial Viewport',
            type: 'info',
          },
        },
        {
          commandName: 'setViewportActive',
          commandOptions: {
            viewportId: 'ptAXIAL',
          },
        },
      ],
    },
  },
  {
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
      isAction: true, // ?
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
  },
];

export default toolbarButtons;
