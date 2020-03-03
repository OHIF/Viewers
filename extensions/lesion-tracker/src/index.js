import MeasurementComparisonTable from './components/MeasurementComparisonTable';

import { LTStudyBrowser } from './LTStudyBrowser';

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'lesion-tracker',

  /**
   * @param {object} params
   * @param {ServicesManager} params.servicesManager
   * @param {CommandsManager} params.commandsManager
   */
  getPanelModule({ servicesManager, commandsManager }) {
    return {
      menuOptions: [
        {
          icon: 'list',
          label: 'Studies',
          from: 'left',
          target: 'lesion-tracker-study-browser',
          context: ['VIEWER'],
        },
        {
          icon: 'th-list',
          label: 'Measurements',
          from: 'right',
          target: 'lesion-tracker-panel',
        },
      ],
      components: [
        {
          id: 'lesion-tracker-study-browser',
          component: LTStudyBrowser,
        },
        {
          id: 'lesion-tracker-panel',
          component: MeasurementComparisonTable,
        },
      ],
      defaultContext: ['ACTIVE_VIEWPORT:VIEWER'],
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
