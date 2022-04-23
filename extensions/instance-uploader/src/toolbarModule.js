const TOOLBAR_BUTTON_TYPES = {
  COMMAND: 'command',
};

const definitions = [
  {
    id: 'UploadInstances',
    label: 'Upload Instance',
    icon: 'database',
    //
    type: TOOLBAR_BUTTON_TYPES.COMMAND,
    commandName: 'uploadInstancesOnActiveViewport',
    context: 'VIEWER',
  },
];

export default {
  definitions,
  defaultContext: 'VIEWER',
};
