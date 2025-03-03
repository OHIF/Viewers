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
    uiType: 'ohif.radioGroup',
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
    uiType: 'ohif.radioGroup',
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
    uiType: 'ohif.radioGroup',
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
    uiType: 'ohif.radioGroup',
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
    uiType: 'ohif.radioGroup',
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
    uiType: 'ohif.radioGroup',
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
    uiType: 'ohif.splitButton',
    props: {
      groupId: 'WindowLevel',
      primary: createButton({
        id: 'WindowLevel',
        icon: 'tool-window-level',
        label: 'Window Level',
        tooltip: 'Window Level',
        commands: setToolActiveToolbar,
        evaluate: 'evaluate.cornerstoneTool',
      }),
      secondary: {
        icon: 'chevron-down',
        label: 'W/L Manual',
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
  // Pan...
  {
    id: 'Pan',
    uiType: 'ohif.radioGroup',
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
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'tool-zoom',
      label: 'Zoom',
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'Reset',
    uiType: 'ohif.radioGroup',
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
