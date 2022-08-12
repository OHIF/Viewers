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
  SegmentationService,
  CineService,
  UserAuthenticationService,
  errorHandler,
  // utils,
} from '@ohif/core';
import umdLoader from './umdLoader';

/**
 * Loads the modules for the extensions.  Allows defining extensions using
 * a string name for the module, and loading the UMD module.
 * @param {(string|[string,object])[]} configExtensions
 * @param {(string|[string,object])[]} defaultExtensions
 */
async function loadExtensions(defaultExtensions = [], configExtensions = []) {
  const extensions = [];
  for (const extension of [...configExtensions, ...defaultExtensions]) {
    const packageName = Array.isArray(extension) ? extension[0] : extension;
    const packageModule = await umdLoader(packageName);
    if (!packageModule) {
      console.log('No extension named', packageName);
      continue;
    }
    if (Array.isArray(extension)) {
      extensions.push([packageModule, extension[1]]);
    } else {
      extensions.push(packageModule);
    }
  }
  return extensions;
}

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
    ToolBarService,
    ViewportGridService,
    HangingProtocolService,
    SegmentationService,
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
   * Extensions can be strings, to mean load the module dynmically, or they can
   * be a module itself.
   */
  const extensions = await loadExtensions(
    defaultExtensions,
    appConfig.extensions
  );
  await extensionManager.registerExtensions(extensions, appConfig.dataSources);

  // TODO: We no longer use `utils.addServer`
  // TODO: We no longer init webWorkers at app level
  // TODO: We no longer init the user Manager

  const useModes = appConfig.modes?.length ? appConfig.modes : defaultModes;
  // Start with a clean modes list for the actual modes load
  appConfig.modes = [];

  for (let i = 0; i < useModes.length; i++) {
    const modeName = useModes[i];
    let modeModule;
    try {
      modeModule = await umdLoader(modeName);
    } catch (reason) {
      console.warn('Unable to load mode', modeName, reason);
      continue;
    }
    if (!modeModule) {
      console.log('Mode not found, ignoring', modeName);
      continue;
    }
    const { modeFactory, id } = modeModule;

    if (!modeFactory) {
      console.warn('Registered mode does not export modeFactory', modeName);
      continue;
    }
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
