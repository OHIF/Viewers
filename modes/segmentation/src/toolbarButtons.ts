import type { Button } from '@ohif/core/types';
import { ViewportGridService } from '@ohif/core';
import i18n from 'i18next';

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
  {
    id: 'AdvancedRenderingControls',
    uiType: 'ohif.advancedRenderingControls',
    props: {
      buttonSection: true,
    },
  },
  {
    id: 'modalityLoadBadge',
    uiType: 'ohif.modalityLoadBadge',
    props: {
      icon: 'Status',
      label: i18n.t('Buttons:Status'),
      tooltip: i18n.t('Buttons:Status'),
      evaluate: {
        name: 'evaluate.modalityLoadBadge',
        hideWhenDisabled: true,
      },
    },
  },
  {
    id: 'navigationComponent',
    uiType: 'ohif.navigationComponent',
    props: {
      icon: 'Navigation',
      label: i18n.t('Buttons:Navigation'),
      tooltip: i18n.t('Buttons:Navigate between segments/measurements and manage their visibility'),
      evaluate: {
        name: 'evaluate.navigationComponent',
        hideWhenDisabled: true,
      },
    },
  },
  {
    id: 'trackingStatus',
    uiType: 'ohif.trackingStatus',
    props: {
      icon: 'TrackingStatus',
      label: i18n.t('Buttons:Tracking Status'),
      tooltip: i18n.t('Buttons:View and manage tracking status of measurements and annotations'),
      evaluate: {
        name: 'evaluate.trackingStatus',
        hideWhenDisabled: true,
      },
    },
  },
  {
    id: 'dataOverlayMenu',
    uiType: 'ohif.dataOverlayMenu',
    props: {
      icon: 'ViewportViews',
      label: i18n.t('Buttons:Data Overlay'),
      tooltip: i18n.t(
        'Buttons:Configure data overlay options and manage foreground/background display sets'
      ),
      evaluate: 'evaluate.dataOverlayMenu',
    },
  },
  {
    id: 'orientationMenu',
    uiType: 'ohif.orientationMenu',
    props: {
      icon: 'OrientationSwitch',
      label: i18n.t('Buttons:Orientation'),
      tooltip: i18n.t(
        'Buttons:Change viewport orientation between axial, sagittal, coronal and reformat planes'
      ),
      evaluate: {
        name: 'evaluate.orientationMenu',
        // hideWhenDisabled: true,
      },
    },
  },
  {
    id: 'windowLevelMenuEmbedded',
    uiType: 'ohif.windowLevelMenuEmbedded',
    props: {
      icon: 'WindowLevel',
      label: i18n.t('Buttons:Window Level'),
      tooltip: i18n.t('Buttons:Adjust window/level presets and customize image contrast settings'),
      evaluate: {
        name: 'evaluate.windowLevelMenuEmbedded',
        hideWhenDisabled: true,
      },
    },
  },
  {
    id: 'windowLevelMenu',
    uiType: 'ohif.windowLevelMenu',
    props: {
      icon: 'WindowLevel',
      label: i18n.t('Buttons:Window Level'),
      tooltip: i18n.t('Buttons:Adjust window/level presets and customize image contrast settings'),
      evaluate: 'evaluate.windowLevelMenu',
    },
  },
  {
    id: 'voiManualControlMenu',
    uiType: 'ohif.voiManualControlMenu',
    props: {
      icon: 'WindowLevelAdvanced',
      label: i18n.t('Buttons:Advanced Window Level'),
      tooltip: i18n.t('Buttons:Advanced window/level settings with manual controls and presets'),
      evaluate: 'evaluate.voiManualControlMenu',
    },
  },
  {
    id: 'thresholdMenu',
    uiType: 'ohif.thresholdMenu',
    props: {
      icon: 'Threshold',
      label: i18n.t('Buttons:Threshold'),
      tooltip: i18n.t('Buttons:Image threshold settings'),
      evaluate: {
        name: 'evaluate.thresholdMenu',
        hideWhenDisabled: true,
      },
    },
  },
  {
    id: 'opacityMenu',
    uiType: 'ohif.opacityMenu',
    props: {
      icon: 'Opacity',
      label: i18n.t('Buttons:Opacity'),
      tooltip: i18n.t('Buttons:Image opacity settings'),
      evaluate: {
        name: 'evaluate.opacityMenu',
        hideWhenDisabled: true,
      },
    },
  },
  {
    id: 'Colorbar',
    uiType: 'ohif.colorbar',
    props: {
      type: 'tool',
      label: i18n.t('Buttons:Colorbar'),
    },
  },
  // sections
  {
    id: 'MoreTools',
    uiType: 'ohif.toolButtonList',
    props: {
      buttonSection: true,
    },
  },
  {
    id: 'BrushTools',
    uiType: 'ohif.toolBoxButtonGroup',
    props: {
      buttonSection: true,
    },
  },
  // Section containers for the nested toolboxes and toolbars.
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
    id: 'Zoom',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-zoom',
      label: i18n.t('Buttons:Zoom'),
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'WindowLevel',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-window-level',
      label: i18n.t('Buttons:Window Level'),
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'Pan',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-move',
      label: i18n.t('Buttons:Pan'),
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'TrackballRotate',
    uiType: 'ohif.toolButton',
    props: {
      type: 'tool',
      icon: 'tool-3d-rotate',
      label: i18n.t('Buttons:3D Rotate'),
      commands: setToolActiveToolbar,
      evaluate: {
        name: 'evaluate.cornerstoneTool',
        disabledText: i18n.t('Buttons:Select a 3D viewport to enable this tool'),
      },
    },
  },
  {
    id: 'Capture',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-capture',
      label: i18n.t('Buttons:Capture'),
      commands: 'showDownloadViewportModal',
      evaluate: [
        'evaluate.action',
        {
          name: 'evaluate.viewport.supported',
          unsupportedViewportTypes: ['video', 'wholeSlide'],
        },
      ],
    },
  },
  {
    id: 'Layout',
    uiType: 'ohif.layoutSelector',
    props: {
      rows: 3,
      columns: 4,
      evaluate: 'evaluate.action',
      commands: 'setViewportGridLayout',
    },
  },
  {
    id: 'Crosshairs',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-crosshair',
      label: i18n.t('Buttons:Crosshairs'),
      commands: {
        commandName: 'setToolActiveToolbar',
        commandOptions: {
          toolGroupIds: ['mpr'],
        },
      },
      evaluate: {
        name: 'evaluate.cornerstoneTool',
        disabledText: i18n.t('Buttons:Select an MPR viewport to enable this tool'),
      },
    },
  },
  {
    id: 'Reset',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-reset',
      label: i18n.t('Buttons:Reset View'),
      tooltip: i18n.t('Buttons:Reset View'),
      commands: 'resetViewport',
      evaluate: 'evaluate.action',
    },
  },
  {
    id: 'rotate-right',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-rotate-right',
      label: i18n.t('Buttons:Rotate Right'),
      tooltip: i18n.t('Buttons:Rotate +90'),
      commands: 'rotateViewportCW',
      evaluate: 'evaluate.action',
    },
  },
  {
    id: 'flipHorizontal',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-flip-horizontal',
      label: i18n.t('Buttons:Flip Horizontal'),
      tooltip: i18n.t('Buttons:Flip Horizontally'),
      commands: 'flipViewportHorizontal',
      evaluate: [
        'evaluate.viewportProperties.toggle',
        {
          name: 'evaluate.viewport.supported',
          unsupportedViewportTypes: ['volume3d'],
        },
      ],
    },
  },
  {
    id: 'ReferenceLines',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-referenceLines',
      label: i18n.t('Buttons:Reference Lines'),
      tooltip: i18n.t('Buttons:Show Reference Lines'),
      commands: 'toggleEnabledDisabledToolbar',
      evaluate: 'evaluate.cornerstoneTool.toggle',
    },
  },
  {
    id: 'ImageOverlayViewer',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'toggle-dicom-overlay',
      label: i18n.t('Buttons:Image Overlay'),
      tooltip: i18n.t('Buttons:Toggle Image Overlay'),
      commands: 'toggleEnabledDisabledToolbar',
      evaluate: 'evaluate.cornerstoneTool.toggle',
    },
  },
  {
    id: 'StackScroll',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-stack-scroll',
      label: i18n.t('Buttons:Stack Scroll'),
      tooltip: i18n.t('Buttons:Stack Scroll'),
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'invert',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-invert',
      label: i18n.t('Buttons:Invert'),
      tooltip: i18n.t('Buttons:Invert Colors'),
      commands: 'invertViewport',
      evaluate: 'evaluate.viewportProperties.toggle',
    },
  },
  {
    id: 'Cine',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-cine',
      label: i18n.t('Buttons:Cine'),
      tooltip: i18n.t('Buttons:Cine'),
      commands: 'toggleCine',
      evaluate: [
        'evaluate.cine',
        {
          name: 'evaluate.viewport.supported',
          unsupportedViewportTypes: ['volume3d'],
        },
      ],
    },
  },
  {
    id: 'Magnify',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-magnify',
      label: i18n.t('Buttons:Zoom-in'),
      tooltip: i18n.t('Buttons:Zoom-in'),
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'TagBrowser',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'dicom-tag-browser',
      label: i18n.t('Buttons:Dicom Tag Browser'),
      tooltip: i18n.t('Buttons:Dicom Tag Browser'),
      commands: 'openDICOMTagViewer',
    },
  },
  {
    id: 'PlanarFreehandContourSegmentationTool',
    uiType: 'ohif.toolBoxButton',
    props: {
      icon: 'icon-tool-freehand-roi',
      label: 'Freehand Segmentation',
      tooltip: 'Freehand Segmentation',
      evaluate: [
        {
          name: 'evaluate.cornerstone.segmentation',
          toolNames: ['PlanarFreehandContourSegmentationTool'],
          disabledText: 'Create new segmentation to enable this tool.',
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
          name: 'Interpolate Contours',
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
      label: 'Livewire Contour',
      tooltip: 'Livewire Contour',
      evaluate: [
        {
          name: 'evaluate.cornerstone.segmentation',
          toolNames: ['LivewireContourSegmentationTool'],
          disabledText: 'Create new segmentation to enable this tool.',
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
          name: 'Interpolate Contours',
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
      label: 'Spline Contour Segmentation Tool',
      tooltip: 'Spline Contour Segmentation Tool',
      evaluate: [
        {
          name: 'evaluate.cornerstone.segmentation',
          toolNames: ['CatmullRomSplineROI', 'LinearSplineROI', 'BSplineROI'],
          disabledText: 'Create new segmentation to enable this tool.',
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
          name: 'Spline Type',
          type: 'select',
          id: 'splineTypeSelect',
          value: 'CatmullRomSplineROI',
          values: [
            {
              id: 'CatmullRomSplineROI',
              value: 'CatmullRomSplineROI',
              label: 'Catmull Rom Spline',
            },
            { id: 'LinearSplineROI', value: 'LinearSplineROI', label: 'Linear Spline' },
            { id: 'BSplineROI', value: 'BSplineROI', label: 'B-Spline' },
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
          name: 'Simplified Spline',
          type: 'switch',
          id: 'simplifiedSpline',
          value: true,
          commands: {
            commandName: 'setSimplifiedSplineForSplineContourSegmentationTool',
          },
        },
        {
          name: 'Interpolate Contours',
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
      label: 'Sculptor Tool',
      tooltip: 'Sculptor Tool',
      evaluate: [
        {
          name: 'evaluate.cornerstone.segmentation',
          toolNames: ['SculptorTool'],
          disabledText: 'Create new segmentation to enable this tool.',
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
          name: 'Dynamic Cursor Size',
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
          name: 'Radius (mm)',
          id: 'brush-radius',
          type: 'range',
          min: 0.5,
          max: 99.5,
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
          name: 'Shape',
          type: 'radio',
          id: 'brush-mode',
          value: 'CircularBrush',
          values: [
            { value: 'CircularBrush', label: 'Circle' },
            { value: 'SphereBrush', label: 'Sphere' },
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
          name: 'Marker Mode',
          type: 'radio',
          id: 'marker-mode',
          value: 'markerInclude',
          values: [
            { value: 'markerInclude', label: 'Include' },
            { value: 'markerExclude', label: 'Exclude' },
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
          name: 'Clear Markers',
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
          name: 'evaluate.cornerstone.hasSegmentationOfType',
          segmentationRepresentationType: 'Labelmap',
        },
      ],
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
      label: 'Threshold Tool',
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
      label: 'Labelmap Edit with Contour Tool',
      tooltip: 'Labelmap Edit with Contour Tool',
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

export default toolbarButtons;
