import {
  CommandsManager,
  ExtensionManager,
  ServicesManager,
  ServiceProvidersManager,
  HotkeysManager,
  UINotificationService,
  UIModalService,
  UIDialogService,
  UIViewportDialogService,
  MeasurementService,
  StateSyncService,
  DisplaySetService,
  ToolbarService,
  ViewportGridService,
  HangingProtocolService,
  CineService,
  UserAuthenticationService,
  errorHandler,
  CustomizationService,
  PanelService,
  WorkflowStepsService,
  // utils,
} from '@ohif/core';

import loadModules from './pluginImports';

/**
 * @param {object|func} appConfigOrFunc - application configuration, or a function that returns application configuration
 * @param {object[]} defaultExtensions - array of extension objects
 */
async function appInit(appConfigOrFunc, defaultExtensions, defaultModes) {
  const commandsManagerConfig = {
    getAppState: () => {},
  };

  const commandsManager = new CommandsManager(commandsManagerConfig);
  const servicesManager = new ServicesManager(commandsManager);
  const serviceProvidersManager = new ServiceProvidersManager();
  const hotkeysManager = new HotkeysManager(commandsManager, servicesManager);

  const appConfig = {
    ...(typeof appConfigOrFunc === 'function'
      ? await appConfigOrFunc({ servicesManager, loadModules })
      : appConfigOrFunc),
  };

  const extensionManager = new ExtensionManager({
    commandsManager,
    servicesManager,
    serviceProvidersManager,
    hotkeysManager,
    appConfig,
  });

  servicesManager.setExtensionManager(extensionManager);

  servicesManager.registerServices([
    UINotificationService.REGISTRATION,
    UIModalService.REGISTRATION,
    UIDialogService.REGISTRATION,
    UIViewportDialogService.REGISTRATION,
    MeasurementService.REGISTRATION,
    DisplaySetService.REGISTRATION,
    [CustomizationService.REGISTRATION, appConfig.customizationService],
    ToolbarService.REGISTRATION,
    ViewportGridService.REGISTRATION,
    HangingProtocolService.REGISTRATION,
    CineService.REGISTRATION,
    UserAuthenticationService.REGISTRATION,
    PanelService.REGISTRATION,
    WorkflowStepsService.REGISTRATION,
    StateSyncService.REGISTRATION,
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
  const loadedExtensions = await loadModules([...defaultExtensions, ...appConfig.extensions]);
  await extensionManager.registerExtensions(loadedExtensions, appConfig.dataSources);

  // TODO: We no longer use `utils.addServer`
  // TODO: We no longer init webWorkers at app level
  // TODO: We no longer init the user Manager

  if (!appConfig.modes) {
    throw new Error('No modes are defined! Check your app-config.js');
  }

  const loadedModes = await loadModules([...(appConfig.modes || []), ...defaultModes]);

  // This is the name for the loaded instance object
  appConfig.loadedModes = [];
  const modesById = new Set();
  for (let i = 0; i < loadedModes.length; i++) {
    let mode = loadedModes[i];
    if (!mode) {
      continue;
    }
    const { id } = mode;

    if (mode.modeFactory) {
      // If the appConfig contains configuration for this mode, use it.
      const modeConfiguration =
        appConfig.modesConfiguration && appConfig.modesConfiguration[id]
          ? appConfig.modesConfiguration[id]
          : {};

      mode = await mode.modeFactory({ modeConfiguration, loadModules });
    }

    if (modesById.has(id)) {
      continue;
    }
    // Prevent duplication
    modesById.add(id);
    if (!mode || typeof mode !== 'object') {
      continue;
    }
    appConfig.loadedModes.push(mode);
  }
  // Hack alert - don't touch the original modes definition,
  // but there are still dependencies on having the appConfig modes defined
  appConfig.modes = appConfig.loadedModes;

  return {
    appConfig,
    commandsManager,
    extensionManager,
    servicesManager,
    serviceProvidersManager,
    hotkeysManager,
  };
}

export default appInit;
