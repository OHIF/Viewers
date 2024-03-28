// TODO: torn, can either bake this here; or have to create a whole new button type
// Only ways that you can pass in a custom React component for render :
import { toolGroupIds } from './initToolGroups';
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
  // Window Level
  {
    id: 'WindowLevel',
    type: 'ohif.radioGroup',
    props: {
      type: 'tool',
      icon: 'tool-window-level',
      label: 'Window Level',
      commands: [
        ..._createCommands('setToolActive', 'WindowLevel', [
          toolGroupIds.CT,
          toolGroupIds.PT,
          toolGroupIds.Fusion,
        ]),
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
];

export default toolbarButtons;
