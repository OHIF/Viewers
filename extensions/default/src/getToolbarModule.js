const TOOLBAR_BUTTON_TYPES = {
  COMMAND: 'command',
  SET_TOOL_ACTIVE: 'setToolActive',
  BUILT_IN: 'builtIn',
};

const definitions = [
  {
    id: 'Layout',
    label: 'Layout',
    icon: 'tool-layout',
    commandName: 'toggleLayoutSelectionDialog',
    commandOptions: {  },
  },
];

export default function getToolbarModule() {
  return { definitions, defaultContext: 'ACTIVE_VIEWPORT::CORNERSTONE' };
}
