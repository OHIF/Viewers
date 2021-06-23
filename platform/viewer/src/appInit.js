import {
  CommandsManager,
  ExtensionManager,
  ServicesManager,
  HotkeysManager,
  UINotificationService,
  UIModalService,
  UIDialogService,
  UIViewportDialogService,
  MeasurementService,
  DisplaySetService,
  ToolBarService,
  ViewportGridService,
  HangingProtocolService,
  CineService,
  UserAuthenticationService,
  // utils,
} from '@ohif/core';

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

  const commandsManagerConfig = {
    getAppState: () => {},
    /** Used by commands to determine active context */
    getActiveContexts: () => [
      'VIEWER',
      'DEFAULT',
      'ACTIVE_VIEWPORT::CORNERSTONE',
    ],
  };

  const commandsManager = new CommandsManager(commandsManagerConfig);
  const servicesManager = new ServicesManager(commandsManager);
  const hotkeysManager = new HotkeysManager(commandsManager, servicesManager);
  const extensionManager = new ExtensionManager({
    commandsManager,
    servicesManager,
    hotkeysManager,
    appConfig,
  });

  servicesManager.registerServices([
    UINotificationService,
    UIModalService,
    UIDialogService,
    UIViewportDialogService,
    MeasurementService,
    DisplaySetService,
    ToolBarService,
    ViewportGridService,
    HangingProtocolService,
    CineService,
    UserAuthenticationService,
  ]);

  /**
   * Example: [ext1, ext2, ext3]
   * Example2: [[ext1, config], ext2, [ext3, config]]
   */
  extensionManager.registerExtensions(
    [...defaultExtensions, ...appConfig.extensions],
    appConfig.dataSources
  );

  // TODO: We no longer use `utils.addServer`
  // TODO: We no longer init webWorkers at app level
  // TODO: We no longer init the user Manager

  if (!appConfig.modes) {
    throw new Error('No modes are defined! Check your app-config.js');
  }

  // TODO: Remove this
  if (!appConfig.modes.length) {
    appConfig.modes.push(window.longitudinalMode);
    // appConfig.modes.push(window.segmentationMode);
  }

  return {
    appConfig,
    commandsManager,
    extensionManager,
    servicesManager,
    hotkeysManager,
  };
}

export default appInit;
