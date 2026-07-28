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
  StudyPrefetcherService,
  MultiMonitorService,
  // utils,
} from '@ohif/core';

import loadModules, { loadModule as peerImport } from './pluginImports';
import { reconcileRuntimeRegistrations } from './runtimeExtensionLoader';
import { publicUrl } from './utils/publicUrl';

/**
 * @param {object|function} appConfigOrFunc - application configuration, or a function that returns application configuration
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
      ? await appConfigOrFunc({ servicesManager, peerImport })
      : appConfigOrFunc),
  };
  // Default the peer import function
  appConfig.peerImport ||= peerImport;
  appConfig.measurementTrackingMode ||= 'standard';
  appConfig.routerBasename ||= publicUrl;

  const extensionManager = new ExtensionManager({
    commandsManager,
    servicesManager,
    serviceProvidersManager,
    hotkeysManager,
    appConfig,
  });

  servicesManager.setExtensionManager(extensionManager);

  servicesManager.registerServices([
    [MultiMonitorService.REGISTRATION, appConfig.multimonitor],
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
    [StudyPrefetcherService.REGISTRATION, appConfig.studyPrefetcher],
  ]);

  errorHandler.getHTTPErrorHandler = () => {
    if (typeof appConfig.httpErrorHandler === 'function') {
      return appConfig.httpErrorHandler;
    }
  };

  // Stash the allowlist so the runtime extension loader can read it even when
  // the app config is a function (loadDynamicConfig may also have replaced
  // window.config by now).
  if (Array.isArray(appConfig.runtimeExtensionOrigins)) {
    window.__ohif = window.__ohif || {};
    window.__ohif.runtimeExtensionOrigins = appConfig.runtimeExtensionOrigins;
  }

  /**
   * Example: [ext1, ext2, ext3]
   * Example2: [[ext1, config], ext2, [ext3, config]]
   */
  const loadedExtensions = await loadModules([...defaultExtensions, ...appConfig.extensions]);

  const { customizationService } = servicesManager.services;

  if (!appConfig.modes) {
    throw new Error('No modes are defined! Check your app-config.js');
  }

  // Load the mode modules and register the customizations they carry (plain
  // `customizationId -> value` maps on the mode definition) at Default scope
  // BEFORE the bootstrap phase applies, so bootstrap / `?customization=`
  // modules can modify a mode's registered values before anything reads them.
  // The mode *instances* are only created after the global phase (below), so
  // they too see any modifications.
  const loadedModes = await loadModules([...(appConfig.modes || []), ...defaultModes]);
  for (const mode of loadedModes) {
    if (mode?.customizations) {
      customizationService.addReferences(mode.customizations, customizationService.Scope.Default);
    }
  }

  // Resolve every customization module up front — from
  // `appConfig.customizationService.requires` and the `?customization=` URL
  // parameter — then apply the `bootstrap` phase BEFORE extensions register so
  // it is in place while they initialize. Modules are only loaded when
  // `appConfig.customizationUrlPrefixes` allows their prefix; the feature is
  // off by default, and a value with an unconfigured prefix throws here
  // (aborting startup) rather than being silently ignored.
  await customizationService.loadAndApplyBootstrapCustomizations(extensionManager);

  await extensionManager.registerExtensions(loadedExtensions, appConfig.dataSources);

  // registerExtensions swallows per-extension errors internally, so diff the
  // audit records against what actually registered.
  reconcileRuntimeRegistrations(extensionManager, appConfig.extensions ?? []);

  // Merge extension default/global modules, then layer on the `global` phase of
  // the structured config + the URL modules resolved above (so `$apply`-style
  // overrides see the extension-provided defaults they build on).
  customizationService.init(extensionManager);
  customizationService.applyGlobalCustomizations();

  // TODO: We no longer use `utils.addServer`
  // TODO: We no longer init webWorkers at app level
  // TODO: We no longer init the user Manager

  // This is the name for the loaded instance object
  appConfig.loadedModes = [];
  const modesById = new Set();
  for (let i = 0; i < loadedModes.length; i++) {
    let mode = loadedModes[i];
    if (!mode) {
      continue;
    }
    const { id } = mode;

    if (modesById.has(id)) {
      continue;
    }

    // If the appConfig contains configuration for this mode, use it.
    const modeConfiguration =
      appConfig.modesConfiguration && appConfig.modesConfiguration[id]
        ? appConfig.modesConfiguration[id]
        : {};

    // Mirrors the extension commands path for modes, but registers before the
    // mode is instantiated so the commands are usable on the worklist, ahead
    // of any mode route being entered. Definitions land in the 'WORKLIST'
    // context unless the module (or an individual command) declares its own.
    if (typeof mode.getCommandsModule === 'function') {
      extensionManager.registerCommandsModule(
        mode.getCommandsModule({
          appConfig,
          commandsManager,
          servicesManager,
          serviceProvidersManager,
          hotkeysManager,
          extensionManager,
          modeConfiguration,
        }),
        'WORKLIST'
      );
    }

    if (mode.modeFactory) {
      mode = await mode.modeFactory({ modeConfiguration, loadModules });
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
