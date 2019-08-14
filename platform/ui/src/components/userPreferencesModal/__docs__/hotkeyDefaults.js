export default {
  defaultTool: { label: 'Default Tool', keys: ['ESC'], column: 0 },
  zoom: { label: 'Zoom', keys: ['Z'], column: 0 },
  wwwc: { label: 'W/L', keys: ['W'], column: 0 },
  pan: { label: 'Pan', keys: ['P'], column: 0 },
  angle: { label: 'Angle measurement', keys: ['A'], column: 0 },
  stackScroll: { label: 'Scroll stack', keys: ['S'], column: 0 },
  magnify: { label: 'Magnify', keys: ['M'], column: 0 },
  length: { label: 'Length measurement', keys: [''], column: 0 },
  annotate: { label: 'Annotate', keys: [''], column: 0 },
  dragProbe: { label: 'Pixel probe', keys: [''], column: 0 },
  ellipticalRoi: { label: 'Elliptical ROI', keys: [''], column: 0 },
  rectangleRoi: { label: 'Rectangle ROI', keys: [''], column: 0 },

  // Viewport hotkeys
  flipH: { label: 'Flip Horizontally', keys: ['H'], column: 0 },
  flipV: { label: 'Flip Vertically', keys: ['V'], column: 0 },
  rotateR: { label: 'Rotate Right', keys: ['R'], column: 0 },
  rotateL: { label: 'Rotate Left', keys: ['L'], column: 0 },
  invert: { label: 'Invert', keys: ['I'], column: 0 },
  zoomIn: { label: 'Zoom In', keys: [''], column: 0 },
  zoomOut: { label: 'Zoom Out', keys: [''], column: 0 },
  zoomToFit: { label: 'Zoom to Fit', keys: [''], column: 0 },
  resetViewport: { label: 'Reset', keys: [''], column: 0 },
  clearTools: { label: 'Clear Tools', keys: [''], column: 0 },

  // 2nd column

  // Viewport navigation hotkeys
  scrollDown: { label: 'Scroll Down', keys: ['DOWN'], column: 1 },
  scrollUp: { label: 'Scroll Up', keys: ['UP'], column: 1 },
  scrollLastImage: { label: 'Scroll to Last Image', keys: ['END'], column: 1 },
  scrollFirstImage: {
    label: 'Scroll to First Image',
    keys: ['HOME'],
    column: 1,
  },
  previousDisplaySet: {
    label: 'Previous Series',
    keys: ['PAGEUP'],
    column: 1,
  },
  nextDisplaySet: { label: 'Next Series', keys: ['PAGEDOWN'], column: 1 },
  nextPanel: { label: 'Next Image Viewport', keys: ['RIGHT'], column: 1 },
  previousPanel: {
    label: 'Previous Image Viewport',
    keys: ['LEFT'],
    column: 1,
  },

  // Miscellaneous hotkeys
  toggleOverlayTags: {
    label: 'Toggle Image Info Overlay',
    keys: ['O'],
    column: 1,
  },
  toggleCinePlay: { label: 'Play/Pause Cine', keys: ['SPACE'], column: 1 },
  toggleCineDialog: {
    label: 'Show/Hide Cine Controls',
    keys: [''],
    column: 1,
  },
  toggleDownloadDialog: {
    label: 'Show/Hide Download Dialog',
    keys: [''],
    column: 1,
  },

  // Preset hotkeys
  WLPreset0: { label: 'W/L Preset 0  (Soft Tissue)', keys: ['1'], column: 1 },
  WLPreset1: { label: 'W/L Preset 1 (Lung)', keys: ['2'], column: 1 },
  WLPreset2: { label: 'W/L Preset 2 (Liver)', keys: ['3'], column: 1 },
  WLPreset3: { label: 'W/L Preset 3 (Bone)', keys: ['4'], column: 1 },
  WLPreset4: { label: 'W/L Preset 4 (Brain)', keys: ['5'], column: 1 },
  WLPreset5: { label: 'W/L Preset 5', keys: ['6'], column: 1 },
  WLPreset6: { label: 'W/L Preset 6', keys: ['7'], column: 1 },
  WLPreset7: { label: 'W/L Preset 7', keys: ['8'], column: 1 },
  WLPreset8: { label: 'W/L Preset 8', keys: ['9'], column: 1 },
  WLPreset9: { label: 'W/L Preset 0', keys: ['0'], column: 1 },
};
