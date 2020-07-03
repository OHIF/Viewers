const commandsModule = ({ servicesManager }) => {
  const { MeasurementService } = servicesManager.services;

  const actions = {
    clearMeasurements: () => {
      MeasurementService.clear();
    },
  };

  const definitions = {
    clearMeasurements: {
      commandFn: actions.clearMeasurements,
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
