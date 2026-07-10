import type { Button } from '@ohif/core/types';
import { ViewportGridService, ToolbarService } from '@ohif/core';
import i18n from 'i18next';

const { TOOLBAR_SECTIONS } = ToolbarService;

export const MIN_SEGMENTATION_DRAWING_RADIUS = 0.5;
export const MAX_SEGMENTATION_DRAWING_RADIUS = 99.5;

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

/**
 * Segmentation editing toolbar buttons: the toolbox section containers plus
 * the labelmap / contour editing tools and utilities. These complement the
 * general buttons in `cornerstone.toolbarButtons`; together they are the
 * default button set for the segmentation mode, and modes such as basic /
 * longitudinal can pull them in via a customization (see
 * `segmentationEditing.jsonc`).
 */
const segmentationToolbarButtons: Button[] = [
  // section containers for the nested toolboxes and toolbars
  {
    id: 'BrushTools',
    uiType: 'ohif.toolBoxButtonGroup',
    props: {
      buttonSection: true,
    },
  },
  {
    id: 'LabelMapUtilities',
    uiType: 'ohif.Toolbar',
    props: {
      buttonSection: true,
    },
  },
  {
    id: 'ContourUtilities',
    uiType: 'ohif.Toolbar',
    props: {
      buttonSection: true,
    },
  },
  {
    id: 'LabelMapTools',
    uiType: 'ohif.toolBoxButtonGroup',
    props: {
      buttonSection: true,
    },
  },
  {
    id: 'ContourTools',
    uiType: 'ohif.toolBoxButtonGroup',
    props: {
      buttonSection: true,
    },
  },
  // tool defs
  {
    id: 'PlanarFreehandContourSegmentationTool',
    uiType: 'ohif.toolBoxButton',
    props: {
      icon: 'icon-tool-freehand-roi',
      label: i18n.t('Buttons:Freehand Segmentation'),
      tooltip: i18n.t('Buttons:Freehand Segmentation'),
      evaluate: [
        {
          name: 'evaluate.cornerstone.segmentation',
          toolNames: ['PlanarFreehandContourSegmentationTool'],
          disabledText: i18n.t('Buttons:Create new segmentation to enable this tool.'),
        },
        {
          name: 'evaluate.cornerstone.hasSegmentationOfType',
          segmentationRepresentationType: 'Contour',
        },
      ],
      commands: [
        {
          commandName: 'setToolActiveToolbar',
          commandOptions: {
            bindings: [
              {
                mouseButton: 1, // Left Click
              },
              {
                mouseButton: 1, // Left Click+Shift to create a hole
                modifierKey: 16, // Shift
              },
            ],
          },
        },
        {
          commandName: 'activateSelectedSegmentationOfType',
          commandOptions: {
            segmentationRepresentationType: 'Contour',
          },
        },
      ],
      options: [
        {
          name: i18n.t('Buttons:Interpolate Contours'),
          type: 'switch',
          id: 'planarFreehandInterpolateContours',
          value: false,
          commands: {
            commandName: 'setInterpolationToolConfiguration',
          },
        },
      ],
    },
  },
  {
    id: 'LivewireContourSegmentationTool',
    uiType: 'ohif.toolBoxButton',
    props: {
      icon: 'icon-tool-livewire',
      label: i18n.t('Buttons:Livewire Contour'),
      tooltip: i18n.t('Buttons:Livewire Contour'),
      evaluate: [
        {
          name: 'evaluate.cornerstone.segmentation',
          toolNames: ['LivewireContourSegmentationTool'],
          disabledText: i18n.t('Buttons:Create new segmentation to enable this tool.'),
        },
        {
          name: 'evaluate.cornerstone.hasSegmentationOfType',
          segmentationRepresentationType: 'Contour',
        },
      ],
      commands: [
        {
          commandName: 'setToolActiveToolbar',
          commandOptions: {
            bindings: [
              {
                mouseButton: 1, // Left Click
              },
              {
                mouseButton: 1, // Left Click+Shift to create a hole
                modifierKey: 16, // Shift
              },
            ],
          },
        },
        {
          commandName: 'activateSelectedSegmentationOfType',
          commandOptions: {
            segmentationRepresentationType: 'Contour',
          },
        },
      ],
      options: [
        {
          name: i18n.t('Buttons:Interpolate Contours'),
          type: 'switch',
          id: 'livewireInterpolateContours',
          value: false,
          commands: {
            commandName: 'setInterpolationToolConfiguration',
          },
        },
      ],
    },
  },
  {
    id: 'SplineContourSegmentationTool',
    uiType: 'ohif.toolBoxButton',
    props: {
      icon: 'icon-tool-spline-roi',
      label: i18n.t('Buttons:Spline Contour Segmentation Tool'),
      tooltip: i18n.t('Buttons:Spline Contour Segmentation Tool'),
      evaluate: [
        {
          name: 'evaluate.cornerstone.segmentation',
          toolNames: ['CatmullRomSplineROI', 'LinearSplineROI', 'BSplineROI'],
          disabledText: i18n.t('Buttons:Create new segmentation to enable this tool.'),
        },
        {
          name: 'evaluate.cornerstone.hasSegmentationOfType',
          segmentationRepresentationType: 'Contour',
        },
      ],
      commands: [
        {
          commandName: 'activateSelectedSegmentationOfType',
          commandOptions: {
            segmentationRepresentationType: 'Contour',
          },
        },
      ],
      options: [
        {
          name: i18n.t('Buttons:Spline Type'),
          type: 'select',
          id: 'splineTypeSelect',
          value: 'CatmullRomSplineROI',
          values: [
            {
              id: 'CatmullRomSplineROI',
              value: 'CatmullRomSplineROI',
              label: i18n.t('Buttons:Catmull Rom Spline'),
            },
            {
              id: 'LinearSplineROI',
              value: 'LinearSplineROI',
              label: i18n.t('Buttons:Linear Spline'),
            },
            { id: 'BSplineROI', value: 'BSplineROI', label: i18n.t('Buttons:B-Spline') },
          ],
          commands: {
            commandName: 'setToolActiveToolbar',
            commandOptions: {
              bindings: [
                {
                  mouseButton: 1, // Left Click
                },
                {
                  mouseButton: 1, // Left Click+Shift to create a hole
                  modifierKey: 16, // Shift
                },
              ],
            },
          },
        },
        {
          name: i18n.t('Buttons:Simplified Spline'),
          type: 'switch',
          id: 'simplifiedSpline',
          value: true,
          commands: {
            commandName: 'setSimplifiedSplineForSplineContourSegmentationTool',
          },
        },
        {
          name: i18n.t('Buttons:Interpolate Contours'),
          type: 'switch',
          id: 'splineInterpolateContours',
          value: false,
          commands: {
            commandName: 'setInterpolationToolConfiguration',
            commandOptions: {
              toolNames: ['CatmullRomSplineROI', 'LinearSplineROI', 'BSplineROI'],
            },
          },
        },
      ],
    },
  },
  {
    id: 'SculptorTool',
    uiType: 'ohif.toolBoxButton',
    props: {
      icon: 'icon-tool-sculptor',
      label: i18n.t('Buttons:Sculptor Tool'),
      tooltip: i18n.t('Buttons:Sculptor Tool'),
      evaluate: [
        {
          name: 'evaluate.cornerstone.segmentation',
          toolNames: ['SculptorTool'],
          disabledText: i18n.t('Buttons:Create new segmentation to enable this tool.'),
        },
        {
          name: 'evaluate.cornerstone.hasSegmentationOfType',
          segmentationRepresentationType: 'Contour',
        },
      ],
      commands: [
        'setToolActiveToolbar',
        {
          commandName: 'activateSelectedSegmentationOfType',
          commandOptions: {
            segmentationRepresentationType: 'Contour',
          },
        },
      ],
      options: [
        {
          name: i18n.t('Buttons:Dynamic Cursor Size'),
          type: 'switch',
          id: 'dynamicCursorSize',
          value: true,
          commands: {
            commandName: 'setDynamicCursorSizeForSculptorTool',
          },
        },
      ],
    },
  },
  {
    id: 'Brush',
    uiType: 'ohif.toolBoxButton',
    props: {
      icon: 'icon-tool-brush',
      label: i18n.t('Buttons:Brush'),
      evaluate: [
        {
          name: 'evaluate.cornerstone.segmentation',
          toolNames: ['CircularBrush', 'SphereBrush'],
          disabledText: i18n.t('Buttons:Create new segmentation to enable this tool.'),
        },
        {
          name: 'evaluate.cornerstone.segmentation.synchronizeDrawingRadius',
          radiusOptionId: 'brush-radius',
        },
        {
          name: 'evaluate.cornerstone.hasSegmentationOfType',
          segmentationRepresentationType: 'Labelmap',
        },
      ],
      commands: {
        commandName: 'activateSelectedSegmentationOfType',
        commandOptions: {
          segmentationRepresentationType: 'Labelmap',
        },
      },
      options: [
        {
          name: i18n.t('Buttons:Radius (mm)'),
          id: 'brush-radius',
          type: 'range',
          explicitRunOnly: true,
          min: MIN_SEGMENTATION_DRAWING_RADIUS,
          max: MAX_SEGMENTATION_DRAWING_RADIUS,
          step: 0.5,
          value: 25,
          commands: [
            {
              commandName: 'setBrushSize',
              commandOptions: { toolNames: ['CircularBrush', 'SphereBrush'] },
            },
          ],
        },
        {
          name: i18n.t('Buttons:Shape'),
          type: 'radio',
          id: 'brush-mode',
          value: 'CircularBrush',
          values: [
            { value: 'CircularBrush', label: i18n.t('Buttons:Circle') },
            { value: 'SphereBrush', label: i18n.t('Buttons:Sphere') },
          ],
          commands: ['setToolActiveToolbar'],
        },
      ],
    },
  },
  {
    id: 'InterpolateLabelmap',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'actions-interpolate',
      label: i18n.t('Buttons:Interpolate Labelmap'),
      tooltip: i18n.t(
        'Buttons:Automatically fill in missing slices between drawn segments. Use brush or threshold tools on at least two slices, then click to interpolate across slices. Works in any direction. Volume must be reconstructable.'
      ),
      evaluate: [
        {
          name: 'evaluate.cornerstone.segmentation',
        },
        {
          name: 'evaluate.cornerstone.hasSegmentationOfType',
          segmentationRepresentationType: 'Labelmap',
        },
        {
          name: 'evaluate.displaySetIsReconstructable',
          disabledText: i18n.t('Buttons:The current viewport cannot handle interpolation.'),
        },
      ],
      commands: [
        {
          commandName: 'activateSelectedSegmentationOfType',
          commandOptions: {
            segmentationRepresentationType: 'Labelmap',
          },
        },
        'interpolateLabelmap',
      ],
    },
  },
  {
    id: 'SegmentBidirectional',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'actions-bidirectional',
      label: i18n.t('Buttons:Segment Bidirectional'),
      tooltip: i18n.t(
        'Buttons:Automatically detects the largest length and width across slices for the selected segment and displays a bidirectional measurement.'
      ),
      evaluate: [
        {
          name: 'evaluate.cornerstone.segmentation',
          disabledText: i18n.t('Buttons:Create new segmentation to enable this tool.'),
        },
        {
          name: 'evaluate.cornerstone.hasSegmentationOfType',
          segmentationRepresentationType: 'Labelmap',
        },
      ],
      commands: [
        {
          commandName: 'activateSelectedSegmentationOfType',
          commandOptions: {
            segmentationRepresentationType: 'Labelmap',
          },
        },
        'runSegmentBidirectional',
      ],
    },
  },
  {
    id: 'RegionSegmentPlus',
    uiType: 'ohif.toolBoxButton',
    props: {
      icon: 'icon-tool-click-segment',
      label: i18n.t('Buttons:One Click Segment'),
      tooltip: i18n.t(
        'Buttons:Detects segmentable regions with one click. Hover for visual feedback—click when a plus sign appears to auto-segment the lesion.'
      ),
      evaluate: [
        {
          name: 'evaluate.cornerstone.segmentation',
          toolNames: ['RegionSegmentPlus'],
          disabledText: i18n.t('Buttons:Create new segmentation to enable this tool.'),
        },
        {
          name: 'evaluate.cornerstone.hasSegmentationOfType',
          segmentationRepresentationType: 'Labelmap',
        },
      ],
      commands: [
        'setToolActiveToolbar',
        {
          commandName: 'activateSelectedSegmentationOfType',
          commandOptions: {
            segmentationRepresentationType: 'Labelmap',
          },
        },
      ],
    },
  },
  {
    id: 'LabelmapSlicePropagation',
    uiType: 'ohif.toolBoxButton',
    props: {
      icon: 'icon-labelmap-slice-propagation',
      label: i18n.t('Buttons:Labelmap Assist'),
      tooltip: i18n.t(
        'Buttons:Toggle AI assistance for segmenting nearby slices. After drawing on a slice, scroll to preview predictions. Press Enter to accept or Esc to skip.'
      ),
      evaluate: [
        'evaluate.cornerstoneTool.toggle',
        {
          name: 'evaluate.cornerstone.hasSegmentationOfType',
          segmentationRepresentationType: 'Labelmap',
        },
      ],
      listeners: {
        [ViewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED]: callbacks(
          'LabelmapSlicePropagation'
        ),
        [ViewportGridService.EVENTS.VIEWPORTS_READY]: callbacks('LabelmapSlicePropagation'),
      },
      commands: [
        {
          commandName: 'activateSelectedSegmentationOfType',
          commandOptions: {
            segmentationRepresentationType: 'Labelmap',
          },
        },
        'toggleEnabledDisabledToolbar',
      ],
    },
  },
  {
    id: 'MarkerLabelmap',
    uiType: 'ohif.toolBoxButton',
    props: {
      icon: 'icon-marker-labelmap',
      label: i18n.t('Buttons:Marker Guided Labelmap'),
      tooltip: i18n.t(
        'Buttons:Use include/exclude markers to guide AI (SAM) segmentation. Click to place markers, Enter to accept results, Esc to reject, and N to go to the next slice while keeping markers.'
      ),
      evaluate: [
        {
          name: 'evaluate.cornerstone.segmentation',
          toolNames: ['MarkerLabelmap', 'MarkerInclude', 'MarkerExclude'],
        },
        {
          name: 'evaluate.cornerstone.hasSegmentationOfType',
          segmentationRepresentationType: 'Labelmap',
        },
      ],
      commands: [
        'setToolActiveToolbar',
        {
          commandName: 'activateSelectedSegmentationOfType',
          commandOptions: {
            segmentationRepresentationType: 'Labelmap',
          },
        },
      ],
      listeners: {
        [ViewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED]: callbacks('MarkerLabelmap'),
        [ViewportGridService.EVENTS.VIEWPORTS_READY]: callbacks('MarkerLabelmap'),
      },
      options: [
        {
          name: i18n.t('Buttons:Marker Mode'),
          type: 'radio',
          id: 'marker-mode',
          value: 'markerInclude',
          values: [
            { value: 'markerInclude', label: i18n.t('Buttons:Include') },
            { value: 'markerExclude', label: i18n.t('Buttons:Exclude') },
          ],
          commands: ({ commandsManager, options }) => {
            const markerModeOption = options.find(option => option.id === 'marker-mode');
            if (markerModeOption.value === 'markerInclude') {
              commandsManager.run('setToolActive', {
                toolName: 'MarkerInclude',
              });
            } else {
              commandsManager.run('setToolActive', {
                toolName: 'MarkerExclude',
              });
            }
          },
        },
        {
          name: i18n.t('Buttons:Clear Markers'),
          type: 'button',
          id: 'clear-markers',
          commands: 'clearMarkersForMarkerLabelmap',
        },
      ],
    },
  },
  {
    id: 'Eraser',
    uiType: 'ohif.toolBoxButton',
    props: {
      icon: 'icon-tool-eraser',
      label: i18n.t('Buttons:Eraser'),
      evaluate: [
        {
          name: 'evaluate.cornerstone.segmentation',
          toolNames: ['CircularEraser', 'SphereEraser'],
        },
        {
          name: 'evaluate.cornerstone.segmentation.synchronizeDrawingRadius',
          radiusOptionId: 'eraser-radius',
        },
        {
          name: 'evaluate.cornerstone.hasSegmentationOfType',
          segmentationRepresentationType: 'Labelmap',
        },
      ],
      options: [
        {
          name: i18n.t('Buttons:Radius (mm)'),
          id: 'eraser-radius',
          type: 'range',
          explicitRunOnly: true,
          min: MIN_SEGMENTATION_DRAWING_RADIUS,
          max: MAX_SEGMENTATION_DRAWING_RADIUS,
          step: 0.5,
          value: 25,
          commands: {
            commandName: 'setBrushSize',
            commandOptions: { toolNames: ['CircularEraser', 'SphereEraser'] },
          },
        },
        {
          name: i18n.t('Buttons:Shape'),
          type: 'radio',
          id: 'eraser-mode',
          value: 'CircularEraser',
          values: [
            { value: 'CircularEraser', label: i18n.t('Buttons:Circle') },
            { value: 'SphereEraser', label: i18n.t('Buttons:Sphere') },
          ],
          commands: 'setToolActiveToolbar',
        },
      ],
      commands: {
        commandName: 'activateSelectedSegmentationOfType',
        commandOptions: {
          segmentationRepresentationType: 'Labelmap',
        },
      },
    },
  },
  {
    id: 'Threshold',
    uiType: 'ohif.toolBoxButton',
    props: {
      icon: 'icon-tool-threshold',
      label: i18n.t('Buttons:Threshold Tool'),
      evaluate: [
        {
          name: 'evaluate.cornerstone.segmentation',
          toolNames: [
            'ThresholdCircularBrush',
            'ThresholdSphereBrush',
            'ThresholdCircularBrushDynamic',
            'ThresholdSphereBrushDynamic',
          ],
        },
        {
          name: 'evaluate.cornerstone.segmentation.synchronizeDrawingRadius',
          radiusOptionId: 'threshold-radius',
        },
        {
          name: 'evaluate.cornerstone.hasSegmentationOfType',
          segmentationRepresentationType: 'Labelmap',
        },
      ],
      commands: {
        commandName: 'activateSelectedSegmentationOfType',
        commandOptions: {
          segmentationRepresentationType: 'Labelmap',
        },
      },
      options: [
        {
          name: i18n.t('Buttons:Radius (mm)'),
          id: 'threshold-radius',
          type: 'range',
          explicitRunOnly: true,
          min: MIN_SEGMENTATION_DRAWING_RADIUS,
          max: MAX_SEGMENTATION_DRAWING_RADIUS,
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
          name: i18n.t('Buttons:Shape'),
          type: 'radio',
          id: 'threshold-shape',
          value: 'ThresholdCircularBrush',
          values: [
            { value: 'ThresholdCircularBrush', label: i18n.t('Buttons:Circle') },
            { value: 'ThresholdSphereBrush', label: i18n.t('Buttons:Sphere') },
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
          name: i18n.t('Buttons:Threshold'),
          type: 'radio',
          id: 'dynamic-mode',
          value: 'ThresholdDynamic',
          values: [
            { value: 'ThresholdDynamic', label: i18n.t('Buttons:Dynamic') },
            { value: 'ThresholdRange', label: i18n.t('Buttons:Range') },
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
      label: i18n.t('Buttons:Shapes'),
      evaluate: [
        {
          name: 'evaluate.cornerstone.segmentation',
          toolNames: ['CircleScissor', 'SphereScissor', 'RectangleScissor'],
          disabledText: i18n.t('Buttons:Create new segmentation to enable shapes tool.'),
        },
        {
          name: 'evaluate.cornerstone.hasSegmentationOfType',
          segmentationRepresentationType: 'Labelmap',
        },
      ],
      commands: {
        commandName: 'activateSelectedSegmentationOfType',
        commandOptions: {
          segmentationRepresentationType: 'Labelmap',
        },
      },
      options: [
        {
          name: i18n.t('Buttons:Shape'),
          type: 'radio',
          value: 'CircleScissor',
          id: 'shape-mode',
          values: [
            { value: 'CircleScissor', label: i18n.t('Buttons:Circle') },
            { value: 'SphereScissor', label: i18n.t('Buttons:Sphere') },
            { value: 'RectangleScissor', label: i18n.t('Buttons:Rectangle') },
          ],
          commands: 'setToolActiveToolbar',
        },
      ],
    },
  },
  {
    id: 'SimplifyContours',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'actions-simplify',
      label: 'Simplify Contours',
      tooltip: 'Simplify Contours',
      commands: ['toggleActiveSegmentationUtility'],
      evaluate: [
        {
          name: 'cornerstone.isActiveSegmentationUtility',
        },
      ],
      options: 'cornerstone.SimplifyContourOptions',
    },
  },
  {
    id: 'SmoothContours',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'actions-smooth',
      label: 'Smooth Contours',
      tooltip: 'Smooth Contours',
      commands: ['toggleActiveSegmentationUtility'],
      evaluate: [
        {
          name: 'cornerstone.isActiveSegmentationUtility',
        },
      ],
      options: 'cornerstone.SmoothContoursOptions',
    },
  },
  {
    id: 'LogicalContourOperations',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'actions-combine',
      label: 'Combine Contours',
      tooltip: 'Combine Contours',
      commands: ['toggleActiveSegmentationUtility'],
      evaluate: [
        {
          name: 'cornerstone.isActiveSegmentationUtility',
        },
      ],
      options: 'cornerstone.LogicalContourOperationsOptions',
    },
  },
  {
    id: 'LabelMapEditWithContour',
    uiType: 'ohif.toolBoxButton',
    props: {
      icon: 'tool-labelmap-edit-with-contour',
      label: i18n.t('Buttons:Labelmap Edit with Contour Tool'),
      tooltip: i18n.t('Buttons:Labelmap Edit with Contour Tool'),
      commands: [
        'setToolActiveToolbar',
        {
          commandName: 'activateSelectedSegmentationOfType',
          commandOptions: { segmentationRepresentationType: 'Labelmap' },
        },
      ],
      evaluate: [
        {
          name: 'evaluate.cornerstone.segmentation',
          toolNames: ['LabelMapEditWithContour'],
          disabledText: 'Create new segmentation to enable this tool.',
        },
        {
          name: 'evaluate.cornerstone.hasSegmentationOfType',
          segmentationRepresentationType: 'Labelmap',
        },
      ],
    },
  },
];

