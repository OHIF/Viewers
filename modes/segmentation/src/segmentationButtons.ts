import type { Button } from '@ohif/core/types';

function _createSetToolActiveCommands(toolName) {
  return [
    {
      commandName: 'setToolActive',
      commandOptions: {
        toolName,
      },
    },
  ];
}

const toolbarButtons: Button[] = [
  {
    id: 'BrushTools',
    uiType: 'ohif.buttonGroup',
    props: {
      groupId: 'BrushTools',
      items: [
        {
          id: 'Brush',
          icon: 'icon-tool-brush',
          label: 'Brush',
          evaluate: {
            name: 'evaluate.cornerstone.segmentation',
            toolNames: ['CircularBrush', 'SphereBrush'],
            disabledText: 'Create new segmentation to enable this tool.',
          },
          commands: _createSetToolActiveCommands('CircularBrush'),
          options: [
            {
              name: 'Radius (mm)',
              id: 'brush-radius',
              type: 'range',
              min: 0.5,
              max: 99.5,
              step: 0.5,
              value: 25,
              commands: {
                commandName: 'setBrushSize',
                commandOptions: { toolNames: ['CircularBrush', 'SphereBrush'] },
              },
            },
            {
              name: 'Shape',
              type: 'radio',
              id: 'brush-mode',
              value: 'CircularBrush',
              values: [
                { value: 'CircularBrush', label: 'Circle' },
                { value: 'SphereBrush', label: 'Sphere' },
              ],
              commands: 'setToolActiveToolbar',
            },
          ],
        },
        {
          id: 'Eraser',
          icon: 'icon-tool-eraser',
          label: 'Eraser',
          evaluate: {
            name: 'evaluate.cornerstone.segmentation',
            toolNames: ['CircularEraser', 'SphereEraser'],
          },
          commands: _createSetToolActiveCommands('CircularEraser'),
          options: [
            {
              name: 'Radius (mm)',
              id: 'eraser-radius',
              type: 'range',
              min: 0.5,
              max: 99.5,
              step: 0.5,
              value: 25,
              commands: {
                commandName: 'setBrushSize',
                commandOptions: { toolNames: ['CircularEraser', 'SphereEraser'] },
              },
            },
            {
              name: 'Shape',
              type: 'radio',
              id: 'eraser-mode',
              value: 'CircularEraser',
              values: [
                { value: 'CircularEraser', label: 'Circle' },
                { value: 'SphereEraser', label: 'Sphere' },
              ],
              commands: 'setToolActiveToolbar',
            },
          ],
        },
        {
          id: 'Threshold',
          icon: 'icon-tool-threshold',
          label: 'Threshold Tool',
          evaluate: {
            name: 'evaluate.cornerstone.segmentation',
            toolNames: ['ThresholdCircularBrush', 'ThresholdSphereBrush'],
          },
          commands: _createSetToolActiveCommands('ThresholdCircularBrush'),
          options: [
            {
              name: 'Radius (mm)',
              id: 'threshold-radius',
              type: 'range',
              min: 0.5,
              max: 99.5,
              step: 0.5,
              value: 25,
              commands: {
                commandName: 'setBrushSize',
                commandOptions: {
                  toolNames: [
                    'ThresholdCircularBrush',
                    'ThresholdSphereBrush',
                    'ThresholdCircularBrushDynamic',
                  ],
                },
              },
            },
            {
              name: 'Shape',
              type: 'radio',
              id: 'eraser-mode',
              value: 'ThresholdCircularBrush',
              values: [
                { value: 'ThresholdCircularBrush', label: 'Circle' },
                { value: 'ThresholdSphereBrush', label: 'Sphere' },
              ],
              commands: 'setToolActiveToolbar',
            },
            {
              name: 'Threshold',
              type: 'radio',
              id: 'dynamic-mode',
              value: 'ThresholdRange',
              values: [
                { value: 'ThresholdDynamic', label: 'Dynamic' },
                { value: 'ThresholdRange', label: 'Range' },
              ],
              commands: ({ value, commandsManager }) => {
                if (value === 'ThresholdDynamic') {
                  commandsManager.run('setToolActive', {
                    toolName: 'ThresholdCircularBrushDynamic',
                  });
                } else {
                  commandsManager.run('setToolActive', {
                    toolName: 'ThresholdCircularBrush',
                  });
                }
              },
            },
            {
              name: 'ThresholdRange',
              type: 'double-range',
              id: 'threshold-range',
              min: -1000,
              max: 1000,
              step: 1,
              values: [100, 600],
              condition: ({ options }) =>
                options.find(option => option.id === 'dynamic-mode').value === 'ThresholdRange',
              commands: {
                commandName: 'setThresholdRange',
                commandOptions: {
                  toolNames: ['ThresholdCircularBrush', 'ThresholdSphereBrush'],
                },
              },
            },
          ],
        },
      ],
    },
  },
  {
    id: 'Shapes',
    uiType: 'ohif.radioGroup',
    props: {
      label: 'Shapes',
      evaluate: {
        name: 'evaluate.cornerstone.segmentation',
        toolNames: ['CircleScissor', 'SphereScissor', 'RectangleScissor'],
      },
      icon: 'icon-tool-shape',
      commands: _createSetToolActiveCommands('CircleScissor'),
      options: [
        {
          name: 'Shape',
          type: 'radio',
          value: 'CircleScissor',
          id: 'shape-mode',
          values: [
            { value: 'CircleScissor', label: 'Circle' },
            { value: 'SphereScissor', label: 'Sphere' },
            { value: 'RectangleScissor', label: 'Rectangle' },
          ],
          commands: 'setToolActiveToolbar',
        },
      ],
    },
  },
];

export default toolbarButtons;
