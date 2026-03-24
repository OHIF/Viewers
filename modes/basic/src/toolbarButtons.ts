import type { Button } from '@ohif/core/types';

import { EVENTS } from '@cornerstonejs/core';
import { ViewportGridService } from '@ohif/core';
import i18n from 'i18next';

const MIN_SEGMENTATION_DRAWING_RADIUS = 0.5;
const MAX_SEGMENTATION_DRAWING_RADIUS = 99.5;

const callbacks = (toolName: string) => [
  {
    commandName: 'setViewportForToolConfiguration',
    commandOptions: {
      toolName,
    },
  },
];

export const setToolActiveToolbar = {
  commandName: 'setToolActiveToolbar',
  commandOptions: {
    toolGroupIds: ['default', 'mpr', 'SRToolGroup', 'volume3d'],
  },
};

const toolbarButtons: Button[] = [
  // sections
  {
    id: 'MeasurementTools',
    uiType: 'ohif.toolButtonList',
    props: {
      buttonSection: true,
    },
  },
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
  {
    id: 'LabelMapTools',
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
    id: 'AdvancedRenderingControls',
    uiType: 'ohif.advancedRenderingControls',
    props: {
      buttonSection: true,
    },
  },
  // tool defs
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
      evaluate: {
        name: 'evaluate.windowLevelMenu',
      },
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
      evaluate: [
        'evaluate.action',
        {
          name: 'evaluate.viewport.supported',
          unsupportedViewportTypes: ['video'],
        },
      ],
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
          unsupportedViewportTypes: ['video', 'volume3d'],
        },
      ],
    },
  },
  {
    id: 'ImageSliceSync',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'link',
      label: i18n.t('Buttons:Image Slice Sync'),
      tooltip: i18n.t('Buttons:Enable position synchronization on stack viewports'),
      commands: {
        commandName: 'toggleSynchronizer',
        commandOptions: {
          type: 'imageSlice',
        },
      },
      listeners: {
        [EVENTS.VIEWPORT_NEW_IMAGE_SET]: {
          commandName: 'toggleImageSliceSync',
          commandOptions: { toggledState: true },
        },
      },
      evaluate: [
        'evaluate.cornerstone.synchronizer',
        {
          name: 'evaluate.viewport.supported',
          unsupportedViewportTypes: ['video', 'volume3d'],
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
      listeners: {
        [ViewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED]: callbacks('ReferenceLines'),
        [ViewportGridService.EVENTS.VIEWPORTS_READY]: callbacks('ReferenceLines'),
      },
      evaluate: [
        'evaluate.cornerstoneTool.toggle',
        {
          name: 'evaluate.viewport.supported',
          unsupportedViewportTypes: ['video'],
        },
      ],
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
      evaluate: [
        'evaluate.cornerstoneTool.toggle',
        {
          name: 'evaluate.viewport.supported',
          unsupportedViewportTypes: ['video'],
        },
      ],
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
      evaluate: [
        'evaluate.viewportProperties.toggle',
        {
          name: 'evaluate.viewport.supported',
          unsupportedViewportTypes: ['video'],
        },
      ],
    },
  },
  {
    id: 'Probe',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-probe',
      label: i18n.t('Buttons:Probe'),
      tooltip: i18n.t('Buttons:Probe'),
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
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
    id: 'Angle',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-angle',
      label: i18n.t('Buttons:Angle'),
      tooltip: i18n.t('Buttons:Angle'),
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'CobbAngle',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'icon-tool-cobb-angle',
      label: i18n.t('Buttons:Cobb Angle'),
      tooltip: i18n.t('Buttons:Cobb Angle'),
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'ABCSplitAngle',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-angle',
      label: 'ABC Split Angle',
      tooltip: 'Draw A-B-C, auto-create D, and calculate both triangle angles',
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
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
      evaluate: [
        'evaluate.cornerstoneTool',
        {
          name: 'evaluate.viewport.supported',
          unsupportedViewportTypes: ['video'],
        },
      ],
    },
  },
  {
    id: 'CalibrationLine',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-calibration',
      label: i18n.t('Buttons:Calibration'),
      tooltip: i18n.t('Buttons:Calibration Line'),
      commands: setToolActiveToolbar,
      evaluate: [
        'evaluate.cornerstoneTool',
        {
          name: 'evaluate.viewport.supported',
          unsupportedViewportTypes: ['video'],
        },
      ],
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
    id: 'AdvancedMagnify',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'icon-tool-loupe',
      label: i18n.t('Buttons:Magnify Probe'),
      tooltip: i18n.t('Buttons:Magnify Probe'),
      commands: 'toggleActiveDisabledToolbar',
      evaluate: [
        'evaluate.cornerstoneTool.toggle.ifStrictlyDisabled',
        {
          name: 'evaluate.viewport.supported',
          unsupportedViewportTypes: ['video'],
        },
      ],
    },
  },
  {
    id: 'UltrasoundDirectionalTool',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'icon-tool-ultrasound-bidirectional',
      label: i18n.t('Buttons:Ultrasound Directional'),
      tooltip: i18n.t('Buttons:Ultrasound Directional'),
      commands: setToolActiveToolbar,
      evaluate: [
        'evaluate.cornerstoneTool',
        {
          name: 'evaluate.modality.supported',
          supportedModalities: ['US'],
        },
      ],
    },
  },
  {
    id: 'WindowLevelRegion',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'icon-tool-window-region',
      label: i18n.t('Buttons:Window Level Region'),
      tooltip: i18n.t('Buttons:Window Level Region'),
      commands: setToolActiveToolbar,
      evaluate: [
        'evaluate.cornerstoneTool',
        {
          name: 'evaluate.viewport.supported',
          unsupportedViewportTypes: ['video'],
        },
      ],
    },
  },
  {
    id: 'Length',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-length',
      label: i18n.t('Buttons:Length'),
      tooltip: i18n.t('Buttons:Length Tool'),
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'Bidirectional',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-bidirectional',
      label: i18n.t('Buttons:Bidirectional'),
      tooltip: i18n.t('Buttons:Bidirectional Tool'),
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'ECGBidirectional',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-cobb-angle',
      label: 'ECG QTc',
      tooltip: 'ECG QTc — Click 3 points: A=QRS-onset, B=T-end, C=next QRS-onset. Calculates QT, RR, QTc Bazett and QTc Fridericia.',
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'ArrowAnnotate',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-annotate',
      label: i18n.t('Buttons:Annotation'),
      tooltip: i18n.t('Buttons:Arrow Annotate'),
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'EllipticalROI',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-ellipse',
      label: i18n.t('Buttons:Ellipse'),
      tooltip: i18n.t('Buttons:Ellipse ROI'),
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'RectangleROI',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-rectangle',
      label: i18n.t('Buttons:Rectangle'),
      tooltip: i18n.t('Buttons:Rectangle ROI'),
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'CircleROI',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-circle',
      label: i18n.t('Buttons:Circle'),
      tooltip: i18n.t('Buttons:Circle Tool'),
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'PlanarFreehandROI',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'icon-tool-freehand-roi',
      label: i18n.t('Buttons:Freehand ROI'),
      tooltip: i18n.t('Buttons:Freehand ROI'),
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'SplineROI',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'icon-tool-spline-roi',
      label: i18n.t('Buttons:Spline ROI'),
      tooltip: i18n.t('Buttons:Spline ROI'),
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'LivewireContour',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'icon-tool-livewire',
      label: i18n.t('Buttons:Livewire tool'),
      tooltip: i18n.t('Buttons:Livewire tool'),
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  // Window Level
  {
    id: 'WindowLevel',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-window-level',
      label: i18n.t('Buttons:Window Level'),
      commands: setToolActiveToolbar,
      evaluate: [
        'evaluate.cornerstoneTool',
        {
          name: 'evaluate.viewport.supported',
          unsupportedViewportTypes: ['wholeSlide'],
        },
      ],
    },
  },
  {
    id: 'Pan',
    uiType: 'ohif.toolButton',
    props: {
      type: 'tool',
      icon: 'tool-move',
      label: i18n.t('Buttons:Pan'),
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'Zoom',
    uiType: 'ohif.toolButton',
    props: {
      type: 'tool',
      icon: 'tool-zoom',
      label: i18n.t('Buttons:Zoom'),
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
    },
  },
  {
    id: 'Crosshairs',
    uiType: 'ohif.toolButton',
    props: {
      type: 'tool',
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
    id: 'SegmentLabelTool',
    uiType: 'ohif.toolBoxButton',
    props: {
      icon: 'tool-segment-label',
      label: i18n.t('Buttons:Segment Label Display'),
      tooltip: i18n.t(
        'Buttons:Click to show or hide segment labels when hovering with your mouse.'
      ),
      commands: { commandName: 'toggleSegmentLabel' },
      evaluate: [
        'evaluate.cornerstoneTool.toggle',
        {
          name: 'evaluate.cornerstone.hasSegmentation',
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
          name: 'evaluate.cornerstone.segmentation.activeTool',
          toolNames: ['CircularBrush', 'SphereBrush'],
        },
        {
          name: 'evaluate.cornerstone.segmentation.synchronizeDrawingRadius',
          radiusOptionId: 'brush-radius',
        },
        'evaluate.action',
      ],
      commands: [
        {
          commandName: 'setToolActiveToolbar',
          commandOptions: {
            toolName: 'CircularBrush',
            toolGroupIds: ['default', 'mpr', 'SRToolGroup', 'volume3d'],
          },
        },
        {
          commandName: 'activateSelectedSegmentationOfType',
          commandOptions: {
            segmentationRepresentationType: 'Labelmap',
          },
        },
      ],
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
          commands: {
            commandName: 'setBrushSize',
            commandOptions: { toolNames: ['CircularBrush', 'SphereBrush'] },
          },
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
          commands: setToolActiveToolbar,
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
          name: 'evaluate.cornerstone.segmentation.activeTool',
          toolNames: ['CircularEraser', 'SphereEraser'],
        },
        {
          name: 'evaluate.cornerstone.segmentation.synchronizeDrawingRadius',
          radiusOptionId: 'eraser-radius',
        },
        'evaluate.action',
      ],
      commands: [
        {
          commandName: 'setToolActiveToolbar',
          commandOptions: {
            toolName: 'CircularEraser',
            toolGroupIds: ['default', 'mpr', 'SRToolGroup', 'volume3d'],
          },
        },
        {
          commandName: 'activateSelectedSegmentationOfType',
          commandOptions: {
            segmentationRepresentationType: 'Labelmap',
          },
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
          commands: setToolActiveToolbar,
        },
      ],
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
          name: 'evaluate.cornerstone.segmentation.activeTool',
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
        'evaluate.action',
      ],
      commands: [
        {
          commandName: 'setToolActiveToolbar',
          commandOptions: {
            toolName: 'ThresholdCircularBrush',
            toolGroupIds: ['default', 'mpr', 'SRToolGroup', 'volume3d'],
          },
        },
        {
          commandName: 'activateSelectedSegmentationOfType',
          commandOptions: {
            segmentationRepresentationType: 'Labelmap',
          },
        },
      ],
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
      evaluate: 'evaluate.action',
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
    id: 'InterpolateLabelmap',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'actions-interpolate',
      label: i18n.t('Buttons:Interpolate Labelmap'),
      tooltip: i18n.t(
        'Buttons:Automatically fill in missing slices between drawn segments. Use brush or threshold tools on at least two slices, then click to interpolate across slices. Works in any direction. Volume must be reconstructable.'
      ),
      evaluate: 'evaluate.action',
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
      evaluate: 'evaluate.action',
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
      evaluate: 'evaluate.action',
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
      evaluate: 'evaluate.action',
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
      evaluate: 'evaluate.action',
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
      evaluate: 'evaluate.action',
    },
  },
  // {
  //   id: 'Undo',
  //   uiType: 'ohif.toolButton',
  //   props: {
  //     type: 'tool',
  //     icon: 'prev-arrow',
  //     label: 'Undo',
  //     commands: {
  //       commandName: 'undo',
  //     },
  //     evaluate: 'evaluate.action',
  //   },
  // },
  // {
  //   id: 'Redo',
  //   uiType: 'ohif.toolButton',
  //   props: {
  //     type: 'tool',
  //     icon: 'next-arrow',
  //     label: 'Redo',
  //     commands: {
  //       commandName: 'redo',
  //     },
  //     evaluate: 'evaluate.action',
  //   },
  // },
  {
    id: 'ECGViewer',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tab-linear',
      label: i18n.t('Buttons:ECG Viewer'),
      tooltip: i18n.t('Buttons:Open ECG Viewer Panel'),
      commands: {
        commandName: 'activatePanel',
        commandOptions: {
          panelId: 'dynamic-ecg-viewer',
        },
      },
      evaluate: 'evaluate.action',
    },
  },
];

export default toolbarButtons;
