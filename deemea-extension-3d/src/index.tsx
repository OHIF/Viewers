// import commandsModule from './commandsModule';
// const onModeInit = false;

const extension = {
  id: 'deemea-extension-3d',

  preRegistration({ servicesManager, commandsManager, configuration = {} }) {
    // Any pre-registration tasks
  },

  onModeEnter: ({ extensionManager, servicesManager, commandsManager }) => {
    const { measurementService } = servicesManager.services;

    measurementService.clearMeasurements();
  },

  onModeExit: ({ servicesManager, commandsManager }) => {
    const { measurementService } = servicesManager.services;
    console.log('onModeExit', commandsManager.getContext());
    measurementService.reset();
  },
};

export default extension;
