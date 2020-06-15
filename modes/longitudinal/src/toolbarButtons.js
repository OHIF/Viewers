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
