// TODO: torn, can either bake this here; or have to create a whole new button type
// Only ways that you can pass in a custom React component for render :l

export default [
  // Divider
  {
    id: 'Divider',
    type: 'ohif.divider',
  },
  // ~~ Primary
  {
    id: 'Zoom',
    type: 'ohif.radioGroup',
    config: {
      groupName: 'primaryTool',
    },
    props: {
      isActive: false,
      icon: 'tool-zoom',
      label: 'Zoom',
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Zoom' },
      type: 'primary',
    },
  },
  {
    id: 'Wwwc',
    type: 'ohif.radioGroup',
    config: {
      groupName: 'primaryTool',
    },
    props: {
      isActive: true,
      icon: 'tool-window-level',
      label: 'Levels',
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Wwwc' },
      type: 'primary',
    },
  },
  {
    id: 'Pan',
    type: 'ohif.radioGroup',
    config: {
      groupName: 'primaryTool',
    },
    props: {
      isActive: false,
      icon: 'tool-move',
      label: 'Pan',
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Pan' },
      type: 'primary',
    },
  },
  {
    id: 'Capture',
    type: 'ohif.action',
    props: {
      icon: 'tool-capture',
      label: 'Capture',
      commandName: 'showDownloadViewportModal',
      type: 'primary',
    },
  },
  {
    id: 'Layout',
    type: 'ohif.layoutSelector',
  },
  // ~~ Primary: NESTED
  {
    id: 'ResetView',
    type: 'ohif.action',
    props: {
      icon: 'old-reset',
      label: 'Reset View',
      commandName: 'resetViewport',
      type: 'primary',
    },
  },
  {
    id: 'RotateClockwise',
    type: 'ohif.action',
    props: {
      icon: 'old-rotate-right',
      label: 'Rotate Right',
      commandName: 'rotateViewportCW',
      type: 'primary',
    },
  },
  {
    id: 'FlipHorizontally',
    type: 'ohif.action',
    props: {
      icon: 'old-ellipse-h',
      label: 'Flip Horizontally',
      commandName: 'flipViewportHorizontal',
      type: 'primary',
    },
  },
  {
    id: 'StackScroll',
    type: 'ohif.radioGroup',
    config: {
      groupName: 'primaryTool',
    },
    props: {
      isActive: false,
      icon: 'old-bars',
      label: 'Stack Scroll',
      commandName: 'setToolActive',
      commandOptions: { toolName: 'StackScroll' },
      type: 'primary',
    },
  },
  {
    id: 'Magnify',
    type: 'ohif.radioGroup',
    config: {
      groupName: 'primaryTool',
    },
    props: {
      isActive: false,
      icon: 'old-circle',
      label: 'Magnify',
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Magnify' },
      type: 'primary',
    },
  },
  {
    id: 'Invert',
    type: 'ohif.action',
    props: {
      icon: 'old-invert',
      label: 'Invert',
      commandName: 'invertViewport',
      type: 'primary',
    },
  },
  // TODO: Toggle
  {
    id: 'Cine',
    type: 'ohif.action',
    props: {
      icon: 'old-youtube',
      label: 'Cine',
      commandName: '',
      type: 'primary',
    },
  },
  // TODO: 2D MPR: We had said this was off the table?
  {
    id: 'Angle',
    type: 'ohif.radioGroup',
    config: {
      groupName: 'primaryTool',
    },
    props: {
      isActive: false,
      icon: 'old-angle-left',
      label: 'Angle',
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Angle' },
      type: 'primary',
    },
  },
  {
    id: 'Probe',
    type: 'ohif.radioGroup',
    config: {
      groupName: 'primaryTool',
    },
    props: {
      isActive: false,
      icon: 'old-dot-circle',
      label: 'Probe',
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Probe' },
      type: 'primary',
    },
  },
  {
    id: 'RectangleRoi',
    type: 'ohif.radioGroup',
    config: {
      groupName: 'primaryTool',
    },
    props: {
      isActive: false,
      icon: 'tool-move',
      label: 'Rectangle',
      commandName: 'setToolActive',
      commandOptions: { toolName: 'RectangleRoi' },
      type: 'primary',
    },
  },
  // ~~ Secondary
  {
    id: 'Annotate',
    type: 'ohif.radioGroup',
    config: {
      groupName: 'primaryTool',
    },
    props: {
      isActive: false,
      icon: 'tool-annotate',
      label: 'Annotate',
      commandName: 'setToolActive',
      commandOptions: { toolName: 'ArrowAnnotate' },
      type: 'secondary',
    },
  },
  {
    id: 'Bidirectional',
    type: 'ohif.radioGroup',
    config: {
      groupName: 'primaryTool',
    },
    props: {
      isActive: false,
      icon: 'tool-bidirectional',
      label: 'Bidirectional',
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Bidirectional' },
      type: 'secondary',
    },
  },
  {
    id: 'Ellipse',
    type: 'ohif.radioGroup',
    config: {
      groupName: 'primaryTool',
    },
    props: {
      isActive: false,
      icon: 'tool-elipse',
      label: 'Ellipse',
      commandName: 'setToolActive',
      commandOptions: { toolName: 'EllipticalRoi' },
      type: 'secondary',
    },
  },
  {
    id: 'Length',
    type: 'ohif.radioGroup',
    config: {
      groupName: 'primaryTool',
    },
    props: {
      isActive: false,
      icon: 'tool-length',
      label: 'Length',
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Length' },
      type: 'secondary',
    },
  },
];
