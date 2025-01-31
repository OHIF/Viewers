import commandsModule from './commandsModule';
let onModeInit = false;

const extension = {
  id: 'deemea-extension',

  preRegistration({ servicesManager, commandsManager, configuration = {} }) {
    // Any pre-registration tasks
  },

  onModeEnter: ({ extensionManager, servicesManager, commandsManager }) => {
    const { measurementService } = servicesManager.services;
    commandsManager.runCommand('demonstrateMeasurementService');

    measurementService.clearMeasurements();
    if (!onModeInit) {
      onModeInit = true;
      commandsManager.runCommand('createForms');
    }
  },

  onModeExit: ({ servicesManager, commandsManager }) => {
    const { measurementService } = servicesManager.services;
    console.log('onModeExit', commandsManager.getContext());
    measurementService.reset();
  },

  getCommandsModule({ servicesManager }) {
    return commandsModule({ servicesManager });
  },
};

export default extension;
