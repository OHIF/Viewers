import type { RunCommand } from '@ohif/core/types';
import { EVENTS } from '@cornerstonejs/core';
import { ToolbarService } from '@ohif/core';

const ReferenceLinesCommands: RunCommand = [
  {
    commandName: 'setSourceViewportForReferenceLinesTool',
    context: 'CORNERSTONE',
  },
  {
    commandName: 'setToolActive',
    commandOptions: {
      toolName: 'ReferenceLines',
    },
    context: 'CORNERSTONE',
  },
];

const moreTools = [
  {
    id: 'MoreTools',
    type: 'ohif.splitButton',
    props: {
      isRadio: true, // ?
      groupId: 'MoreTools',
      primary: ToolbarService._createActionButton(
        'Reset',
        'tool-reset',
        'Reset View',
        [
          {
            commandName: 'resetViewport',
          },
        ],
        'Reset'
      ),
      secondary: {
        icon: 'chevron-down',
        label: '',
        isActive: true,
        tooltip: 'More Tools',
      },
      items: [
        ToolbarService._createActionButton(
          'Reset',
          'tool-reset',
          'Reset View',
          [
            {
              commandName: 'resetViewport',
            },
          ],
          'Reset'
        ),
        ToolbarService._createActionButton(
          'rotate-right',
          'tool-rotate-right',
          'Rotate Right',
          [
            {
              commandName: 'rotateViewportCW',
              commandOptions: {},
              context: 'CORNERSTONE',
            },
          ],
          'Rotate +90'
        ),
        ToolbarService._createActionButton(
          'flip-horizontal',
          'tool-flip-horizontal',
          'Flip Horizontally',
          [
            {
              commandName: 'flipViewportHorizontal',
              commandOptions: {},
              context: 'CORNERSTONE',
            },
          ],
          'Flip Horizontally'
        ),
        ToolbarService._createToggleButton(
          'ImageSliceSync',
          'link',
          'Image Slice Sync',
          [
            {
              commandName: 'toggleImageSliceSync',
            },
          ],
          'Enable position synchronization on stack viewports',
          {
            listeners: {
              [EVENTS.STACK_VIEWPORT_NEW_STACK]: {
                commandName: 'toggleImageSliceSync',
                commandOptions: { toggledState: true },
              },
            },
          }
        ),
        ToolbarService._createToggleButton(
          'ReferenceLines',
          'tool-referenceLines', // change this with the new icon
          'Reference Lines',
          ReferenceLinesCommands,
          'Show Reference Lines',
          {
            listeners: {
              [EVENTS.STACK_VIEWPORT_NEW_STACK]: ReferenceLinesCommands,
              [EVENTS.ACTIVE_VIEWPORT_ID_CHANGED]: ReferenceLinesCommands,
            },
          }
        ),
        ToolbarService._createToolButton(
          'StackScroll',
          'tool-stack-scroll',
          'Stack Scroll',
          [
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: 'StackScroll',
              },
              context: 'CORNERSTONE',
            },
          ],
          'Stack Scroll'
        ),
        ToolbarService._createActionButton(
          'invert',
          'tool-invert',
          'Invert',
          [
            {
              commandName: 'invertViewport',
              commandOptions: {},
              context: 'CORNERSTONE',
            },
          ],
          'Invert Colors'
        ),
        ToolbarService._createToolButton(
          'Probe',
          'tool-probe',
          'Probe',
          [
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: 'DragProbe',
              },
              context: 'CORNERSTONE',
            },
          ],
          'Probe'
        ),
        ToolbarService._createToggleButton(
          'cine',
          'tool-cine',
          'Cine',
          [
            {
              commandName: 'toggleCine',
              context: 'CORNERSTONE',
            },
          ],
          'Cine'
        ),
        ToolbarService._createToolButton(
          'Angle',
          'tool-angle',
          'Angle',
          [
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: 'Angle',
              },
              context: 'CORNERSTONE',
            },
          ],
          'Angle'
        ),
        ToolbarService._createToolButton(
          'Magnify',
          'tool-magnify',
          'Magnify',
          [
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: 'Magnify',
              },
              context: 'CORNERSTONE',
            },
          ],
          'Magnify'
        ),
        ToolbarService._createToolButton(
          'Rectangle',
          'tool-rectangle',
          'Rectangle',
          [
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: 'RectangleROI',
              },
              context: 'CORNERSTONE',
            },
          ],
          'Rectangle'
        ),
        ToolbarService._createActionButton(
          'TagBrowser',
          'list-bullets',
          'Dicom Tag Browser',
          [
            {
              commandName: 'openDICOMTagViewer',
              commandOptions: {},
              context: 'DEFAULT',
            },
          ],
          'Dicom Tag Browser'
        ),
      ],
    },
  },
];

export default moreTools;
