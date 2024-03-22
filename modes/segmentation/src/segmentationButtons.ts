import type { Button } from '@ohif/core/types';

function _createSetToolActiveCommands(toolName) {
  return [
    {
      commandName: 'setToolActive',
      commandOptions: {
        toolName,
      },
      context: 'CORNERSTONE',
    },
  ];
}

const executeSetToolActive = (commandsManager, toolName) => {
  commandsManager.runCommand('setToolActive', { toolName }, 'CORNERSTONE');
};

const executeSetBrushProperty = (commandsManager, property, toolNames, value) => {
  commandsManager.runCommand(
    property,
    {
      value,
      toolNames,
    },
    'SEGMENTATION'
  );
};

const executeSetBrushSize = (commandsManager, value) => {
  executeSetBrushProperty(commandsManager, 'setBrushSize', ['CircularBrush', 'SphereBrush'], value);
};

const executeSetEraserSize = (commandsManager, value) => {
  executeSetBrushProperty(
    commandsManager,
    'setBrushSize',
    ['CircularEraser', 'SphereEraser'],
    value
  );
};

const executeSetThresholdSize = (commandsManager, value) => {
  executeSetBrushProperty(
    commandsManager,
    'setBrushSize',
    ['ThresholdCircularBrush', 'ThresholdSphereBrush'],
    value
  );
};

const executeSetThresholdRange = (commandsManager, values) => {
  commandsManager.runCommand(
    'setThresholdRange',
    { values, toolNames: ['ThresholdCircularBrush', 'ThresholdSphereBrush'] },
    'SEGMENTATION'
  );
};

const toolbarButtons: Button[] = [
  {
    id: 'BrushTools',
    uiType: 'ohif.buttonGroup',
    props: {
      groupId: 'BrushTools',
      evaluate: 'evaluate.cornerstone.segmentation',
      items: [
        {
          id: 'Brush',
          icon: 'icon-tool-brush',
          label: 'Brush',
          evaluate: 'evaluate.cornerstone.segmentation',
          commands: _createSetToolActiveCommands('CircularBrush'),
          options: [
            {
              name: 'Radius (mm)',
              id: 'brush-radius',
              type: 'range',
              min: 0.5,
              max: 99.5,
              step: 0.5,
              value: 15,
              onChange: executeSetBrushSize,
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
              onChange: executeSetToolActive,
            },
          ],
        },
        {
          id: 'Eraser',
          icon: 'icon-tool-eraser',
          label: 'Eraser',
          evaluate: 'evaluate.cornerstone.segmentation',
          commands: _createSetToolActiveCommands('CircularEraser'),
          options: [
            {
              name: 'Radius (mm)',
              id: 'eraser-radius',
              type: 'range',
              min: 0.5,
              max: 99.5,
              step: 0.5,
              value: 15,
              onChange: executeSetEraserSize,
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
              onChange: executeSetToolActive,
            },
          ],
        },
        {
          id: 'Threshold',
          icon: 'icon-tool-threshold',
          label: 'Eraser',
          evaluate: 'evaluate.cornerstone.segmentation',
          commands: _createSetToolActiveCommands('ThresholdCircularBrush'),
          options: [
            {
              name: 'Radius (mm)',
              id: 'threshold-radius',
              type: 'range',
              min: 0.5,
              max: 99.5,
              step: 0.5,
              value: 15,
              onChange: executeSetThresholdSize,
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
              onChange: executeSetToolActive,
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
              onChange: executeSetThresholdRange,
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
      evaluate: 'evaluate.cornerstone.segmentation',
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
          onChange: executeSetToolActive,
        },
      ],
    },
  },
];

export default toolbarButtons;
