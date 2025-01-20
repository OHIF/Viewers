import {
  WindowLevelMenuItem,
} from '@ohif/ui';
import { defaults, ToolbarService } from '@ohif/core';
import type { Button } from '@ohif/core/types';

const { windowLevelPresets } = defaults;

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

function _createSetToolActiveCommands(toolName, toolGroupIds = ['default', 'mpr', ]) {
  return toolGroupIds.map(toolGroupId => ({
    commandName: 'setToolActive',
    commandOptions: {
      toolGroupId,
      toolName,
    },
    context: 'CORNERSTONE',
  }));
}

const toolbarButtons: Button[] = [
  {
    id: 'MeasurementTools',
    uiType: 'ohif.splitButton',
    props: {
      groupId: 'MeasurementTools',
      evaluate: 'evaluate.group.promoteToPrimaryIfCornerstoneToolNotActiveInTheList',
      primary: ToolbarService.createButton({
        id: 'Length',
        icon: 'tool-length',
        label: 'Length',
        tooltip: 'Length Tool',
        commands: _createSetToolActiveCommands('Length'),
        evaluate: 'evaluate.cornerstoneTool',
      }),
      secondary: {
        icon: 'chevron-down',
        tooltip: 'More Measure Tools',
      },
      items: [
        ToolbarService.createButton({
          id: 'Bidirectional',
          icon: 'tool-bidirectional',
          label: 'Bidirectional',
          tooltip: 'Bidirectional Tool',
          commands: _createSetToolActiveCommands('Bidirectional'),
          evaluate: 'evaluate.cornerstoneTool',
        }),
        ToolbarService.createButton({
          id: 'EllipticalROI',
          icon: 'tool-ellipse',
          label: 'Ellipse',
          tooltip: 'Ellipse ROI',
          commands: _createSetToolActiveCommands('EllipticalROI'),
          evaluate: 'evaluate.cornerstoneTool',
        }),
        ToolbarService.createButton({
          id: 'CircleROI',
          icon: 'tool-circle',
          label: 'Circle',
          tooltip: 'Circle Tool',
          commands: _createSetToolActiveCommands('CircleROI'),
          evaluate: 'evaluate.cornerstoneTool',
        }),
      ],
    },
  },
  {
    id: 'Zoom',
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'tool-zoom',
      label: 'Zoom',
      commands: _createSetToolActiveCommands('Zoom'),
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'WindowLevel',
    uiType: 'ohif.splitButton',
    props: {
      groupId: 'WindowLevel',
      primary: ToolbarService.createButton({
        id: 'WindowLevel',
        icon: 'tool-window-level',
        label: 'Window Level',
        tooltip: 'Window Level',
        commands: _createSetToolActiveCommands('WindowLevel'),
        evaluate: 'evaluate.cornerstoneTool',
      }),
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
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'tool-move',
      label: 'Pan',
      commands: _createSetToolActiveCommands('Pan'),
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'Capture',
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'tool-capture',
      label: 'Capture',
      commands: [
        {
          commandName: 'showDownloadViewportModal',
          context: 'CORNERSTONE',
        },
      ],
      evaluate: 'evaluate.action',
    },
  },
   {
    id: 'Layout',
    uiType: 'ohif.layoutSelector',
    props: {
      rows: 3,
      columns: 4,
      evaluate: 'evaluate.action',
      commands: [
        {
          commandName: 'setViewportGridLayout',
        },
      ],
    },
  },
  {
  id: 'MoreTools',
  uiType: 'ohif.splitButton',
  props: {
    groupId: 'MoreTools',
    evaluate: 'evaluate.group.promoteToPrimaryIfCornerstoneToolNotActiveInTheList',
    primary: ToolbarService.createButton({
      id: 'Reset',
      icon: 'tool-reset',
      label: 'Reset View',
      tooltip: 'Reset View',
      commands: [
        {
          commandName: 'resetViewport',
          context: 'CORNERSTONE',
        },
      ],
      evaluate: 'evaluate.action',
    }),
    secondary: {
      icon: 'chevron-down',
      tooltip: 'More Tools',
    },
    items: [
      ToolbarService.createButton({
      id: 'Reset',
      icon: 'tool-reset',
      label: 'Reset View',
      tooltip: 'Reset View',
      commands: [
        {
          commandName: 'resetViewport',
          context: 'CORNERSTONE',
        },
      ],
      evaluate: 'evaluate.action',
    }),
      ToolbarService.createButton({
        id: 'RotateRight',
        icon: 'tool-rotate-right',
        label: 'Rotate Right',
        tooltip: 'Rotate Right +90',
        commands: [
          {
            commandName: 'rotateViewportCW',
            context: 'CORNERSTONE',
          },
        ],
        evaluate: 'evaluate.action',
      }),
      ToolbarService.createButton({
        id: 'FlipHorizontal',
        icon: 'tool-flip-horizontal',
        label: 'Flip Horizontally',
        tooltip: 'Flip Horizontally',
        commands: [
          {
            commandName: 'flipViewportHorizontal',
            context: 'CORNERSTONE',
          },
        ],
        evaluate: 'evaluate.action',
      }),
      ToolbarService.createButton({
        id: 'StackScroll',
        icon: 'tool-stack-scroll',
        label: 'Stack Scroll',
        tooltip: 'Stack Scroll',
        commands: _createSetToolActiveCommands('StackScroll'),
        evaluate: 'evaluate.cornerstoneTool',
      }),
      ToolbarService.createButton({
        id: 'Invert',
        icon: 'tool-invert',
        label: 'Invert Colors',
        tooltip: 'Invert Colors',
        commands: [
          {
            commandName: 'invertViewport',
            context: 'CORNERSTONE',
          },
        ],
        evaluate: 'evaluate.action',
      }),
      ToolbarService.createButton({
        id: 'CalibrationLine',
        icon: 'tool-calibration',
        label: 'Calibration Line',
        tooltip: 'Calibration Line',
        commands: _createSetToolActiveCommands('CalibrationLine'),
        evaluate: 'evaluate.cornerstoneTool',
      }),

    ],
  },
},
];

export default toolbarButtons;
