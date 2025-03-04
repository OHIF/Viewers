import type { Button } from '@ohif/core/types';

const toolbarButtons: Button[] = [
  {
    id: 'BrushTools',
    uiType: 'ohif.toolBoxButtonGroup',
    props: {
      groupId: 'BrushTools',
      evaluate: 'evaluate.cornerstone.hasSegmentation',
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
            toolNames: [
              'ThresholdCircularBrush',
              'ThresholdSphereBrush',
              'ThresholdCircularBrushDynamic',
              'ThresholdSphereBrushDynamic',
            ],
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
                    'ThresholdSphereBrushDynamic',
                  ],
                },
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
              commands: ({ value, commandsManager, options }) => {
                const optionsDynamic = options.find(option => option.id === 'dynamic-mode');

                if (optionsDynamic.value === 'ThresholdDynamic') {
                  commandsManager.run('setToolActive', {
                    toolName:
                      value === 'ThresholdCircularBrush'
                        ? 'ThresholdCircularBrushDynamic'
                        : 'ThresholdSphereBrushDynamic',
                  });
                } else {
                  commandsManager.run('setToolActive', {
                    toolName: value,
                  });
                }
              },
            },
            {
              name: 'Threshold',
              type: 'radio',
              id: 'dynamic-mode',
              value: 'ThresholdDynamic',
              values: [
                { value: 'ThresholdDynamic', label: 'Dynamic' },
                { value: 'ThresholdRange', label: 'Range' },
              ],
              commands: ({ value, commandsManager, options }) => {
                const thresholdRangeOption = options.find(
                  option => option.id === 'threshold-shape'
                );

                if (value === 'ThresholdDynamic') {
                  commandsManager.run('setToolActiveToolbar', {
                    toolName:
                      thresholdRangeOption.value === 'ThresholdCircularBrush'
                        ? 'ThresholdCircularBrushDynamic'
                        : 'ThresholdSphereBrushDynamic',
                  });
                } else {
                  // check the condition of the threshold-range option
                  commandsManager.run('setToolActiveToolbar', {
                    toolName: thresholdRangeOption.value,
                  });

                  // get the value of the threshold-range option
                  const thresholdRangeValue = options.find(
                    option => option.id === 'threshold-range'
                  ).value;

                  commandsManager.run('setThresholdRange', {
                    toolNames: ['ThresholdCircularBrush', 'ThresholdSphereBrush'],
                    value: thresholdRangeValue,
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
              value: [50, 600],
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
    uiType: 'ohif.toolBoxButton',
    props: {
      id: 'Shapes',
      icon: 'icon-tool-shape',
      label: 'Shapes',
      evaluate: {
        name: 'evaluate.cornerstone.segmentation',
        toolNames: ['CircleScissor', 'SphereScissor', 'RectangleScissor'],
        disabledText: 'Create new segmentation to enable shapes tool.',
      },
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
