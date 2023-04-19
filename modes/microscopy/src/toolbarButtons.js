// TODO: torn, can either bake this here; or have to create a whole new button type
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
        'line',
        'tool-length',
        'Line',
        [
          {
            commandName: 'setToolActive',
            commandOptions: {
              toolName: 'line',
            },
            context: 'MICROSCOPY',
          },
        ],
        'Line'
      ),
      secondary: {
        icon: 'chevron-down',
        label: '',
        isActive: true,
        tooltip: 'More Measure Tools',
      },
      items: [
        _createToolButton(
          'line',
          'tool-length',
          'Line',
          [
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: 'line',
              },
              context: 'MICROSCOPY',
            },
          ],
          'Line Tool'
        ),
        _createToolButton(
          'point',
          'tool-point',
          'Point',
          [
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: 'point',
              },
              context: 'MICROSCOPY',
            },
          ],
          'Point Tool'
        ),
        _createToolButton(
          'polygon',
          'tool-polygon',
          'Polygon',
          [
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: 'polygon',
              },
              context: 'MICROSCOPY',
            },
          ],
          'Polygon Tool'
        ),
        _createToolButton(
          'circle',
          'tool-circle',
          'Circle',
          [
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: 'circle',
              },
              context: 'MICROSCOPY',
            },
          ],
          'Circle Tool'
        ),
        _createToolButton(
          'box',
          'tool-rectangle',
          'Box',
          [
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: 'box',
              },
              context: 'MICROSCOPY',
            },
          ],
          'Box Tool'
        ),
        _createToolButton(
          'freehandpolygon',
          'tool-freehand-polygon',
          'Freehand Polygon',
          [
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: 'freehandpolygon',
              },
              context: 'MICROSCOPY',
            },
          ],
          'Freehand Polygon Tool'
        ),
        _createToolButton(
          'freehandline',
          'tool-freehand-line',
          'Freehand Line',
          [
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: 'freehandline',
              },
              context: 'MICROSCOPY',
            },
          ],
          'Freehand Line Tool'
        ),
      ],
    },
  },
  // Pan...
  {
    id: 'dragPan',
    type: 'ohif.radioGroup',
    props: {
      type: 'tool',
      icon: 'tool-move',
      label: 'Pan',
      commands: [
        {
          commandName: 'setToolActive',
          commandOptions: {
            toolName: 'dragPan',
          },
          context: 'MICROSCOPY',
        },
      ],
    },
  },
];

export default toolbarButtons;
