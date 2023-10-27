import { ToolbarService } from '@ohif/core';

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
