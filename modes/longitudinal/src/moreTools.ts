import type { RunCommand } from '@ohif/core/types';
import { EVENTS } from '@cornerstonejs/core';
import { ToolbarService, ViewportGridService } from '@ohif/core';
import { setToolActiveToolbar } from './toolbarButtons';

const ReferenceLinesListeners: RunCommand = [
  {
    commandName: 'setSourceViewportForReferenceLinesTool',
    context: 'CORNERSTONE',
  },
];

const moreTools = [
  {
    id: 'MoreTools',
    uiType: 'ohif.splitButton',
    props: {
      groupId: 'MoreTools',
      evaluate: 'evaluate.group.promoteToPrimaryIfCornerstoneToolNotActiveInTheList',
      primary: ToolbarService.createButton({
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
        ToolbarService.createButton({
          id: 'Reset',
          icon: 'tool-reset',
          label: 'Reset View',
          tooltip: 'Reset View',
          commands: 'resetViewport',
          evaluate: 'evaluate.action',
        }),
        ToolbarService.createButton({
          id: 'rotate-right',
          icon: 'tool-rotate-right',
          label: 'Rotate Right',
          tooltip: 'Rotate +90',
          commands: 'rotateViewportCW',
          evaluate: 'evaluate.action',
        }),
        ToolbarService.createButton({
          id: 'flipHorizontal',
          icon: 'tool-flip-horizontal',
          label: 'Flip Horizontal',
          tooltip: 'Flip Horizontally',
          commands: 'flipViewportHorizontal',
          evaluate: 'evaluate.viewportProperties.toggle',
        }),
        ToolbarService.createButton({
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
          evaluate: 'evaluate.cornerstone.synchronizer',
        }),
        ToolbarService.createButton({
          id: 'ReferenceLines',
          icon: 'tool-referenceLines',
          label: 'Reference Lines',
          tooltip: 'Show Reference Lines',
          commands: {
            commandName: 'setToolEnabled',
            commandOptions: {
              toolName: 'ReferenceLines',
            },
          },
          listeners: {
            [ViewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED]: ReferenceLinesListeners,
            [ViewportGridService.EVENTS.VIEWPORTS_READY]: ReferenceLinesListeners,
          },
          evaluate: 'evaluate.cornerstoneTool.toggle',
        }),
        ToolbarService.createButton({
          id: 'ImageOverlay',
          icon: 'toggle-dicom-overlay',
          label: 'Image Overlay',
          tooltip: 'Toggle Image Overlay',
          commands: {
            commandName: 'setToolEnabled',
            commandOptions: {
              toolName: 'ImageOverlayViewer',
            },
          },
          evaluate: 'evaluate.cornerstoneTool.toggle',
        }),
        ToolbarService.createButton({
          id: 'StackScroll',
          icon: 'tool-stack-scroll',
          label: 'Stack Scroll',
          tooltip: 'Stack Scroll',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        ToolbarService.createButton({
          id: 'invert',
          icon: 'tool-invert',
          label: 'Invert',
          tooltip: 'Invert Colors',
          commands: 'invertViewport',
          evaluate: 'evaluate.viewportProperties.toggle',
        }),
        ToolbarService.createButton({
          id: 'Probe',
          icon: 'tool-probe',
          label: 'Probe',
          tooltip: 'Probe',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        ToolbarService.createButton({
          id: 'Cine',
          icon: 'tool-cine',
          label: 'Cine',
          tooltip: 'Cine',
          commands: 'toggleCine',
          evaluate: 'evaluate.cine',
        }),
        ToolbarService.createButton({
          id: 'Angle',
          icon: 'tool-angle',
          label: 'Angle',
          tooltip: 'Angle',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        ToolbarService.createButton({
          id: 'Magnify',
          icon: 'tool-magnify',
          label: 'Magnify',
          tooltip: 'Magnify',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        ToolbarService.createButton({
          id: 'RectangleROI',
          icon: 'tool-rectangle',
          label: 'Rectangle',
          tooltip: 'Rectangle',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        ToolbarService.createButton({
          id: 'CalibrationLine',
          icon: 'tool-calibration',
          label: 'Calibration',
          tooltip: 'Calibration Line',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        ToolbarService.createButton({
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

export default moreTools;
