const commandsModule = ({ servicesManager, commandsManager }) => {
  const {
    MeasurementService,
    ViewportGridService,
    ToolBarService,
    HangingProtocolService,
    CineService,
  } = servicesManager.services;

  const actions = {
    clearMeasurements: () => {
      MeasurementService.clear();
    },
    toggleCine: () => {
      const { viewports } = ViewportGridService.getState();
      const { isCineEnabled } = CineService.getState();
      CineService.setIsCineEnabled(!isCineEnabled);
      ToolBarService.setButton('Cine', { props: { isActive: !isCineEnabled } });
      viewports.forEach((_, index) =>
        CineService.setCine({ id: index, isPlaying: false })
      );
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
    toggleCine: {
      commandFn: actions.toggleCine,
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
