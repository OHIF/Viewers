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
  errorHandler,
  CustomizationServiceRegistration,
  // utils,
} from '@ohif/core';

/**
 * @param {object|func} appConfigOrFunc - application configuration, or a function that returns application configuration
 * @param {object[]} defaultExtensions - array of extension objects
 */
async function appInit(appConfigOrFunc, defaultExtensions, defaultModes) {
  const appConfig = {
    ...(typeof appConfigOrFunc === 'function'
      ? appConfigOrFunc({ servicesManager })
      : appConfigOrFunc),
  };

  const commandsManagerConfig = {
    getAppState: () => {},
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
    [CustomizationServiceRegistration, appConfig.customizationService],
    ToolBarService,
    ViewportGridService,
    HangingProtocolService,
    CineService,
    UserAuthenticationService,
  ]);

  errorHandler.getHTTPErrorHandler = () => {
    if (typeof appConfig.httpErrorHandler === 'function') {
      return appConfig.httpErrorHandler;
    }
  };

  /**
   * Example: [ext1, ext2, ext3]
   * Example2: [[ext1, config], ext2, [ext3, config]]
   */
  await extensionManager.registerExtensions(
    [...defaultExtensions, ...appConfig.extensions],
    appConfig.dataSources
  );

  // TODO: We no longer use `utils.addServer`
  // TODO: We no longer init webWorkers at app level
  // TODO: We no longer init the user Manager

  if (!appConfig.modes) {
    throw new Error('No modes are defined! Check your app-config.js');
  }

  for (let i = 0; i < defaultModes.length; i++) {
    const { modeFactory, id } = defaultModes[i];

    // If the appConfig contains configuration for this mode, use it.
    const modeConfig =
      appConfig.modeConfig && appConfig.modeConfig[i]
        ? appConfig.modeConfig[id]
        : {};

    const mode = modeFactory(modeConfig);

    appConfig.modes.push(mode);
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
