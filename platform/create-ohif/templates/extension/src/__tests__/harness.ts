/**
 * Headless registration harness. It deliberately imports NOTHING outside this
 * package: the published @ohif/core UMD requires host-provided externals
 * (dcmjs, @ohif/ui, ...) that a scaffolded package does not install, so this
 * replicates ExtensionManager.registerExtension's observable contract with
 * mock managers instead. It catches the contract mistakes that break loading
 * in the host: a missing `id`, getters that throw, and module entries without
 * a `name`.
 */

// Mirrors platform/core/src/extensions/MODULE_TYPES.js: module type -> getter.
export const MODULE_GETTERS: Record<string, string> = {
  commandsModule: 'getCommandsModule',
  customizationModule: 'getCustomizationModule',
  stateSyncModule: 'getStateSyncModule',
  dataSourcesModule: 'getDataSourcesModule',
  panelModule: 'getPanelModule',
  sopClassHandlerModule: 'getSopClassHandlerModule',
  toolbarModule: 'getToolbarModule',
  viewportModule: 'getViewportModule',
  contextModule: 'getContextModule',
  layoutTemplateModule: 'getLayoutTemplateModule',
  hangingProtocolModule: 'getHangingProtocolModule',
  utilityModule: 'getUtilityModule',
};

const noop = () => undefined;

export async function registerExtensionHarness(extension: any) {
  // Mirrors ExtensionManager.registerExtension's fail-fast guards.
  if (!extension) {
    throw new Error('Attempting to register a null/undefined extension');
  }
  if (!extension.id) {
    throw new Error('Extension does not have an id');
  }

  // Mock manager shapes taken from ExtensionManager.test.js.
  const commandsManager = {
    createContext: noop,
    getContext: noop,
    registerCommand: noop,
  };
  const servicesManager = {
    registerService: noop,
    services: {
      UserAuthenticationService: {},
      HangingProtocolService: { addProtocol: noop },
      toolbarService: {},
    },
  };
  const params = {
    servicesManager,
    commandsManager,
    extensionManager: null,
    configuration: {},
    appConfig: {},
  };

  await extension.preRegistration?.(params);

  const modules: Record<string, any> = {};
  for (const [moduleType, getterName] of Object.entries(MODULE_GETTERS)) {
    const getter = extension[getterName];
    if (typeof getter !== 'function') {
      continue;
    }
    const result = getter.call(extension, params);
    if (moduleType === 'commandsModule') {
      if (!result || typeof result.actions !== 'object' || typeof result.definitions !== 'object') {
        throw new Error(`${getterName} must return { actions, definitions }`);
      }
    } else {
      if (!Array.isArray(result) || result.length === 0) {
        throw new Error(`${getterName} must return a non-empty array of module entries`);
      }
      for (const entry of result) {
        if (!entry || typeof entry.name !== 'string' || entry.name.length === 0) {
          // Mirrors the host's "module element has no name" registration throw.
          throw new Error(`A ${moduleType} entry from ${getterName} has no string 'name'`);
        }
      }
    }
    modules[moduleType] = result;
  }

  return { modules };
}
