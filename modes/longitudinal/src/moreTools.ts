import type { RunCommand } from '@ohif/core/types';
import { EVENTS } from '@cornerstonejs/core';
import { ToolbarService, ViewportGridService } from '@ohif/core';

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
        label: '',
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
          id: 'rotate-right',
          icon: 'tool-rotate-right',
          label: 'Rotate Right',
          tooltip: 'Rotate +90',
          commands: [
            {
              commandName: 'rotateViewportCW',
              context: 'CORNERSTONE',
            },
          ],
          evaluate: 'evaluate.action',
        }),
        ToolbarService.createButton({
          id: 'flipHorizontal',
          icon: 'tool-flip-horizontal',
          label: 'Flip Horizontal',
          tooltip: 'Flip Horizontally',
          commands: [
            {
              commandName: 'flipViewportHorizontal',
              context: 'CORNERSTONE',
            },
          ],
          evaluate: 'evaluate.viewportProperties.toggle',
        }),
        ToolbarService.createButton({
          id: 'ImageSliceSync',
          icon: 'link',
          label: 'Image Slice Sync',
          tooltip: 'Enable position synchronization on stack viewports',
          commands: [
            {
              commandName: 'toggleSynchronizer',
              commandOptions: {
                type: 'imageSlice',
              },
            },
          ],
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
          commands: [
            {
              commandName: 'setToolEnabled',
              commandOptions: {
                toolName: 'ReferenceLines',
                toggle: true,
              },
              context: 'CORNERSTONE',
            },
          ],
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
          commands: [
            {
              commandName: 'setToolEnabled',
              commandOptions: {
                toolName: 'ImageOverlayViewer',
              },
              context: 'CORNERSTONE',
            },
          ],
          evaluate: 'evaluate.cornerstoneTool.toggle',
        }),
        ToolbarService.createButton({
          id: 'StackScroll',
          icon: 'tool-stack-scroll',
          label: 'Stack Scroll',
          tooltip: 'Stack Scroll',
          commands: [
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: 'StackScroll',
              },
              context: 'CORNERSTONE',
            },
          ],
          evaluate: 'evaluate.cornerstoneTool',
        }),
        ToolbarService.createButton({
          id: 'invert',
          icon: 'tool-invert',
          label: 'Invert',
          tooltip: 'Invert Colors',
          commands: [
            {
              commandName: 'invertViewport',
              context: 'CORNERSTONE',
            },
          ],
          evaluate: 'evaluate.viewportProperties.toggle',
        }),
        ToolbarService.createButton({
          id: 'Probe',
          icon: 'tool-probe',
          label: 'Probe',
          tooltip: 'Probe',
          commands: [
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: 'DragProbe',
              },
              context: 'CORNERSTONE',
            },
          ],
          evaluate: 'evaluate.cornerstoneTool',
        }),
        ToolbarService.createButton({
          id: 'Cine',
          icon: 'tool-cine',
          label: 'Cine',
          tooltip: 'Cine',
          commands: [
            {
              commandName: 'toggleCine',
              context: 'CORNERSTONE',
            },
          ],
          evaluate: 'evaluate.cine',
        }),
        ToolbarService.createButton({
          id: 'Angle',
          icon: 'tool-angle',
          label: 'Angle',
          tooltip: 'Angle',
          commands: [
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: 'Angle',
              },
              context: 'CORNERSTONE',
            },
          ],
          evaluate: 'evaluate.cornerstoneTool',
        }),
        ToolbarService.createButton({
          id: 'Magnify',
          icon: 'tool-magnify',
          label: 'Magnify',
          tooltip: 'Magnify',
          commands: [
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: 'Magnify',
              },
              context: 'CORNERSTONE',
            },
          ],
          evaluate: 'evaluate.cornerstoneTool',
        }),
        ToolbarService.createButton({
          id: 'Rectangle',
          icon: 'tool-rectangle',
          label: 'Rectangle',
          tooltip: 'Rectangle',
          commands: [
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: 'RectangleROI',
              },
              context: 'CORNERSTONE',
            },
          ],
          evaluate: 'evaluate.cornerstoneTool',
        }),
        ToolbarService.createButton({
          id: 'CalibrationLine',
          icon: 'tool-calibration',
          label: 'Calibration',
          tooltip: 'Calibration Line',
          commands: [
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: 'CalibrationLine',
              },
              context: 'CORNERSTONE',
            },
          ],
          evaluate: 'evaluate.cornerstoneTool',
        }),
        ToolbarService.createButton({
          id: 'TagBrowser',
          icon: 'list-bullets',
          label: 'Dicom Tag Browser',

          tooltip: 'Dicom Tag Browser',
          commands: [
            {
              commandName: 'openDICOMTagViewer',
              context: 'DEFAULT',
            },
          ],
        }),
      ],
    },
  },
];

export default moreTools;
