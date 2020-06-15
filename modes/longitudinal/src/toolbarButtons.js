export default [
  // Divider
  {
    id: 'Divider',
    type: 'ohif.divider',
  },
  // Primary
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
  // Secondary
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
      type: 'secondary', // Purely for background color/hover styles :|
      // Layout Template can set this?
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
