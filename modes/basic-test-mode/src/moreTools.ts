import type { RunCommand } from '@ohif/core/types';
import { EVENTS } from '@cornerstonejs/core';
import { ToolbarService } from '@ohif/core';

const ReferenceLinesCommands: RunCommand = [
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
      isRadio: true,
      groupId: 'MoreToolsGroupId',
      primary: ToolbarService.createButton({
        id: 'Reset',
        icon: 'tool-reset',
        label: 'Reset View',
        commands: [
          {
            commandName: 'resetViewport',
            context: 'CORNERSTONE',
          },
        ],
        tooltip: 'Reset',
        evaluate: 'evaluate.action',
      }),
      secondary: {
        icon: 'chevron-down',
        tooltip: 'More Tools',
      },
      items: [
        ToolbarService.createButton({
          id: 'RotateRight',
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
          id: 'ImageSliceSync',
          icon: 'link',
          label: 'Image Slice Sync',
          tooltip: 'Enable position synchronization on stack viewports',
          commands: [
            {
              commandName: 'toggleImageSliceSync',
            },
          ],
          evaluate: 'evaluate.toggle',
          listeners: {
            [EVENTS.STACK_VIEWPORT_NEW_STACK]: {
              commandName: 'toggleImageSliceSync',
              commandOptions: { toggledState: true },
            },
          },
        }),
        ToolbarService.createButton({
          id: 'ReferenceLines',
          icon: 'tool-referenceLines', // Assuming a new icon is provided
          label: 'Reference Lines',
          tooltip: 'Show Reference Lines',
          commands: [
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: 'ReferenceLines',
              },
              context: 'CORNERSTONE',
            },
          ],
          evaluate: 'evaluate.toggle',
          listeners: {
            [EVENTS.STACK_VIEWPORT_NEW_STACK]: ReferenceLinesCommands,
            [EVENTS.ACTIVE_VIEWPORT_ID_CHANGED]: ReferenceLinesCommands,
          },
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
          id: 'Invert',
          icon: 'tool-invert',
          label: 'Invert',
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
          evaluate: 'evaluate.toggle',
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
          evaluate: 'evaluate.action',
        }),
      ],
    },
  },
];

export default moreTools;
