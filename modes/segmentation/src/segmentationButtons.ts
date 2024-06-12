import type { Button } from '@ohif/core/types';

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
              name: 'Threshold',
              type: 'radio',
              id: 'dynamic-mode',
              value: 'ThresholdRange',
              values: [
                { value: 'ThresholdDynamic', label: 'Dynamic' },
                { value: 'ThresholdRange', label: 'Range' },
              ],
              commands: ({ value, commandsManager, options }) => {
                if (value === 'ThresholdDynamic') {
                  commandsManager.run('setToolActive', {
                    toolName: 'ThresholdCircularBrushDynamic',
                  });

                  return;
                }

                // check the condition of the threshold-range option
                const thresholdRangeOption = options.find(
                  option => option.id === 'threshold-shape'
                );

                commandsManager.run('setToolActiveToolbar', {
                  toolName: thresholdRangeOption.value,
                });
              },
            },
            {
              name: 'Shape',
              type: 'radio',
              id: 'threshold-shape',
              value: 'ThresholdCircularBrush',
              values: [
                { value: 'ThresholdCircularBrush', label: 'Circle' },
                { value: 'ThresholdSphereBrush', label: 'Sphere' },
              ],
              condition: ({ options }) =>
                options.find(option => option.id === 'dynamic-mode').value === 'ThresholdRange',
              commands: 'setToolActiveToolbar',
            },
            {
              name: 'ThresholdRange',
              type: 'double-range',
              id: 'threshold-range',
              min: -1000,
              max: 1000,
              step: 1,
              value: [100, 600],
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
