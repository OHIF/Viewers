import { WindowLevelMenuItem } from '@ohif/ui';
import { ToolbarService, defaults } from '@ohif/core';
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

const toolbarButtons: Button[] = [
  {
    id: 'MeasurementTools',
    uiType: 'ohif.splitButton',
    props: {
      groupId: 'MeasurementToolsGroupId',
      evaluate: 'evaluate.group.promoteToPrimaryIfCornerstoneToolNotActiveInTheList',
      primary: ToolbarService.createButton({
        id: 'Length',
        icon: 'tool-length',
        label: 'Length',
        tooltip: 'Length Tool',
        commands: [
          {
            commandName: 'setToolActive',
            commandOptions: {
              toolName: 'Length',
            },
            context: 'CORNERSTONE',
          },
          {
            commandName: 'setToolActive',
            commandOptions: {
              toolName: 'SRLength',
              toolGroupId: 'SRToolGroup',
            },
            context: 'CORNERSTONE',
          },
        ],
        evaluate: 'evaluate.cornerstoneTool',
      }),
      secondary: {
        icon: 'chevron-down',
        tooltip: 'More Measure Tools',
      },
      items: [
        ToolbarService.createButton({
          id: 'Length',
          icon: 'tool-length',
          label: 'Length',
          tooltip: 'Length Tool',
          commands: [
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: 'Length',
              },
              context: 'CORNERSTONE',
            },
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: 'SRLength',
                toolGroupId: 'SRToolGroup',
              },
              context: 'CORNERSTONE',
            },
          ],
          evaluate: 'evaluate.cornerstoneTool',
        }),
        ToolbarService.createButton({
          id: 'Bidirectional',
          icon: 'tool-bidirectional',
          label: 'Bidirectional',
          tooltip: 'Bidirectional Tool',
          commands: [
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: 'Bidirectional',
              },
              context: 'CORNERSTONE',
            },
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: 'SRBidirectional',
                toolGroupId: 'SRToolGroup',
              },
              context: 'CORNERSTONE',
            },
          ],
          evaluate: 'evaluate.cornerstoneTool',
        }),
        ToolbarService.createButton({
          id: 'ArrowAnnotate',
          icon: 'tool-annotate',
          label: 'Arrow Annotate',
          tooltip: 'Arrow Annotate Tool',
          commands: [
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: 'ArrowAnnotate',
              },
              context: 'CORNERSTONE',
            },
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: 'SRArrowAnnotate',
                toolGroupId: 'SRToolGroup',
              },
              context: 'CORNERSTONE',
            },
          ],
          evaluate: 'evaluate.cornerstoneTool',
        }),
        ToolbarService.createButton({
          id: 'EllipticalROI',
          icon: 'tool-ellipse',
          label: 'Ellipse',
          tooltip: 'Ellipse ROI Tool',
          commands: [
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: 'EllipticalROI',
              },
              context: 'CORNERSTONE',
            },
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: 'SREllipticalROI',
                toolGroupId: 'SRToolGroup',
              },
              context: 'CORNERSTONE',
            },
          ],
          evaluate: 'evaluate.cornerstoneTool',
        }),
        ToolbarService.createButton({
          id: 'CircleROI',
          icon: 'tool-circle',
          label: 'Circle',
          tooltip: 'Circle ROI Tool',
          commands: [
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: 'CircleROI',
              },
              context: 'CORNERSTONE',
            },
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: 'SRCircleROI',
                toolGroupId: 'SRToolGroup',
              },
              context: 'CORNERSTONE',
            },
          ],
          evaluate: 'evaluate.cornerstoneTool',
        }),
        // Repeated structure for other tools like Bidirectional, ArrowAnnotate, etc.
      ],
    },
  },
  {
    id: 'Zoom',
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'tool-zoom',
      label: 'Zoom',
      commands: [
        {
          commandName: 'setToolActive',
          commandOptions: {
            toolName: 'Zoom',
          },
          context: 'CORNERSTONE',
        },
      ],
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'WindowLevel',
    uiType: 'ohif.splitButton',
    props: {
      groupId: 'WindowLevelGroupId',
      primary: ToolbarService.createButton({
        id: 'WindowLevel',
        icon: 'tool-window-level',
        label: 'Window Level',
        tooltip: 'Window Level',
        commands: [
          {
            commandName: 'setToolActive',
            commandOptions: {
              toolName: 'WindowLevel',
            },
            context: 'CORNERSTONE',
          },
        ],
        evaluate: 'evaluate.cornerstoneTool',
      }),
      secondary: {
        icon: 'chevron-down',
        tooltip: 'W/L Presets',
      },
      renderer: WindowLevelMenuItem,
      items: [
        _createWwwcPreset(1, 'Soft tissue', '400 / 40'),
        // Repeated for other presets
      ],
    },
  },
  {
    id: 'Pan',
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'tool-move',
      label: 'Pan',
      commands: [
        {
          commandName: 'setToolActive',
          commandOptions: {
            toolName: 'Pan',
          },
          context: 'CORNERSTONE',
        },
      ],
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'Capture',
    uiType: 'ohif.action',
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
    uiType: 'ohif.splitButton',
    props: {
      groupId: 'LayoutToolsGroupId',
      evaluate: 'evaluate.action',
      primary: ToolbarService.createButton({
        id: 'GridLayout',
        icon: 'tool-layout',
        label: 'Grid Layout',
        tooltip: 'Grid Layout',
        commands: [
          {
            commandName: 'setLayout',
            commandOptions: { rows: 4, columns: 4 },
            context: 'CORNERSTONE',
          },
        ],
        evaluate: 'evaluate.action',
      }),
      secondary: {
        icon: 'chevron-down',
        tooltip: 'Hanging Protocols',
      },
      items: [
        ToolbarService.createButton({
          id: '2x2',
          icon: 'layout-2x2',
          label: '2x2 Layout',
          tooltip: '2x2 Layout',
          commands: [
            {
              commandName: 'setLayout',
              commandOptions: { rows: 2, columns: 2 },
              context: 'CORNERSTONE',
            },
          ],
          evaluate: 'evaluate.action',
        }),
        ToolbarService.createButton({
          id: '3x1',
          icon: 'layout-3x1',
          label: '3x1 Layout',
          tooltip: '3x1 Layout',
          commands: [
            {
              commandName: 'setLayout',
              commandOptions: { rows: 3, columns: 1 },
              context: 'CORNERSTONE',
            },
          ],
          evaluate: 'evaluate.action',
        }),
        ToolbarService.createButton({
          id: '2x1',
          icon: 'layout-2x1',
          label: '2x1 Layout',
          tooltip: '2x1 Layout',
          commands: [
            {
              commandName: 'setLayout',
              commandOptions: { rows: 2, columns: 1 },
              context: 'CORNERSTONE',
            },
          ],
          evaluate: 'evaluate.action',
        }),
        ToolbarService.createButton({
          id: '1x1',
          icon: 'layout-1x1',
          label: '1x1 Layout',
          tooltip: '1x1 Layout',
          commands: [
            {
              commandName: 'setLayout',
              commandOptions: { rows: 1, columns: 1 },
              context: 'CORNERSTONE',
            },
          ],
          evaluate: 'evaluate.action',
        }),
        // Additional layout options can be added here following the same structure
      ],

      // Layout configurations like 2x2, 3x1, etc.
    },
  },
  {
    id: 'MPR',
    uiType: 'ohif.action',
    props: {
      icon: 'icon-mpr',
      label: 'MPR',
      commands: [
        {
          commandName: 'toggleHangingProtocol',
          commandOptions: { protocolId: 'mpr' },
          context: 'DEFAULT',
        },
      ],
      evaluate: 'evaluate.mpr',
    },
  },
  {
    id: 'Crosshairs',
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'tool-crosshair',
      label: 'Crosshairs',
      commands: [
        {
          commandName: 'setToolActive',
          commandOptions: { toolGroupId: 'mpr', toolName: 'Crosshairs' },
          context: 'CORNERSTONE',
        },
      ],
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  // More tools conversion similar to above examples...
];

export default toolbarButtons;
