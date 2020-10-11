import AIPredictionTable from './components/AIPredictionTable';
import { version } from '../package.json';
import {getDicomWebClientFromConfig} from "@ohif/extension-debugging/src/utils";
import stateDetails from './components/state';

const sharedContext = {
  dicomWebClient: null,
};

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'dicom-model-prediction',
  version,

  /**
   * @param {object} params
   * @param {ServicesManager} params.servicesManager
   * @param {CommandsManager} params.commandsManager
   */

  preRegistration({ appConfig, configuration }) {
    const dicomWebClient = getDicomWebClientFromConfig(appConfig);
    if (dicomWebClient) {
      sharedContext.dicomWebClient = dicomWebClient;
    }

    if (configuration) {
      if (configuration.infoApi) {
        stateDetails.infoApi = configuration.infoApi;
      }
    }
  },

  getPanelModule({ servicesManager, commandsManager }) {
    return {
      menuOptions: [
        {
          icon: 'search',
          label: 'Prediction',
          target: 'ai-prediction-panel',
        },
      ],
      components: [
        {
          id: 'ai-prediction-panel',
          component: AIPredictionTable,
        },
      ],
      defaultContext: ['VIEWER'],
    };
  },

  /**
   * @param {object} params
   * @param {ServicesManager} params.servicesManager
   * @param {CommandsManager} params.commandsManager
   * @returns Object
   */
  getToolbarModule() {
    return null;
  },

  /**
   * @param {object} params
   * @param {ServicesManager} params.servicesManager
   * @param {CommandsManager} params.commandsManager
   * @returns Object
   */
  getCommandsModule() {
    return null;
  },
};
