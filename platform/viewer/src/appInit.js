import {
  CommandsManager,
  ExtensionManager,
  ServicesManager,
  // HotkeysManager,
  UINotificationService,
  UIModalService,
  UIDialogService,
  UIViewportDialogService,
  MeasurementService,
  DisplaySetService,
  ToolBarSerivce,
  ViewportGridService,
  // utils,
  // redux as reduxOHIF,
} from '@ohif/core';

// TODO -> this feels bad.

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
    UIViewportDialogService,
    MeasurementService,
    DisplaySetService,
    ToolBarSerivce,
    ViewportGridService,
  ]);

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

  // TODO: Remove this
  if (!appConfig.modes.length) {
    appConfig.modes.push(window.exampleMode);
    appConfig.modes.push(window.longitudinalMode);
  }

  return {
    appConfig,
    commandsManager,
    extensionManager,
    servicesManager,
  };
}

export default appInit;
