import { defaults, ToolbarService } from '@ohif/core';
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

const executeSetBrushSize = (commandsManager, value) => {
  commandsManager.runCommand('setBrushSize', { value }, 'SEGMENTATION');
};

const toolbarButtons: Button[] = [
  {
    id: 'Brush',
    uiType: 'ohif.radioGroup',
    props: {
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
          name: 'Mode',
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
  },
  {
    id: 'Eraser',
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'icon-tool-eraser',
      label: 'Eraser',
      evaluate: 'evaluate.cornerstone.segmentation',
      commands: _createSetToolActiveCommands('CircularEraser'),
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
          name: 'Mode',
          type: 'radio',
          id: 'brush-mode',
          value: 'CircularEraser',
          values: [
            { value: 'CircularEraser', label: 'Circle' },
            { value: 'SphereEraser', label: 'Sphere' },
          ],
          onChange: executeSetToolActive,
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
          name: 'Mode',
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
