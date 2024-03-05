// TODO: torn, can either bake this here; or have to create a whole new button type
// Only ways that you can pass in a custom React component for render :l
import {
  // ListMenu,
  WindowLevelMenuItem,
} from '@ohif/ui';
import { defaults, ToolbarService } from '@ohif/core';
import type { Button } from '@ohif/core/types';

const { windowLevelPresets } = defaults;

/**
 *
 * @param {*} preset - preset number (from above import)
 * @param {*} title
 * @param {*} subtitle
 */
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

/**
 * Creates an array of 'setToolActive' commands for the given toolName - one for
 * each toolGroupId specified in toolGroupIds.
 * @param {string} toolName
 * @returns {Array} an array of 'setToolActive' commands
 */
function _createSetToolActiveCommands(toolName, toolGroupIds = ['default', 'mpr', 'SRToolGroup']) {
  const temp = toolGroupIds.map(toolGroupId => ({
    commandName: 'setToolActive',
    commandOptions: {
      toolGroupId,
      toolName,
    },
    context: 'CORNERSTONE',
  }));
  return temp;
}

const toolbarButtons: Button[] = [
  {
    id: 'MeasurementTools',
    uiType: 'ohif.splitButton',
    props: {
      groupId: 'MeasurementToolsGroupId',
      // group evaluate to determine which item should move to the top
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
              // we can use the setToolActive command for this from Cornerstone commandsModule
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
          label: 'Annotation',
          tooltip: 'Arrow Annotate',
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
          tooltip: 'Ellipse ROI',
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
          tooltip: 'Circle Tool',
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
  // Window Level + Presets...
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
      commands: _createSetToolActiveCommands('Pan'),
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
    uiType: 'ohif.layoutSelector',
    props: {
      rows: 3,
      columns: 3,
      evaluate: 'evaluate.action',
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
          commandOptions: {
            protocolId: 'mpr',
          },
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
      type: 'tool',
      icon: 'tool-crosshair',
      label: 'Crosshairs',
      commands: _createSetToolActiveCommands('Crosshairs', ['mpr']),
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
];

export default toolbarButtons;
