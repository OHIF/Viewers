import { Button } from '@ohif/core/src/types';
import { ViewportGridService } from '@ohif/core';
import { setToolActiveToolbar, callbacks } from './toolbarConstants';

export const segmentationButtons: Button[] = [
  {
    id: 'Brush',
    uiType: 'ohif.toolBoxButton',
    props: {
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
          explicitRunOnly: true,
          min: 0.5,
          max: 99.5,
          step: 0.5,
          value: 25,
          values: [],
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
      id: 'InterpolateLabelmap',
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
      id: 'SegmentBidirectional',
      icon: 'icon-tool-bidirectional-segment',
      label: 'Segment Bidirectional',
      tooltip:
        'Computes the long and short axis of a segment and adds it as a bidirectional measurement',
      commands: 'xnatRunSegmentBidirectional',
      evaluate: 'evaluate.cornerstone.segmentation',
    },
  },
  {
    id: 'RegionSegmentPlus',
    uiType: 'ohif.toolBoxButton',
    props: {
      id: 'RegionSegmentPlus',
      icon: 'icon-tool-click-segment',
      label: 'One Click Segment',
      tooltip:
        'Detects segmentable regions with one click. Hover for visual feedback—click when a plus sign appears to auto-segment the lesion.',
      evaluate: {
        name: 'evaluate.cornerstone.segmentation',
        toolNames: ['RegionSegmentPlus'],
        disabledText: 'Create new segmentation to enable this tool.',
      },
      commands: 'setToolActiveToolbar',
    },
  },
  {
    id: 'LabelmapSlicePropagation',
    uiType: 'ohif.toolButton',
    props: {
      id: 'LabelmapSlicePropagation',
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
  {
    id: 'MarkerLabelmap',
    uiType: 'ohif.toolBoxButton',
    props: {
      id: 'MarkerLabelmap',
      icon: 'icon-marker-labelmap',
      label: 'Marker Guided Labelmap',
      tooltip:
        'Use include/exclude markers to guide AI (SAM) segmentation. Click to place markers, Enter to accept results, Esc to reject, and N to go to the next slice while keeping markers.',
      evaluate: [
        {
          name: 'evaluate.cornerstone.segmentation',
          toolNames: ['MarkerLabelmap', 'MarkerInclude', 'MarkerExclude'],
        },
      ],
      commands: 'setToolActiveToolbar',
      listeners: {
        [ViewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED]: callbacks('MarkerLabelmap'),
        [ViewportGridService.EVENTS.VIEWPORTS_READY]: callbacks('MarkerLabelmap'),
      },
      options: [
        {
          name: 'Marker Mode',
          type: 'radio',
          id: 'marker-mode',
          value: 'markerInclude',
          values: [
            { value: 'markerInclude', label: 'Include' },
            { value: 'markerExclude', label: 'Exclude' },
          ],
          commands: {
            commandName: 'setMarkerModeForMarkerLabelmap',
          },
        },
        {
          name: 'Clear Markers',
          type: 'button',
          id: 'clear-markers',
          values: [],
          commands: 'clearMarkersForMarkerLabelmap',
        },
      ],
    },
  },
  {
    id: 'Eraser',
    uiType: 'ohif.toolBoxButton',
    props: {
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
          explicitRunOnly: true,
          min: 0.5,
          max: 99.5,
          step: 0.5,
          value: 25,
          values: [],
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
          explicitRunOnly: true,
          min: 0.5,
          max: 99.5,
          step: 0.5,
          value: 25,
          values: [],
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
          commands: {
            commandName: 'setThresholdShape',
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
          commands: {
            commandName: 'setThresholdMode',
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
          values: [],
          condition: ({ options = [] }) =>
            (options as any[]).find(option => option.id === 'dynamic-mode')?.value ===
            'ThresholdRange',
          commands: {
            commandName: 'xnatSetThresholdRange',
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
      id: 'Shapes',
      icon: 'icon-tool-shape',
      label: 'Shapes',
      evaluate: {
        name: 'evaluate.cornerstone.segmentation',
        toolNames: ['CircleScissor', 'SphereScissor', 'RectangleScissor'],
        disabledText: 'Create new segmentation to enable shapes tool.',
      },
      commands: 'setToolActiveToolbar',
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
