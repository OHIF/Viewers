// TODO: torn, can either bake this here; or have to create a whole new button type
// Only ways that you can pass in a custom React component for render :l
import {
  // ExpandableToolbarButton,
  // ListMenu,
  WindowLevelMenuItem,
} from '@ohif/ui';
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
          windowLevel: windowLevelPresets[preset],
        },
        context: 'CORNERSTONE3D',
      },
    ],
  };
}

function _createSetToolActive(toolName, toolGroupIds) {
  return toolGroupIds.map(toolGroupId => ({
    commandName: 'setToolActive',
    commandOptions: {
      toolName,
      toolGroupId,
    },
    context: 'CORNERSTONE3D',
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
          ..._createSetToolActive('Length', [
            toolGroupIds.CT,
            toolGroupIds.PT,
            toolGroupIds.Fusion,
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
            ..._createSetToolActive('Length', [
              toolGroupIds.CT,
              toolGroupIds.PT,
              toolGroupIds.Fusion,
            ]),
          ],
          'Length Tool'
        ),
        _createToolButton(
          'Bidirectional',
          'tool-bidirectional',
          'Bidirectional',
          [
            ..._createSetToolActive('Bidirectional', [
              toolGroupIds.CT,
              toolGroupIds.PT,
              toolGroupIds.Fusion,
            ]),
          ],
          'Bidirectional Tool'
        ),
        _createToolButton(
          'ArrowAnnotate',
          'tool-annotate',
          'Annotation',
          [
            ..._createSetToolActive('ArrowAnnotate', [
              toolGroupIds.CT,
              toolGroupIds.PT,
              toolGroupIds.Fusion,
            ]),
          ],
          'Arrow Annotate'
        ),
        _createToolButton(
          'EllipticalROI',
          'tool-elipse',
          'Ellipse',
          [
            ..._createSetToolActive('EllipticalROI', [
              toolGroupIds.CT,
              toolGroupIds.PT,
              toolGroupIds.Fusion,
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
        ..._createSetToolActive('Zoom', [
          toolGroupIds.CT,
          toolGroupIds.PT,
          toolGroupIds.Fusion,
        ]),
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
          ..._createSetToolActive('WindowLevel', [
            toolGroupIds.CT,
            toolGroupIds.PT,
            toolGroupIds.Fusion,
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
        _createWwwcPreset(4, 'Bone', '80 / 40'),
        _createWwwcPreset(5, 'Brain', '2500 / 480'),
      ],
    },
  },
  {
    id: 'Crosshairs',
    type: 'ohif.radioGroup',
    props: {
      type: 'toggle',
      icon: 'tool-crosshair',
      label: 'Crosshairs',
      commands: {
        // commands that run for toggle state change
        defaultCommands: _createSetToolActive('Crosshairs', [
          toolGroupIds.CT,
          toolGroupIds.PT,
          toolGroupIds.Fusion,
        ]),
        // optional disableCommands that if defined will run instead of the
        // commands specified when the toggle state change to be disabled (inactive, false)
        // By default (if disableCommands is not defined) the commands specified above
        // will run for both the active and inactive states
        disableCommands: [
          {
            commandName: 'disableCrosshairs',
            commandOptions: {
              toolName: 'Crosshairs',
              toolGroupId: toolGroupIds.CT,
            },
            context: 'CORNERSTONE3D',
          },
          {
            commandName: 'disableCrosshairs',
            commandOptions: {
              toolName: 'Crosshairs',
              toolGroupId: toolGroupIds.PT,
            },
            context: 'CORNERSTONE3D',
          },
          {
            commandName: 'disableCrosshairs',
            commandOptions: {
              toolName: 'Crosshairs',
              toolGroupId: toolGroupIds.Fusion,
            },
            context: 'CORNERSTONE3D',
          },
        ],
      },
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
        ..._createSetToolActive('Pan', [
          toolGroupIds.CT,
          toolGroupIds.PT,
          toolGroupIds.Fusion,
        ]),
      ],
    },
  },
  // {
  //   id: 'Capture',
  //   type: 'ohif.action',
  //   props: {
  //     icon: 'tool-capture',
  //     label: 'Capture',
  //     type: 'action',
  //     commands: [
  //       {
  //         commandName: 'showDownloadViewportModal',
  //         commandOptions: {},
  //         context: 'CORNERSTONE3D',
  //       },
  //     ],
  //   },
  // },
  {
    id: 'Layout',
    type: 'ohif.layoutSelector',
  },
  // More...
  {
    id: 'MoreTools',
    type: 'ohif.splitButton',
    props: {
      isRadio: true, // ?
      groupId: 'MoreTools',
      primary: _createActionButton(
        'Reset',
        'tool-reset',
        'Reset View',
        [
          {
            commandName: 'resetViewport',
            commandOptions: {},
            context: 'CORNERSTONE3D',
          },
        ],
        'Reset'
      ),
      secondary: {
        icon: 'chevron-down',
        label: '',
        isActive: true,
        tooltip: 'More Tools',
      },
      items: [
        _createActionButton(
          'Reset',
          'tool-reset',
          'Reset View',
          [
            {
              commandName: 'resetViewport',
              commandOptions: {},
              context: 'CORNERSTONE3D',
            },
          ],
          'Reset'
        ),
        _createActionButton(
          'rotate-right',
          'tool-rotate-right',
          'Rotate Right',
          [
            {
              commandName: 'rotateViewportCW',
              commandOptions: {},
              context: 'CORNERSTONE3D',
            },
          ],
          'Rotate +90'
        ),
        _createActionButton(
          'flip-horizontal',
          'tool-flip-horizontal',
          'Flip Horizontally',
          [
            {
              commandName: 'flipViewportHorizontal',
              commandOptions: {},
              context: 'CORNERSTONE3D',
            },
          ],
          'Flip Horizontal'
        ),
        _createToolButton(
          'StackScroll',
          'tool-stack-scroll',
          'Stack Scroll',
          [
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: 'StackScroll',
              },
              context: 'CORNERSTONE3D',
            },
          ],
          'Stack Scroll'
        ),
        // _createActionButton(
        //   'invert',
        //   'tool-invert',
        //   'Invert',
        //   [
        //     {
        //       commandName: 'invertViewport',
        //       commandOptions: {},
        //       context: 'CORNERSTONE3D',
        //     },
        //   ],
        //   'Invert Colors'
        // ),
        _createToolButton(
          'Probe',
          'tool-probe',
          'Probe',
          [
            ..._createSetToolActive('DragProbe', [
              toolGroupIds.CT,
              toolGroupIds.PT,
              toolGroupIds.Fusion,
            ]),
          ],
          'Probe'
        ),
        // _createToggleButton(
        //   'cine',
        //   'tool-cine',
        //   'Cine',
        //   [
        //     {
        //       commandName: 'toggleCine',
        //       context: 'CORNERSTONE3D',
        //     },
        //   ],
        //   'Cine'
        // ),
        // _createToolButton(
        //   'Angle',
        //   'tool-angle',
        //   'Angle',
        //   [
        //     {
        //       commandName: 'setToolActive',
        //       commandOptions: {
        //         toolName: 'Angle',
        //       },
        //       context: 'CORNERSTONE3D',
        //     },
        //   ],
        //   'Angle'
        // ),
        // _createToolButton(
        //   'Magnify',
        //   'tool-magnify',
        //   'Magnify',
        //   [
        //     {
        //       commandName: 'setToolActive',
        //       commandOptions: {
        //         toolName: 'Magnify',
        //       },
        //       context: 'CORNERSTONE3D',
        //     },
        //   ],
        //   'Magnify'
        // ),
        // _createToolButton(
        //   'Rectangle',
        //   'tool-rectangle',
        //   'Rectangle',
        //   [
        //     {
        //       commandName: 'setToolActive',
        //       commandOptions: {
        //         toolName: 'RectangleROI',
        //       },
        //       context: 'CORNERSTONE3D',
        //     },
        //   ],
        //   'Rectangle'
        // ),
      ],
    },
  },
];

export default toolbarButtons;
