import { WindowLevelMenuItem } from '@ohif/ui';
import { defaults } from '@ohif/core';
import type { Button } from '@ohif/core/types';

const { windowLevelPresets } = defaults;

function _createWwwcPreset(preset, title, subtitle) {
  return {
    id: preset.toString(),
    title,
    subtitle,
    commands: {
      commandName: 'setWindowLevel',
      commandOptions: {
        ...windowLevelPresets[preset],
      },
      context: 'CORNERSTONE',
    },
  };
}

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
    id: 'measurementSection',
    uiType: 'ohif.toolButtonList',
    props: {
      buttonSection: 'measurementSection',
      groupId: 'measurementSection',
      evaluate: 'evaluate.group.promoteToPrimaryIfCornerstoneToolNotActiveInTheList',
    },
  },
  {
    id: 'MoreTools',
    uiType: 'ohif.toolButtonList',
    props: {
      buttonSection: 'moreToolsSection',
      groupId: 'MoreTools',
      evaluate: 'evaluate.group.promoteToPrimaryIfCornerstoneToolNotActiveInTheList',
    },
  },

  // tool defs
  {
    id: 'Length',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-length',
      label: 'Length',
      tooltip: 'Length Tool',
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
      label: 'Bidirectional',
      tooltip: 'Bidirectional Tool',
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
      label: 'Ellipse',
      tooltip: 'Ellipse ROI',
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
      label: 'Circle',
      tooltip: 'Circle Tool',
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
      label: 'Zoom',
      tooltip: 'Zoom',
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
    id: 'WindowLevel',
    uiType: 'ohif.toolButtonList',
    props: {
      groupId: 'WindowLevel',
      primary: {
        id: 'WindowLevel',
        icon: 'tool-window-level',
        label: 'Window Level',
        tooltip: 'Window Level',
        commands: {
          ...setToolActiveToolbar,
          commandOptions: {
            ...setToolActiveToolbar.commandOptions,
            toolName: 'WindowLevel',
          },
        },
        evaluate: 'evaluate.cornerstoneTool',
      },
      secondary: {
        icon: 'chevron-down',
        tooltip: 'W/L Presets',
      },
      renderer: WindowLevelMenuItem,
      items: [
        _createWwwcPreset(1, 'Soft tissue', '400 / 40'),
        _createWwwcPreset(2, 'Lung', '1500 / -600'),
        _createWwwcPreset(3, 'Liver', '150 / 90'),
        _createWwwcPreset(4, 'Bone', '2500 / 480'),
        _createWwwcPreset(5, 'Brain', '80 / 40'),
      ],
    },
  },
  {
    id: 'Pan',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-move',
      label: 'Pan',
      tooltip: 'Pan',
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
      label: 'Capture',
      tooltip: 'Capture',
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
      label: 'Reset View',
      tooltip: 'Reset View',
      commands: 'resetViewport',
      evaluate: 'evaluate.action',
    },
  },
  {
    id: 'RotateRight',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-rotate-right',
      label: 'Rotate Right',
      tooltip: 'Rotate Right +90',
      commands: 'rotateViewportCW',
      evaluate: 'evaluate.action',
    },
  },
  {
    id: 'FlipHorizontal',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-flip-horizontal',
      label: 'Flip Horizontally',
      tooltip: 'Flip Horizontally',
      commands: 'flipViewportHorizontal',
      evaluate: 'evaluate.action',
    },
  },
  {
    id: 'StackScroll',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-stack-scroll',
      label: 'Stack Scroll',
      tooltip: 'Stack Scroll',
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
      label: 'Invert Colors',
      tooltip: 'Invert Colors',
      commands: 'invertViewport',
      evaluate: 'evaluate.action',
    },
  },
  {
    id: 'CalibrationLine',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-calibration',
      label: 'Calibration Line',
      tooltip: 'Calibration Line',
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
