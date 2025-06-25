// TODO: torn, can either bake this here; or have to create a whole new button type
// Only ways that you can pass in a custom React component for render :
import {
  // ListMenu,
  WindowLevelMenuItem,
} from '@ohif/ui';
import { defaults, ToolbarService } from '@ohif/core';
import type { Button } from '@ohif/core/types';

const { windowLevelPresets } = defaults;
const { createButton } = ToolbarService;

function _createWwwcPreset(preset, title, subtitle) {
  return {
    id: preset.toString(),
    title,
    subtitle,
    commands: [
      {
        commandName: 'setWindowLevel',
        commandOptions: {
          ...windowLevelPresets[preset],
        },
        context: 'CORNERSTONE',
      },
    ],
  };
}

export const setToolActiveToolbar = {
  commandName: 'setToolActiveToolbar',
  commandOptions: {
    toolGroupIds: ['default'],
  },
};

const toolbarButtonsValidated: Button[] = [
  {
    id: 'ResetButton',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'icon-transferring',
      label: 'Reset predictions',
      commands: {
        commandName: 'resetPoints',
        context: 'VIEWER',
      },
      evaluate: () => {
        return {
          disabled: true,
        };
      },
    },
  },
  {
    id: 'Length',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-length',
      label: 'Length',
      commands: setToolActiveToolbar,
      evaluate: () => {
        return {
          disabled: true,
        };
      },
    },
  },
  {
    id: 'RectangleROI',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-rectangle',
      label: 'Rectangle',
      commands: setToolActiveToolbar,
      evaluate: () => {
        return {
          disabled: true,
        };
      },
    },
  },
  {
    id: 'Angle',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-angle',
      label: 'Angle',
      commands: setToolActiveToolbar,
      evaluate: () => {
        return {
          disabled: true,
        };
      },
    },
  },
  {
    id: 'Probe',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-probe',
      label: 'Probe',
      commands: setToolActiveToolbar,
      evaluate: () => {
        return {
          disabled: true,
        };
      },
    },
  },
  {
    id: 'CalibrationLine',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-calibration',
      label: 'Calibration',
      commands: setToolActiveToolbar,
      evaluate: () => {
        return {
          disabled: true,
        };
      },
    },
  },
  // Window Level
  {
    id: 'WindowLevel',
    uiType: 'ohif.toolButtonList',
    props: {
      // commands: setToolActiveToolbar,
      // evaluate: 'evaluate.cornerstoneTool',
      buttonSection: 'windowLevelSection',
      groupId: 'windowLevelsTools',
    },
  },
  {
    id: 'SoftTissueWindowLevel',
    uiType: 'ohif.toolButton',
    props: {
      label: 'Soft Tissue',
      tooltip: 'Soft Tissue',
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  // Pan...
  {
    id: 'Pan',
    uiType: 'ohif.toolButton',
    props: {
      type: 'tool',
      icon: 'tool-move',
      label: 'Pan',
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
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
    id: 'Zoom',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-zoom',
      label: 'Zoom',
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'Reset',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-reset',
      tooltip: 'Reset View',
      label: 'Reset image position',
      commands: [
        {
          commandName: 'resetViewport',
          context: 'CORNERSTONE',
        },
      ],
      evaluate: 'evaluate.action',
    },
  },
];

export default toolbarButtonsValidated;
