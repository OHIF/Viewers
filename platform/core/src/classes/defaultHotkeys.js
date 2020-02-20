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
];

export { defaultHotkeys };
