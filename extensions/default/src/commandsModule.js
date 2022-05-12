const commandsModule = ({ servicesManager, commandsManager }) => {
  const {
    MeasurementService,
    HangingProtocolService,
  } = servicesManager.services;

  const actions = {
    clearMeasurements: () => {
      MeasurementService.clear();
    },
    nextStage: () => {
      // next stage in hanging protocols
      HangingProtocolService.nextProtocolStage();
    },
    previousStage: () => {
      HangingProtocolService.previousProtocolStage();
    },
  };

  const definitions = {
    clearMeasurements: {
      commandFn: actions.clearMeasurements,
      storeContexts: [],
      options: {},
    },

    nextStage: {
      commandFn: actions.nextStage,
      storeContexts: [],
      options: {},
    },
    previousStage: {
      commandFn: actions.previousStage,
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
