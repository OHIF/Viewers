const commandsModule = ({ servicesManager }) => {
  const { MeasurementService, ViewportGridService } = servicesManager.services;

  const actions = {
    clearMeasurements: () => {
      MeasurementService.clear();
    },
    setIsCineEnabled: ({ isCineEnabled }) => {
      ViewportGridService.setIsCineEnabled(isCineEnabled);
    },
  };

  const definitions = {
    clearMeasurements: {
      commandFn: actions.clearMeasurements,
      storeContexts: [],
      options: {},
    },
    setIsCineEnabled: {
      commandFn: actions.setIsCineEnabled,
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