/**
 * The toolbox / utilities section wiring for segmentation editing. These are
 * the sections rendered by the `panelSegmentationWithTools*` panels, so any
 * mode that shows those panels can merge this block into its toolbar sections.
 */
export const segmentationToolboxSections: Record<string, string[]> = {
  [TOOLBAR_SECTIONS.labelMapSegmentationToolbox]: ['LabelMapTools'],
  [TOOLBAR_SECTIONS.contourSegmentationToolbox]: ['ContourTools'],
  [TOOLBAR_SECTIONS.labelMapSegmentationUtilities]: ['LabelMapUtilities'],
  [TOOLBAR_SECTIONS.contourSegmentationUtilities]: ['ContourUtilities'],

  LabelMapTools: [
    'LabelmapSlicePropagation',
    'BrushTools',
    'MarkerLabelmap',
    'RegionSegmentPlus',
    'Shapes',
    'LabelMapEditWithContour',
  ],
  ContourTools: [
    'PlanarFreehandContourSegmentationTool',
    'SculptorTool',
    'SplineContourSegmentationTool',
    'LivewireContourSegmentationTool',
  ],

  LabelMapUtilities: ['InterpolateLabelmap', 'SegmentBidirectional'],
  ContourUtilities: ['LogicalContourOperations', 'SimplifyContours', 'SmoothContours'],

  BrushTools: ['Brush', 'Eraser', 'Threshold'],
};

