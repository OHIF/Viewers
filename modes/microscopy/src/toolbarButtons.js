import { ToolbarService } from '@ohif/core';

const toolbarButtons = [
  {
    id: 'MeasurementTools',
    uiType: 'ohif.splitButton',
    props: {
      groupId: 'MeasurementTools',
      // group evaluate to determine which item should move to the top
      evaluate: 'evaluate.group.promoteToPrimary',
      primary: ToolbarService.createButton({
        id: 'line',
        icon: 'tool-length',
        label: 'Line',
        tooltip: 'Line',
        commands: [
          {
            commandName: 'setToolActive',
            commandOptions: { toolName: 'line' },
            context: 'MICROSCOPY',
          },
        ],
        evaluate: 'evaluate.microscopyTool',
      }),
      secondary: {
        icon: 'chevron-down',
        tooltip: 'More Measure Tools',
      },
      items: [
        ToolbarService.createButton({
          id: 'line',
          icon: 'tool-length',
          label: 'Line',
          tooltip: 'Line',
          commands: [
            {
              commandName: 'setToolActive',
              commandOptions: { toolName: 'line' },
              context: 'MICROSCOPY',
            },
          ],
          evaluate: 'evaluate.microscopyTool',
        }),
        ToolbarService.createButton({
          id: 'point',
          icon: 'tool-point',
          label: 'Point',
          tooltip: 'Point Tool',
          commands: [
            {
              commandName: 'setToolActive',
              commandOptions: { toolName: 'point' },
              context: 'MICROSCOPY',
            },
          ],
          evaluate: 'evaluate.microscopyTool',
        }),
        // Point Tool was previously defined
        ToolbarService.createButton({
          id: 'polygon',
          icon: 'tool-polygon',
          label: 'Polygon',
          tooltip: 'Polygon Tool',
          commands: [
            {
              commandName: 'setToolActive',
              commandOptions: { toolName: 'polygon' },
              context: 'MICROSCOPY',
            },
          ],
          evaluate: 'evaluate.microscopyTool',
        }),
        ToolbarService.createButton({
          id: 'circle',
          icon: 'tool-circle',
          label: 'Circle',
          tooltip: 'Circle Tool',
          commands: [
            {
              commandName: 'setToolActive',
              commandOptions: { toolName: 'circle' },
              context: 'MICROSCOPY',
            },
          ],
          evaluate: 'evaluate.microscopyTool',
        }),
        ToolbarService.createButton({
          id: 'box',
          icon: 'tool-rectangle',
          label: 'Box',
          tooltip: 'Box Tool',
          commands: [
            {
              commandName: 'setToolActive',
              commandOptions: { toolName: 'box' },
              context: 'MICROSCOPY',
            },
          ],
          evaluate: 'evaluate.microscopyTool',
        }),
        ToolbarService.createButton({
          id: 'freehandpolygon',
          icon: 'tool-freehand-polygon',
          label: 'Freehand Polygon',
          tooltip: 'Freehand Polygon Tool',
          commands: [
            {
              commandName: 'setToolActive',
              commandOptions: { toolName: 'freehandpolygon' },
              context: 'MICROSCOPY',
            },
          ],
          evaluate: 'evaluate.microscopyTool',
        }),
        ToolbarService.createButton({
          id: 'freehandline',
          icon: 'tool-freehand-line',
          label: 'Freehand Line',
          tooltip: 'Freehand Line Tool',
          commands: [
            {
              commandName: 'setToolActive',
              commandOptions: { toolName: 'freehandline' },
              context: 'MICROSCOPY',
            },
          ],
          evaluate: 'evaluate.microscopyTool',
        }),
      ],
    },
  },
  {
    id: 'dragPan',
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'tool-move',
      label: 'Pan',
      commands: [
        {
          commandName: 'setToolActive',
          commandOptions: { toolName: 'dragPan' },
          context: 'MICROSCOPY',
        },
      ],
      evaluate: 'evaluate.microscopyTool',
    },
  },
  {
    id: 'TagBrowser',
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'dicom-tag-browser',
      label: 'Dicom Tag Browser',
      commands: [
        {
          commandName: 'openDICOMTagViewer',
        },
      ],
      evaluate: 'evaluate.action',
    },
  },
];

export default toolbarButtons;
