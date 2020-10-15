import AIPredictionTable from './components/AIPredictionTable';
import { version } from '../package.json';
import { getDicomWebClientFromConfig } from '@ohif/extension-debugging/src/utils';
import stateDetails from './state';
import React from 'react';

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
      if (configuration.modelsDetails) {
        stateDetails.modelsDetails = configuration.modelsDetails;
      }
    }
    if (configuration) {
      if (configuration.options) {
        stateDetails.options = configuration.options;
      }
    }
  },

  getPanelModule({ servicesManager, commandsManager }) {
    const AIPredictionTablePanel = () => (
      <AIPredictionTable servicesManager={servicesManager} />
    );

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
          component: AIPredictionTablePanel,
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
