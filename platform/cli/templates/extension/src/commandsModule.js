const commandsModule = ({ servicesManager, commandsManager }) => {
  const { UINotificationService } = servicesManager.services;

  const actions = {
    showClock: () => {
      const time = new Date();
      const localTime = time.toLocaleTimeString();

      UINotificationService.show({
        title: 'Time',
        message: `Time: ${localTime}`,
        type: 'success',
      });
    },
  };

  const definitions = {
    showClock: {
      commandFn: actions.showClock,
      storeContexts: [],
      options: {},
    },
  };

  return {
    actions,
    definitions,
    defaultContext: 'DEFAULT',
  };
};

export default commandsModule;