/**
 * The segmentation mode's main toolbar layout (primary bar and viewport
 * action corners). Kept separate from the toolbox wiring above so other modes
 * can adopt segmentation editing without adopting this mode layout.
 */
export const segmentationModeToolbarSections: Record<string, string[]> = {
  [TOOLBAR_SECTIONS.primary]: [
    'WindowLevel',
    'Pan',
    'Zoom',
    'TrackballRotate',
    'Capture',
    'Layout',
    'Crosshairs',
    'MoreTools',
  ],

  [TOOLBAR_SECTIONS.viewportActionMenu.topLeft]: ['orientationMenu', 'dataOverlayMenu'],

  [TOOLBAR_SECTIONS.viewportActionMenu.bottomMiddle]: ['AdvancedRenderingControls'],

  AdvancedRenderingControls: [
    'windowLevelMenuEmbedded',
    'voiManualControlMenu',
    'Colorbar',
    'opacityMenu',
    'thresholdMenu',
  ],

  [TOOLBAR_SECTIONS.viewportActionMenu.topRight]: [
    'modalityLoadBadge',
    'trackingStatus',
    'navigationComponent',
  ],

  [TOOLBAR_SECTIONS.viewportActionMenu.bottomLeft]: ['windowLevelMenu'],

  MoreTools: [
    'Reset',
    'rotate-right',
    'flipHorizontal',
    'ReferenceLines',
    'ImageOverlayViewer',
    'StackScroll',
    'invert',
    'Cine',
    'Magnify',
    'TagBrowser',
  ],
};

/**
 * Segmentation capability packs registered (at default scope) by the
 * cornerstone extension. These are pure "what can exist" packs and carry no
 * mode identity:
 *   - `cornerstone.segmentationToolbarButtons`  – segmentation editing button definitions
 *   - `cornerstone.segmentationToolbarSections` – toolbox/utilities section wiring
 *   - `cornerstone.segmentationModeToolbarSections` – a reusable segmentation-mode toolbar layout
 *
 * Modes compose these by name in their own `toolbarButtons` /
 * `toolbarSections` instance arrays; `?customization=` modules extend the
 * result through the `mode` phase.
 */
const segmentationToolbarCustomization = {
  'cornerstone.segmentationToolbarButtons': segmentationToolbarButtons,
  'cornerstone.segmentationToolbarSections': segmentationToolboxSections,
  'cornerstone.segmentationModeToolbarSections': segmentationModeToolbarSections,
};

export { segmentationToolbarButtons };
export default segmentationToolbarCustomization;
