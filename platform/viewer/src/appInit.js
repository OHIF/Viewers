import {
  CommandsManager,
  ExtensionManager,
  ServicesManager,
  // HotkeysManager,
  UINotificationService,
  UIModalService,
  UIDialogService,
  MeasurementService,
  // utils,
  // redux as reduxOHIF,
} from '@ohif/core';

import buildModeRoutes from './routes/buildModeRoutes';

/**
 * @param {object|func} appConfigOrFunc - application configuration, or a function that returns application configuration
 * @param {object[]} defaultExtensions - array of extension objects
 */
function appInit(appConfigOrFunc, defaultExtensions) {
  const appConfig = {
    ...(typeof appConfigOrFunc === 'function'
      ? appConfigOrFunc({ servicesManager })
      : appConfigOrFunc),
  };

  // TODO: Wire this up to Rodrigo's basic Context "ContextService"
  const commandsManagerConfig = {
    /** Used by commands to inject `viewports` from "redux" */
    getAppState: () => {},
    /** Used by commands to determine active context */
    getActiveContexts: () => ['VIEWER', 'ACTIVE_VIEWPORT::CORNERSTONE'],
  };
  const commandsManager = new CommandsManager(commandsManagerConfig);
  const servicesManager = new ServicesManager();
  // const hotkeysManager = new HotkeysManager(commandsManager, servicesManager);
  const extensionManager = new ExtensionManager({
    commandsManager,
    servicesManager,
    appConfig,
  });

  servicesManager.registerServices([
    UINotificationService,
    UIModalService,
    UIDialogService,
    MeasurementService,
  ]);

  debugger;

  /**
   * Example: [ext1, ext2, ext3]
   * Example2: [[ext1, config], ext2, [ext3, config]]
   */
  extensionManager.registerExtensions(
    [...defaultExtensions, ...appConfig.extensions],
    appConfig.dataSources
  );

  // TODO: Init global hotkeys, or the hotkeys manager?
  // TODO: We no longer use `utils.addServer`
  // TODO: We no longer init webWorkers at app level
  // TODO: We no longer init the user Manager

  // TODO: After extensions are registered, add modes and datasources to buildModeRoutes.js

  const { modes } = appConfig;

  // Temporarily for testing
  if (!modes.length) {
    modes.push(window.exampleMode);
  }

  const appRoutes =
    buildModeRoutes(modes, appConfig.dataSources, extensionManager) || [];

  return {
    appConfig,
    commandsManager,
    extensionManager,
    servicesManager,
    appRoutes,
  };
}

export default appInit;
