// SEE: Async imports (code-splitting)
// import asyncComponent from './asyncComponent.js';
// import OHIFDicomPDFSopClassHandler from './OHIFDicomPDFSopClassHandler.js';

// const ConnectedOHIFDicomPDFViewer = asyncComponent(() =>
//   import(
//     /* webpackChunkName: "ConnectedOHIFDicomPDFViewer" */ './ConnectedOHIFDicomPDFViewer'
//   )
// );

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
    return undefined;
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
  },

  /**
   * @param {object} params
   * @param {ServicesManager} params.servicesManager
   * @param {CommandsManager} params.commandsManager
   * @returns Object
   */
  getToolbarModule({ servicesManager, commandsManager }) {
    // TODO: Zoom, Levels, Pan, More (see lesiontracker.ohif.org)
    // These may be driven through configuration of `cornerstone` extension instead of defined here
    return {
      definitions: [
        {
          id: 'say-hell-world',
          label: '🎉 HELLO WORLD 🎉',
          icon: 'exclamation-triangle',
          type: 'command',
          commandName: 'sayHelloWorld',
        },
      ],
      defaultContext: 'VIEWER',
    };
  },

  /**
   * @param {object} params
   * @param {ServicesManager} params.servicesManager
   * @param {CommandsManager} params.commandsManager
   * @returns Object
   */
  getCommandsModule({ servicesManager }) {
    const { UINotificationService } = servicesManager.services;
    return {
      definitions: {
        sayHelloWorld: {
          commandFn: function() {
            console.log(UINotificationService);
            UINotificationService.show({
              title: 'What does a nosey pepper do?',
              message: 'Gets jalapeno business!',
            });
          },
          storeContexts: [],
          options: {},
        },
      },
      defaultContext: ['VIEWER'],
    };
  },
};
