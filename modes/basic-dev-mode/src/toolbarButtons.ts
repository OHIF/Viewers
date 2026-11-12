import type { Button } from '@ohif/core/types';
import i18n from 'i18next';

export const setToolActiveToolbar = {
  commandName: 'setToolActive',
  commandOptions: {
    toolGroupIds: ['default', 'mpr'],
  },
  context: 'CORNERSTONE',
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

  // tool defs
  {
    id: 'Length',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-length',
      label: i18n.t('Buttons:Length'),
      tooltip: i18n.t('Buttons:Length Tool'),
      commands: {
        ...setToolActiveToolbar,
        commandOptions: {
          ...setToolActiveToolbar.commandOptions,
          toolName: 'Length',
        },
      },
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
      commands: {
        ...setToolActiveToolbar,
        commandOptions: {
          ...setToolActiveToolbar.commandOptions,
          toolName: 'Bidirectional',
        },
      },
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
      commands: {
        ...setToolActiveToolbar,
        commandOptions: {
          ...setToolActiveToolbar.commandOptions,
          toolName: 'EllipticalROI',
        },
      },
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
      commands: {
        ...setToolActiveToolbar,
        commandOptions: {
          ...setToolActiveToolbar.commandOptions,
          toolName: 'CircleROI',
        },
      },
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'Zoom',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-zoom',
      label: i18n.t('Buttons:Zoom'),
      tooltip: i18n.t('Buttons:Zoom'),
      commands: {
        ...setToolActiveToolbar,
        commandOptions: {
          ...setToolActiveToolbar.commandOptions,
          toolName: 'Zoom',
        },
      },
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'Pan',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-move',
      label: i18n.t('Buttons:Pan'),
      tooltip: i18n.t('Buttons:Pan'),
      commands: {
        ...setToolActiveToolbar,
        commandOptions: {
          ...setToolActiveToolbar.commandOptions,
          toolName: 'Pan',
        },
      },
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'Capture',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-capture',
      label: i18n.t('Buttons:Capture'),
      tooltip: i18n.t('Buttons:Capture'),
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
    id: 'RotateRight',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-rotate-right',
      label: i18n.t('Buttons:Rotate Right'),
      tooltip: i18n.t('Buttons:Rotate Right +90'),
      commands: 'rotateViewportCW',
      evaluate: 'evaluate.action',
    },
  },
  {
    id: 'FlipHorizontal',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-flip-horizontal',
      label: i18n.t('Buttons:Flip Horizontally'),
      tooltip: i18n.t('Buttons:Flip Horizontally'),
      commands: 'flipViewportHorizontal',
      evaluate: 'evaluate.action',
    },
  },
  {
    id: 'StackScroll',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-stack-scroll',
      label: i18n.t('Buttons:Stack Scroll'),
      tooltip: i18n.t('Buttons:Stack Scroll'),
      commands: {
        ...setToolActiveToolbar,
        commandOptions: {
          ...setToolActiveToolbar.commandOptions,
          toolName: 'StackScroll',
        },
      },
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'Invert',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-invert',
      label: i18n.t('Buttons:Invert Colors'),
      tooltip: i18n.t('Buttons:Invert Colors'),
      commands: 'invertViewport',
      evaluate: 'evaluate.action',
    },
  },
  {
    id: 'CalibrationLine',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-calibration',
      label: i18n.t('Buttons:Calibration Line'),
      tooltip: i18n.t('Buttons:Calibration Line'),
      commands: {
        ...setToolActiveToolbar,
        commandOptions: {
          ...setToolActiveToolbar.commandOptions,
          toolName: 'CalibrationLine',
        },
      },
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
];

export default toolbarButtons;
