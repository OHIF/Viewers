import { createActionButton, createToggleButton, createToolButton } from './createButton';

const moreToolsMpr = {
  id: 'MoreToolsMpr',
  type: 'ohif.splitButton',
  props: {
    isRadio: true, // ?
    groupId: 'MoreTools',
    primary: createActionButton(
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
      createActionButton(
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
      createToolButton(
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
      createActionButton(
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
      createToolButton(
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
      createToggleButton(
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
      createToolButton(
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
      createToolButton(
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
      createActionButton(
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
};

export default moreToolsMpr;
