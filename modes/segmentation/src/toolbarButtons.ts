import type { Button } from '@ohif/core/types';
import { EVENTS } from '@cornerstonejs/core';
import { defaults, ToolbarService, ViewportGridService } from '@ohif/core';
import { WindowLevelMenuItem } from '@ohif/ui';

const { windowLevelPresets } = defaults;
const { createButton } = ToolbarService;

const ReferenceLinesListeners: RunCommand = [
  {
    commandName: 'setSourceViewportForReferenceLinesTool',
    context: 'CORNERSTONE',
  },
];

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
    toolGroupIds: ['default', 'mpr', 'SRToolGroup'],
  },
};

const toolbarButtons: Button[] = [
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
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'TrackballRotate',
    uiType: 'ohif.radioGroup',
    props: {
      type: 'tool',
      icon: 'tool-3d-rotate',
      label: '3D Rotate',
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'Capture',
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'tool-capture',
      label: 'Capture',
      commands: 'showDownloadViewportModal',
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
      commands: 'setViewportGridLayout',
    },
  },
  {
    id: 'Crosshairs',
    uiType: 'ohif.radioGroup',
    props: {
      icon: 'tool-crosshair',
      label: 'Crosshairs',
      commands: {
        commandName: 'setToolActiveToolbar',
        commandOptions: {
          toolGroupIds: ['mpr'],
        },
      },
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'MoreTools',
    uiType: 'ohif.splitButton',
    props: {
      groupId: 'MoreTools',
      evaluate: 'evaluate.group.promoteToPrimaryIfCornerstoneToolNotActiveInTheList',
      primary: createButton({
        id: 'Reset',
        icon: 'tool-reset',
        tooltip: 'Reset View',
        label: 'Reset',
        commands: 'resetViewport',
        evaluate: 'evaluate.action',
      }),
      secondary: {
        icon: 'chevron-down',
        label: '',
        tooltip: 'More Tools',
      },
      items: [
        createButton({
          id: 'Reset',
          icon: 'tool-reset',
          label: 'Reset View',
          tooltip: 'Reset View',
          commands: 'resetViewport',
          evaluate: 'evaluate.action',
        }),
        createButton({
          id: 'rotate-right',
          icon: 'tool-rotate-right',
          label: 'Rotate Right',
          tooltip: 'Rotate +90',
          commands: 'rotateViewportCW',
          evaluate: 'evaluate.action',
        }),
        createButton({
          id: 'flipHorizontal',
          icon: 'tool-flip-horizontal',
          label: 'Flip Horizontal',
          tooltip: 'Flip Horizontally',
          commands: 'flipViewportHorizontal',
          evaluate: ['evaluate.viewportProperties.toggle', 'evaluate.not3D'],
        }),
        createButton({
          id: 'ImageSliceSync',
          icon: 'link',
          label: 'Image Slice Sync',
          tooltip: 'Enable position synchronization on stack viewports',
          commands: {
            commandName: 'toggleSynchronizer',
            commandOptions: {
              type: 'imageSlice',
            },
          },
          listeners: {
            [EVENTS.STACK_VIEWPORT_NEW_STACK]: {
              commandName: 'toggleImageSliceSync',
              commandOptions: { toggledState: true },
            },
          },
          evaluate: ['evaluate.cornerstone.synchronizer', 'evaluate.not3D'],
        }),
        createButton({
          id: 'ReferenceLines',
          icon: 'tool-referenceLines',
          label: 'Reference Lines',
          tooltip: 'Show Reference Lines',
          commands: {
            commandName: 'setToolEnabled',
            commandOptions: {
              toolName: 'ReferenceLines',
              toggle: true, // Toggle the tool on/off upon click
            },
          },
          listeners: {
            [ViewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED]: ReferenceLinesListeners,
            [ViewportGridService.EVENTS.VIEWPORTS_READY]: ReferenceLinesListeners,
          },
          evaluate: 'evaluate.cornerstoneTool.toggle',
        }),
        createButton({
          id: 'ImageOverlay',
          icon: 'toggle-dicom-overlay',
          label: 'Image Overlay',
          tooltip: 'Toggle Image Overlay',
          commands: {
            commandName: 'setToolEnabled',
            commandOptions: {
              toolName: 'ImageOverlayViewer',
              toggle: true, // Toggle the tool on/off upon click
            },
          },
          evaluate: 'evaluate.cornerstoneTool.toggle',
        }),
        createButton({
          id: 'StackScroll',
          icon: 'tool-stack-scroll',
          label: 'Stack Scroll',
          tooltip: 'Stack Scroll',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        createButton({
          id: 'invert',
          icon: 'tool-invert',
          label: 'Invert',
          tooltip: 'Invert Colors',
          commands: 'invertViewport',
          evaluate: 'evaluate.viewportProperties.toggle',
        }),
        createButton({
          id: 'Probe',
          icon: 'tool-probe',
          label: 'Probe',
          tooltip: 'Probe',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        createButton({
          id: 'Cine',
          icon: 'tool-cine',
          label: 'Cine',
          tooltip: 'Cine',
          commands: 'toggleCine',
          evaluate: ['evaluate.cine', 'evaluate.not3D'],
        }),
        createButton({
          id: 'Angle',
          icon: 'tool-angle',
          label: 'Angle',
          tooltip: 'Angle',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        createButton({
          id: 'Magnify',
          icon: 'tool-magnify',
          label: 'Magnify',
          tooltip: 'Magnify',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        createButton({
          id: 'RectangleROI',
          icon: 'tool-rectangle',
          label: 'Rectangle',
          tooltip: 'Rectangle',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        createButton({
          id: 'CalibrationLine',
          icon: 'tool-calibration',
          label: 'Calibration',
          tooltip: 'Calibration Line',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        createButton({
          id: 'TagBrowser',
          icon: 'list-bullets',
          label: 'Dicom Tag Browser',
          tooltip: 'Dicom Tag Browser',
          commands: 'openDICOMTagViewer',
        }),
      ],
    },
  },
];

export default toolbarButtons;
