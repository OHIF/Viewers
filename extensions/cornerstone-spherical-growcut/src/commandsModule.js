const actions = {
  setToolActive: ({ toolName }) => {
    if (!toolName) {
      console.warn('No toolname provided to setToolActive command');
    }
    cornerstoneTools.setToolActive(toolName, { mouseButtonMask: 1 });
  },
};

const definitions = {
  setToolActive: {
    commandFn: actions.setToolActive,
    storeContexts: [],
    options: {},
  },
};

export default {
  actions,
  definitions,
  defaultContext: 'ACTIVE_VIEWPORT::CORNERSTONE',
};
