/**
 *
 */
export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'example-extension',

  getViewportModule() {},
  getSopClassHandler() {},
  getPanelModule() {},
  getToolbarModule() {},
  getCommandsModule(/* store */) {
    return commandsModule;
  },
};

/**
 *
 */
const commandsModule = {
  actions: {
    // Store Contexts + Options
    exampleAction: ({ viewports, param1 }) => {
      console.log(`There are ${viewports.length} viewports`);
      console.log(`param1's value is: ${param1}`);
    },
  },
  definitions: {
    exampleActionDef: {
      commandFn: this.actions.exampleAction,
      storeContexts: ['viewports'],
      options: { param1: 'hello world' },
    },
  },
};
