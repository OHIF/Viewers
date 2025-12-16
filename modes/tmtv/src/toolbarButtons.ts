import { toolGroupIds } from './initToolGroups';
import i18n from 'i18next';

import { MIN_SEGMENTATION_DRAWING_RADIUS, MAX_SEGMENTATION_DRAWING_RADIUS } from './constants';

const setToolActiveToolbar = {
  commandName: 'setToolActiveToolbar',
  commandOptions: {
    toolGroupIds: [toolGroupIds.CT, toolGroupIds.PT, toolGroupIds.Fusion],
  },
};

const toolbarButtons = [
  {
    id: 'MeasurementTools',
    uiType: 'ohif.toolButtonList',
    props: {
      buttonSection: true,
    },
  },
  {
    id: 'SegmentationTools',
    uiType: 'ohif.toolBoxButton',
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
    id: 'Colorbar',
    uiType: 'ohif.colorbar',
    props: {
      type: 'tool',
      label: i18n.t('Buttons:Colorbar'),
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
    id: 'ArrowAnnotate',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-annotate',
      label: i18n.t('Buttons:Arrow Annotate'),
      tooltip: i18n.t('Buttons:Arrow Annotate Tool'),
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
      tooltip: i18n.t('Buttons:Ellipse Tool'),
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
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
    id: 'Crosshairs',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-crosshair',
      label: i18n.t('Buttons:Crosshairs'),
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
    id: 'RectangleROIStartEndThreshold',
    uiType: 'ohif.toolBoxButton',
    props: {
      icon: 'tool-create-threshold',
      label: i18n.t('Buttons:Rectangle ROI Threshold'),
      commands: setToolActiveToolbar,
      evaluate: [
        'evaluate.cornerstone.segmentation',
        {
          name: 'evaluate.cornerstoneTool',
          disabledText: i18n.t('Buttons:Select the PT Axial to enable this tool'),
        },
      ],
      options: 'tmtv.RectangleROIThresholdOptions',
    },
  },

  {
    id: 'Brush',
    uiType: 'ohif.toolButton',
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
          commands: 'setToolActiveToolbar',
        },
      ],
    },
  },
  {
    id: 'Eraser',
    uiType: 'ohif.toolButton',
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
    },
  },
  {
    id: 'Threshold',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'icon-tool-threshold',
      label: i18n.t('Buttons:Threshold Tool'),
      evaluate: [
        {
          name: 'evaluate.cornerstone.segmentation',
          toolNames: ['ThresholdCircularBrush', 'ThresholdSphereBrush'],
        },
        {
          name: 'evaluate.cornerstone.segmentation.synchronizeDrawingRadius',
          radiusOptionId: 'threshold-radius',
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
              ],
            },
          },
        },
        {
          name: i18n.t('Buttons:Threshold'),
          type: 'radio',
          id: 'dynamic-mode',
          value: 'ThresholdRange',
          values: [
            { value: 'ThresholdDynamic', label: i18n.t('Buttons:Dynamic') },
            { value: 'ThresholdRange', label: i18n.t('Buttons:Range') },
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
          name: i18n.t('Buttons:Shape'),
          type: 'radio',
          id: 'eraser-mode',
          value: 'ThresholdCircularBrush',
          values: [
            { value: 'ThresholdCircularBrush', label: i18n.t('Buttons:Circle') },
            { value: 'ThresholdSphereBrush', label: i18n.t('Buttons:Sphere') },
          ],
          condition: ({ options }) =>
            options.find(option => option.id === 'dynamic-mode').value === 'ThresholdRange',
          commands: 'setToolActiveToolbar',
        },
        {
          name: i18n.t('ROIThresholdConfiguration:ThresholdRange'),
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
];

export default toolbarButtons;
