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
          onChange: [
            {
              commandName: 'setBrushSize',
              context: 'SEGMENTATION',
            },
          ],
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
          onChange: [
            {
              commandName: 'changeBrushMode',
              context: 'SEGMENTATION',
            },
          ],
        },
      ],
    },
  },
];

export default toolbarButtons;
