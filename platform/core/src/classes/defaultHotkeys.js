// Supported Keys: https://craig.is/killing/mice
const defaultHotkeys = [
  {
    commandName: 'incrementActiveViewport',
    label: 'Next Viewport',
    keys: ['right'],
  },
  {
    commandName: 'decrementActiveViewport',
    label: 'Previous Viewport',
    keys: ['left'],
  },
  { commandName: 'rotateViewportCW', label: 'Rotate Right', keys: ['r'] },
  { commandName: 'rotateViewportCCW', label: 'Rotate Left', keys: ['l'] },
  { commandName: 'invertViewport', label: 'Invert', keys: ['i'] },
  {
    commandName: 'flipViewportVertical',
    label: 'Flip Horizontally',
    keys: ['h'],
  },
  {
    commandName: 'flipViewportHorizontal',
    label: 'Flip Vertically',
    keys: ['v'],
  },
  { commandName: 'scaleUpViewport', label: 'Zoom In', keys: ['+'] },
  { commandName: 'scaleDownViewport', label: 'Zoom Out', keys: ['-'] },
  { commandName: 'fitViewportToWindow', label: 'Zoom to Fit', keys: ['='] },
  { commandName: 'resetViewport', label: 'Reset', keys: ['space'] },
  { commandName: 'nextImage', label: 'Next Image', keys: ['down'] },
  { commandName: 'previousImage', label: 'Previous Image', keys: ['up'] },
  {
    commandName: 'updateViewportDisplaySet',
    label: 'Previous Series',
    keys: ['pageup'],
    commandOptions: { direction: 1 },
  },
  {
    commandName: 'updateViewportDisplaySet',
    label: 'Next Series',
    keys: ['pagedown'],
    commandOptions: { direction: -1 },
  },
  {
    commandName: 'setToolActive',
    label: 'Zoom',
    keys: ['z'],
    commandOptions: { toolName: 'Zoom' },
  },
  // ~ Window level presets
  {
    commandName: 'windowLevelPreset1',
    label: 'W/L Preset 1',
    keys: ['1'],
  },
  {
    commandName: 'windowLevelPreset2',
    label: 'W/L Preset 2',
    keys: ['2'],
  },
  {
    commandName: 'windowLevelPreset3',
    label: 'W/L Preset 3',
    keys: ['3'],
  },
  {
    commandName: 'windowLevelPreset4',
    label: 'W/L Preset 4',
    keys: ['4'],
  },
  {
    commandName: 'windowLevelPreset5',
    label: 'W/L Preset 5',
    keys: ['5'],
  },
  {
    commandName: 'windowLevelPreset6',
    label: 'W/L Preset 6',
    keys: ['6'],
  },
  {
    commandName: 'windowLevelPreset7',
    label: 'W/L Preset 7',
    keys: ['7'],
  },
  {
    commandName: 'windowLevelPreset8',
    label: 'W/L Preset 8',
    keys: ['8'],
  },
  {
    commandName: 'windowLevelPreset9',
    label: 'W/L Preset 9',
    keys: ['9'],
  },
];

export { defaultHotkeys };
