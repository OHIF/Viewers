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

const moreToolsMpr = [
  {
    id: 'MoreToolsMpr',
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
            commandOptions: {},
            context: 'CORNERSTONE',
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
              commandOptions: {},
              context: 'CORNERSTONE',
            },
          ],
          'Reset'
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
        ToolbarService._createToggleButton(
          'ImageOverlayViewer',
          'toggle-dicom-overlay',
          'Image Overlay',
          [
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: 'ImageOverlayViewer',
              },
              context: 'CORNERSTONE',
            },
          ],
          'Image Overlay',
          { isActive: true }
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

        // Next two tools can be added once icons are added
        // ToolbarService._createToolButton(
        //   'Cobb Angle',
        //   'tool-cobb-angle',
        //   'Cobb Angle',
        //   [
        //     {
        //       commandName: 'setToolActive',
        //       commandOptions: {
        //         toolName: 'CobbAngle',
        //       },
        //       context: 'CORNERSTONE',
        //     },
        //   ],
        //   'Cobb Angle'
        // ),
        // ToolbarService._createToolButton(
        //   'Planar Freehand ROI',
        //   'tool-freehand',
        //   'PlanarFreehandROI',
        //   [
        //     {
        //       commandName: 'setToolActive',
        //       commandOptions: {
        //         toolName: 'PlanarFreehandROI',
        //       },
        //       context: 'CORNERSTONE',
        //     },
        //   ],
        //   'Planar Freehand ROI'
        // ),
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

export default moreToolsMpr;
