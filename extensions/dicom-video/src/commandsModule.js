const commandsModule = () => {
  const actions = {
    aCommand: ({ viewports }) => {},
  };

  const definitions = {
    aCommand: {
      commandFn: actions.aCommand,
      storeContexts: ['viewports'],
      options: {},
    },
  };

  return {
    actions,
    definitions,
    defaultContext: 'ACTIVE_VIEWPORT::VIDEO',
  };
};

export default commandsModule;
