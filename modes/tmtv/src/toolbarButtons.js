import { defaults, ToolbarService } from '@ohif/core';
import { WindowLevelMenuItem } from '@ohif/ui';
import { toolGroupIds } from './initToolGroups';

const { windowLevelPresets } = defaults;

function _createColormap(label, colormap) {
  return {
    id: label,
    label,
    type: 'action',
    commands: [
      {
        commandName: 'setFusionPTColormap',
        commandOptions: {
          toolGroupId: toolGroupIds.Fusion,
          colormap,
        },
      },
    ],
  };
}
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

const setToolActiveToolbar = {
  commandName: 'setToolActiveToolbar',
  commandOptions: {
    toolGroupIds: [toolGroupIds.CT, toolGroupIds.PT, toolGroupIds.Fusion],
  },
};

const toolbarButtons = [
  {
    id: 'MeasurementTools',
    uiType: 'ohif.splitButton',
    props: {
      groupId: 'MeasurementTools',
      primary: ToolbarService.createButton({
        id: 'Length',
        icon: 'tool-length',
        label: 'Length',
        tooltip: 'Length Tool',
        commands: setToolActiveToolbar,
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
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        ToolbarService.createButton({
          id: 'ArrowAnnotate',
          icon: 'tool-annotate',
          label: 'Arrow Annotate',
          tooltip: 'Arrow Annotate Tool',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        ToolbarService.createButton({
          id: 'EllipticalROI',
          icon: 'tool-ellipse',
          label: 'Ellipse',
          tooltip: 'Ellipse Tool',
          commands: setToolActiveToolbar,
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
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  // Window Level + Presets
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
        commands: setToolActiveToolbar,
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
      commands: setToolActiveToolbar,
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
      commands: setToolActiveToolbar,
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
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  // Fusion PT Colormap Button
  {
    id: 'fusionPTColormap',
    uiType: 'ohif.splitButton',
    props: {
      groupId: 'fusionPTColormap',
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
        _createColormap('HSV', 'hsv'),
        _createColormap('Hot Iron', 'hot_iron'),
        _createColormap('S PET', 's_pet'),
        _createColormap('Red Hot', 'red_hot'),
        _createColormap('Perfusion', 'perfusion'),
        _createColormap('Rainbow', 'rainbow_2'),
        _createColormap('SUV', 'suv'),
        _createColormap('GE 256', 'ge_256'),
        _createColormap('GE', 'ge'),
        _createColormap('Siemens', 'siemens'),
      ],
    },
  },
];

export default toolbarButtons;
