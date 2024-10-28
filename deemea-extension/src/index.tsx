import commandsModule from './commandsModule';
import getPanelModule from './components/getPanelModule';

const extension = {
  id: 'deemea-extension',

  preRegistration({ servicesManager, commandsManager, configuration = {} }) {
    // Any pre-registration tasks
  },

  onModeEnter: ({ extensionManager, servicesManager, commandsManager }) => {
    console.log('onModeEnter', servicesManager);

    

    commandsManager.runCommand('demonstrateMeasurementService');
  },

  getCommandsModule({ servicesManager }) {
    return commandsModule({ servicesManager });
  },

  getPanelModule,
};

export default extension;
