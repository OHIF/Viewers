import { defaults, ToolbarService } from '@ohif/core';
import type { Button } from '@ohif/core/types';
import { WindowLevelMenuItem } from '@ohif/ui';
import { toolGroupIds } from './initToolGroups';

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

function _createCommands(commandName, toolName, toolGroupIds) {
  return toolGroupIds.map(toolGroupId => ({
    commandName,
    commandOptions: {
      toolName,
      toolGroupId,
    },
    context: 'CORNERSTONE',
  }));
}

const toolbarButtons: Button[] = [
  {
    id: 'MeasurementTools',
    uiType: 'ohif.splitButton',
    props: {
      groupId: 'MeasurementToolsGroupId',
      primary: ToolbarService.createButton({
        id: 'Length',
        icon: 'tool-length',
        label: 'Length',
        tooltip: 'Length Tool',
        commands: _createCommands('setToolActive', 'Length', [
          toolGroupIds.CT,
          toolGroupIds.PT,
          toolGroupIds.Fusion,
        ]),
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
        commands: _createCommands('setToolActive', 'Bidirectional', [
          toolGroupIds.CT,
          toolGroupIds.PT,
          toolGroupIds.Fusion,
        ]),
        evaluate: 'evaluate.cornerstoneTool',
      }),
      ToolbarService.createButton({
        id: 'ArrowAnnotate',
        icon: 'tool-annotate',
        label: 'Arrow Annotate',
        tooltip: 'Arrow Annotate Tool',
        commands: _createCommands('setToolActive', 'ArrowAnnotate', [
          toolGroupIds.CT,
          toolGroupIds.PT,
          toolGroupIds.Fusion,
        ]),
        evaluate: 'evaluate.cornerstoneTool',
      }),
      ToolbarService.createButton({
        id: 'EllipticalROI',
        icon: 'tool-ellipse',
        label: 'Ellipse',
        tooltip: 'Ellipse Tool',
        commands: _createCommands('setToolActive', 'EllipticalROI', [
          toolGroupIds.CT,
          toolGroupIds.PT,
          toolGroupIds.Fusion,
        ]),
        evaluate: 'evaluate.cornerstoneTool',
      }),
      // Additional measurement tools can be defined here following the same pattern.
    ],
    },
  },
  // Additional buttons follow the pattern established above
  {
    id: 'Zoom',
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'tool-zoom',
      label: 'Zoom',
      commands: _createCommands('setToolActive', 'Zoom', [
        toolGroupIds.CT,
        toolGroupIds.PT,
        toolGroupIds.Fusion,
      ]),
      evaluate: 'evaluate.cornerstoneTool',
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
  // Window Level + Presets
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
        commands: _createCommands('setToolActive', 'WindowLevel', [
          toolGroupIds.CT,
          toolGroupIds.PT,
          toolGroupIds.Fusion,
        ]),
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
  // Crosshairs Button
  {
    id: 'Crosshairs',
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'tool-crosshair',
      label: 'Crosshairs',
      commands: _createCommands('setToolActive', 'Crosshairs', [
        toolGroupIds.CT,
        toolGroupIds.PT,
        toolGroupIds.Fusion,
      ]),
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  // Pan Button
  {
    id: 'Pan',
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'tool-move',
      label: 'Pan',
      commands: _createCommands('setToolActive', 'Pan', [
        toolGroupIds.CT,
        toolGroupIds.PT,
        toolGroupIds.Fusion,
      ]),
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  // Rectangle ROI Start End Threshold Button
  {
    id: 'RectangleROIStartEndThreshold',
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'tool-create-threshold',
      label: 'Rectangle ROI Threshold',
      commands: _createCommands('setToolActive', 'RectangleROIStartEndThreshold', [toolGroupIds.PT]).concat([
        {
          commandName: 'displayNotification',
          commandOptions: {
            title: 'RectangleROI Threshold Tip',
            text: 'RectangleROI Threshold tool should be used on PT Axial Viewport',
            type: 'info',
          },
        },
        {
          commandName: 'setViewportActive',
          commandOptions: { viewportId: 'ptAXIAL' },
        },
      ]),
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  // Fusion PT Colormap Button
  {
    id: 'fusionPTColormap',
    uiType: 'ohif.splitButton',
    props: {
      groupId: 'fusionPTColormapGroupId',
      primary: ToolbarService.createButton({
        id: 'fusionPTColormap',
        icon: 'tool-fusion-color',
        label: 'Fusion PT Colormap',
        tooltip: 'Fusion PT Colormap',
        commands: [],
        evaluate: 'evaluate.action',
      }),
      secondary: {
        icon: 'chevron-down',
        tooltip: 'PET Image Colormap',
      },
      items: [
        // Here you would add colormap items using ToolbarService.createButton
        // Similar to how other items have been created but focusing on colormap functionality
      ].concat(
        ['HSV', 'Hot Iron', 'S PET', 'Red Hot', 'Perfusion', 'Rainbow', 'SUV', 'GE 256', 'GE', 'Siemens'].map(colormap =>
          ToolbarService.createButton({
            id: colormap.replace(/\s+/g, ''),
            icon: 'palette', // Assuming a generic icon for colormap; adjust as needed
            label: colormap,
            tooltip: colormap,
            commands: [
              {
                commandName: 'setFusionPTColormap',
                commandOptions: { toolGroupId: toolGroupIds.Fusion, colormap },
                context: 'CORNERSTONE',
              },
            ],
            evaluate: 'evaluate.action',
          })
        )
      ),
    },
  },
];

export default toolbarButtons;
