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
  // {
  // TODO:
  // - Right, alternative StudyBrowser
  // - Left, alternative Measurements Table
  // menuOptions: [
  //   {
  //     // A suggested icon
  //     // Available icons determined by consuming app
  //     icon: 'list',
  //     // A suggested label
  //     label: 'Magic',
  //     // 'right' or 'left'
  //     from: 'right',
  //     // The target component to toggle open/close
  //     target: 'target-component-id',
  //     // Overrides `defaultContext`, if specified
  //     context: ['ACTIVE_VIEWPORT:MAGIC'],
  //   },
  // ],
  // components: [
  //   {
  //     id: 'target-component-id',
  //     component: MyComponent,
  //   },
  // ],
  // defaultContext: ['ROUTE:VIEWER'],
  // };

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
