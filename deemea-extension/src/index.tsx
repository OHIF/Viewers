import commandsModule from './commandsModule';
import getPanelModule from './components/getPanelModule';
let onModeInit = false;

const extension = {
  id: 'deemea-extension',

  preRegistration({ servicesManager, commandsManager, configuration = {} }) {
    // Any pre-registration tasks
  },

  onModeEnter: ({ extensionManager, servicesManager, commandsManager }) => {
    commandsManager.runCommand('demonstrateMeasurementService');

    if (!onModeInit) {
      onModeInit = true;
      commandsManager.runCommand('createForms');
    }
  },

  onModeExit: ({ servicesManager, commandsManager }) => {
    const { measurementService } = servicesManager.services;
    measurementService.reset();
  },

  getCommandsModule({ servicesManager }) {
    return commandsModule({ servicesManager });
  },

  getPanelModule,
};

export default extension;
