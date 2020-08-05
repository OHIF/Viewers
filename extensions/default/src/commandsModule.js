const commandsModule = ({ servicesManager, commandsManager }) => {
  const { MeasurementService, ViewportGridService, ToolBarService } = servicesManager.services;

  const actions = {
    clearMeasurements: () => {
      MeasurementService.clear();
    },
    toggleCine: () => {
      const { viewports, isCineEnabled } = ViewportGridService.getState();
      ViewportGridService.setIsCineEnabled(!isCineEnabled);
      ToolBarService.setButton('Cine', { props: { isActive: !isCineEnabled } });
      viewports.forEach((vp, index) => {
        ViewportGridService.setCineForViewport({
          viewportIndex: index,
          cine: { ...vp.cine, isPlaying: false },
        });
      });
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
  };

  return {
    actions,
    definitions,
    defaultContext: 'DEFAULT',
  };
};

export default commandsModule;
