import type { Button } from '@ohif/core/types';
import { ViewportGridService } from '@ohif/core';

const setToolActiveToolbar = {
  commandName: 'setToolActiveToolbar',
  commandOptions: {
    toolGroupIds: ['default', 'mpr', 'SRToolGroup', 'volume3d'],
  },
};

const callbacks = (toolName: string) => [
  {
    commandName: 'setViewportForToolConfiguration',
    commandOptions: {
      toolName,
    },
  },
];

const toolbarButtons: Button[] = [
  // sections
  {
    id: 'BrushTools',
    uiType: 'ohif.toolBoxButtonGroup',
    props: {
      groupId: 'BrushTools',
      buttonSection: 'brushToolsSection',
    },
  },
  // Section containers for the nested toolbox
  {
    id: 'SegmentationUtilities',
    uiType: 'ohif.toolBoxButton',
    props: {
      groupId: 'SegmentationUtilities',
      buttonSection: 'segmentationToolboxUtilitySection',
    },
  },
  {
    id: 'SegmentationTools',
    uiType: 'ohif.toolBoxButton',
    props: {
      groupId: 'SegmentationTools',
      buttonSection: 'segmentationToolboxToolsSection',
    },
  },

  {
    id: 'Brush',
    uiType: 'ohif.toolBoxButton',
    props: {
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
  },
  {
    id: 'InterpolateLabelmap',
    uiType: 'ohif.toolBoxButton',
    props: {
      icon: 'icon-tool-interpolation',
      label: 'Interpolate Labelmap',
      tooltip:
        'Automatically fill in missing slices between drawn segments. Use brush or threshold tools on at least two slices, then click to interpolate across slices. Works in any direction. Volume must be reconstructable.',
      evaluate: [
        'evaluate.cornerstone.segmentation',
        {
          name: 'evaluate.displaySetIsReconstructable',
          disabledText: 'The current viewport cannot handle interpolation.',
        },
      ],
      commands: 'interpolateLabelmap',
    },
  },
  {
    id: 'SegmentBidirectional',
    uiType: 'ohif.toolBoxButton',
    props: {
      icon: 'icon-tool-bidirectional-segment',
      label: 'Segment Bidirectional',
      tooltip:
        'Automatically detects the largest length and width across slices for the selected segment and displays a bidirectional measurement.',
      evaluate: {
        name: 'evaluate.cornerstone.segmentation',
        disabledText: 'Create new segmentation to enable this tool.',
      },
      commands: 'runSegmentBidirectional',
    },
  },
  // {
  //   id: 'RegionSegmentPlus',
  //   uiType: 'ohif.toolBoxButton',
  //   props: {
  //     icon: 'icon-tool-click-segment',
  //     label: 'One Click Segment',
  //     tooltip:
  //       'Detects segmentable regions with one click. Hover for visual feedback—click when a plus sign appears to auto-segment the lesion.',
  //     evaluate: {
  //       name: 'evaluate.cornerstone.segmentation',
  //       toolNames: ['RegionSegmentPlus'],
  //       disabledText: 'Create new segmentation to enable this tool.',
  //     },
  //     commands: 'setToolActiveToolbar',
  //   },
  // },
  {
    id: 'LabelmapSlicePropagation',
    uiType: 'ohif.toolBoxButton',
    props: {
      icon: 'icon-labelmap-slice-propagation',
      label: 'Labelmap Assist',
      tooltip:
        'Toggle AI assistance for segmenting nearby slices. After drawing on a slice, scroll to preview predictions. Press Enter to accept or Esc to skip.',
      evaluate: [
        'evaluate.cornerstoneTool.toggle',
        {
          name: 'evaluate.cornerstone.hasSegmentation',
        },
      ],
      listeners: {
        [ViewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED]: callbacks(
          'LabelmapSlicePropagation'
        ),
        [ViewportGridService.EVENTS.VIEWPORTS_READY]: callbacks('LabelmapSlicePropagation'),
      },
      commands: 'toggleEnabledDisabledToolbar',
    },
  },
  // {
  //   id: 'MarkerLabelmap',
  //   uiType: 'ohif.toolBoxButton',
  //   props: {
  //     icon: 'icon-marker-labelmap',
  //     label: 'Marker Guided Labelmap',
  //     tooltip:
  //       'Use include/exclude markers to guide AI (SAM) segmentation. Click to place markers, Enter to accept results, Esc to reject, and N to go to the next slice while keeping markers.',
  //     evaluate: [
  //       {
  //         name: 'evaluate.cornerstone.segmentation',
  //         toolNames: ['MarkerLabelmap', 'MarkerInclude', 'MarkerExclude'],
  //       },
  //     ],
  //     commands: 'setToolActiveToolbar',
  //     listeners: {
  //       [ViewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED]: callbacks('MarkerLabelmap'),
  //       [ViewportGridService.EVENTS.VIEWPORTS_READY]: callbacks('MarkerLabelmap'),
  //     },
  //     options: [
  //       {
  //         name: 'Marker Mode',
  //         type: 'radio',
  //         id: 'marker-mode',
  //         value: 'markerInclude',
  //         values: [
  //           { value: 'markerInclude', label: 'Include' },
  //           { value: 'markerExclude', label: 'Exclude' },
  //         ],
  //         commands: ({ commandsManager, options }) => {
  //           const markerModeOption = options.find(option => option.id === 'marker-mode');
  //           if (markerModeOption.value === 'markerInclude') {
  //             commandsManager.run('setToolActive', {
  //               toolName: 'MarkerInclude',
  //             });
  //           } else {
  //             commandsManager.run('setToolActive', {
  //               toolName: 'MarkerExclude',
  //             });
  //           }
  //         },
  //       },
  //       {
  //         name: 'Clear Markers',
  //         type: 'button',
  //         id: 'clear-markers',
  //         commands: 'clearMarkersForMarkerLabelmap',
  //       },
  //     ],
  //   },
  // },
  {
    id: 'Eraser',
    uiType: 'ohif.toolBoxButton',
    props: {
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
  },
  {
    id: 'Threshold',
    uiType: 'ohif.toolBoxButton',
    props: {
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
            const thresholdRangeOption = options.find(option => option.id === 'threshold-shape');

            if (value === 'ThresholdDynamic') {
              commandsManager.run('setToolActiveToolbar', {
                toolName:
                  thresholdRangeOption.value === 'ThresholdCircularBrush'
                    ? 'ThresholdCircularBrushDynamic'
                    : 'ThresholdSphereBrushDynamic',
              });
            } else {
              commandsManager.run('setToolActiveToolbar', {
                toolName: thresholdRangeOption.value,
              });

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
  },
  {
    id: 'Shapes',
    uiType: 'ohif.toolBoxButton',
    props: {
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
