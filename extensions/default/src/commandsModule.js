const commandsModule = ({ servicesManager, commandsManager }) => {
  const {
    MeasurementService,
    HangingProtocolService,
    UINotificationService,
  } = servicesManager.services;

  const actions = {
    displayNotification: ({ text }) => {
      UINotificationService.show({
        title: 'RectangleROI Threshold Tip',
        message: text,
        type: 'info',
      });
    },
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
    displayNotification: {
      commandFn: actions.displayNotification,
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
