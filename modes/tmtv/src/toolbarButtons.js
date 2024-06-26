import { ToolbarService } from '@ohif/core';
import { toolGroupIds } from './initToolGroups';

const setToolActiveToolbar = {
  commandName: 'setToolActiveToolbar',
  commandOptions: {
    toolGroupIds: [toolGroupIds.CT, toolGroupIds.PT, toolGroupIds.Fusion],
  },
};

const toolbarButtons = [
  {
    id: 'MeasurementTools',
    uiType: 'ohif.splitButton',
    props: {
      groupId: 'MeasurementTools',
      primary: ToolbarService.createButton({
        id: 'Length',
        icon: 'tool-length',
        label: 'Length',
        tooltip: 'Length Tool',
        commands: setToolActiveToolbar,
        evaluate: 'evaluate.cornerstoneTool',
      }),
      secondary: {
        icon: 'chevron-down',
        tooltip: 'More Measure Tools',
      },
      items: [
        ToolbarService.createButton({
          id: 'Bidirectional',
          icon: 'tool-bidirectional',
          label: 'Bidirectional',
          tooltip: 'Bidirectional Tool',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        ToolbarService.createButton({
          id: 'ArrowAnnotate',
          icon: 'tool-annotate',
          label: 'Arrow Annotate',
          tooltip: 'Arrow Annotate Tool',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        ToolbarService.createButton({
          id: 'EllipticalROI',
          icon: 'tool-ellipse',
          label: 'Ellipse',
          tooltip: 'Ellipse Tool',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
      ],
    },
  },
  {
    id: 'Zoom',
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'tool-zoom',
      label: 'Zoom',
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  // Window Level + Presets
  {
    id: 'WindowLevel',
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'tool-window-level',
      label: 'Window Level',
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  // Crosshairs Button
  {
    id: 'Crosshairs',
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'tool-crosshair',
      label: 'Crosshairs',
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  // Pan Button
  {
    id: 'Pan',
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'tool-move',
      label: 'Pan',
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  // Rectangle ROI Start End Threshold Button
  {
    id: 'RectangleROIStartEndThreshold',
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'tool-create-threshold',
      label: 'Rectangle ROI Threshold',
      commands: setToolActiveToolbar,
      evaluate: [
        'evaluate.cornerstone.segmentation',
        // need to put the disabled text last, since each evaluator will
        // merge the result text into the final result
        {
          name: 'evaluate.cornerstoneTool',
          disabledText: 'Select the PT Axial to enable this tool',
        },
      ],
      options: 'tmtv.RectangleROIThresholdOptions',
    },
  },
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
              name: 'Shape',
              type: 'radio',
              id: 'eraser-mode',
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
              min: 0,
              max: 50,
              step: 0.5,
              value: [2.5, 50],
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
];

export default toolbarButtons;
