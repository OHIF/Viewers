import windowLevelPresets from './windowLevelPresets';

/*
 * Supported Keys: https://craig.is/killing/mice
 */
const bindings = [
  {
    commandName: 'setToolActive',
    commandOptions: { toolName: 'Zoom' },
    label: 'Zoom',
    keys: ['z'],
    isEditable: true,
  },
  {
    commandName: 'scaleUpViewport',
    label: 'Zoom In',
    keys: ['+'],
    isEditable: true,
  },
  {
    commandName: 'scaleDownViewport',
    label: 'Zoom Out',
    keys: ['-'],
    isEditable: true,
  },
  {
    commandName: 'fitViewportToWindow',
    label: 'Zoom to Fit',
    keys: ['='],
    isEditable: true,
  },
  {
    commandName: 'rotateViewportCW',
    label: 'Rotate Right',
    keys: ['r'],
    isEditable: true,
  },
  {
    commandName: 'rotateViewportCCW',
    label: 'Rotate Left',
    keys: ['l'],
    isEditable: true,
  },
  {
    commandName: 'flipViewportHorizontal',
    label: 'Flip Horizontally',
    keys: ['h'],
    isEditable: true,
  },
  {
    commandName: 'flipViewportVertical',
    label: 'Flip Vertically',
    keys: ['v'],
    isEditable: true,
  },
  {
    commandName: 'toggleCine',
    label: 'Cine',
    keys: ['c'],
  },
  {
    commandName: 'invertViewport',
    label: 'Invert',
    keys: ['i'],
    isEditable: true,
  },
  {
    commandName: 'incrementActiveViewport',
    label: 'Next Image Viewport',
    keys: ['right'],
    isEditable: true,
  },
  {
    commandName: 'decrementActiveViewport',
    label: 'Previous Image Viewport',
    keys: ['left'],
    isEditable: true,
  },
  {
    commandName: 'updateViewportDisplaySet',
    commandOptions: {
      direction: -1,
    },
    label: 'Previous Series',
    keys: ['pageup'],
    isEditable: true,
  },
  {
    commandName: 'updateViewportDisplaySet',
    commandOptions: {
      direction: 1,
    },
    label: 'Next Series',
    keys: ['pagedown'],
    isEditable: true,
  },
  {
    commandName: 'nextStage',
    context: 'DEFAULT',
    label: 'Next Stage',
    keys: ['.'],
    isEditable: true,
  },
  {
    commandName: 'previousStage',
    context: 'DEFAULT',
    label: 'Previous Stage',
    keys: [','],
    isEditable: true,
  },
  {
    commandName: 'nextImage',
    label: 'Next Image',
    keys: ['down'],
    isEditable: true,
  },
  {
    commandName: 'previousImage',
    label: 'Previous Image',
    keys: ['up'],
    isEditable: true,
  },
  {
    commandName: 'firstImage',
    label: 'First Image',
    keys: ['home'],
    isEditable: true,
  },
  {
    commandName: 'lastImage',
    label: 'Last Image',
    keys: ['end'],
    isEditable: true,
  },
  {
    commandName: 'resetViewport',
    label: 'Reset',
    keys: ['space'],
    isEditable: true,
  },
  {
    commandName: 'cancelMeasurement',
    label: 'Cancel Cornerstone Measurement',
    keys: ['esc'],
  },
  {
    commandName: 'setWindowLevel',
    commandOptions: windowLevelPresets[1],
    label: 'W/L Preset 1',
    keys: ['1'],
  },
  {
    commandName: 'setWindowLevel',
    commandOptions: windowLevelPresets[2],
    label: 'W/L Preset 2',
    keys: ['2'],
  },
  {
    commandName: 'setWindowLevel',
    commandOptions: windowLevelPresets[3],
    label: 'W/L Preset 3',
    keys: ['3'],
  },
  {
    commandName: 'setWindowLevel',
    commandOptions: windowLevelPresets[4],
    label: 'W/L Preset 4',
    keys: ['4'],
  },
  {
    commandName: 'setWindowLevel',
    commandOptions: windowLevelPresets[5],
    label: 'W/L Preset 5',
    keys: ['5'],
  },
  // These don't exist, so don't try applying them....
  // {
  //   commandName: 'setWindowLevel',
  //   commandOptions: windowLevelPresets[6],
  //   label: 'W/L Preset 6',
  //   keys: ['6'],
  // },
  // {
  //   commandName: 'setWindowLevel',
  //   commandOptions: windowLevelPresets[7],
  //   label: 'W/L Preset 7',
  //   keys: ['7'],
  // },
  // {
  //   commandName: 'setWindowLevel',
  //   commandOptions: windowLevelPresets[8],
  //   label: 'W/L Preset 8',
  //   keys: ['8'],
  // },
  // {
  //   commandName: 'setWindowLevel',
  //   commandOptions: windowLevelPresets[9],
  //   label: 'W/L Preset 9',
  //   keys: ['9'],
  // },
];

export default bindings;
