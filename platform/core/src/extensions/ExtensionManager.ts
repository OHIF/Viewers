import MODULE_TYPES from './MODULE_TYPES';
import log from '../log';
import { PubSubService, ServiceProvidersManager } from '../services';
import { HotkeysManager, CommandsManager } from '../classes';
import { DataSourceDefinition } from '../types';

/**
 * This is the arguments given to create the extension.
 */
export interface ExtensionConstructor {
  servicesManager: AppTypes.ServicesManager;
  serviceProvidersManager: ServiceProvidersManager;
  commandsManager: CommandsManager;
  hotkeysManager: HotkeysManager;
  appConfig: AppTypes.Config;
}

/**
 * The configuration of an extension.
 * This uses type as the extension manager only knows that the configuration
 * is an object of some sort, and doesn't know anything else about it.
 */
export type ExtensionConfiguration = Record<string, unknown>;

/**
 * The parameters passed to the extension.
 */
export interface ExtensionParams extends ExtensionConstructor {
  extensionManager: ExtensionManager;
  servicesManager: AppTypes.ServicesManager;
  serviceProvidersManager: ServiceProvidersManager;
  configuration?: ExtensionConfiguration;
}

/**
 * The type of an actual extension instance.
 * This is an interface as it declares possible calls, but extensions can
 * have more values than this.
 */
export interface Extension {
  id: string;
  preRegistration?: (p: ExtensionParams) => Promise<void> | void;
  getHangingProtocolModule?: (p: ExtensionParams) => unknown;
  getCommandsModule?: (p: ExtensionParams) => CommandsModule;
  getViewportModule?: (p: ExtensionParams) => unknown;
  getUtilityModule?: (p: ExtensionParams) => unknown;
  getCustomizationModule?: (p: ExtensionParams) => unknown;
  getSopClassHandlerModule?: (p: ExtensionParams) => unknown;
  getToolbarModule?: (p: ExtensionParams) => unknown;
  getPanelModule?: (p: ExtensionParams) => unknown;
  onModeEnter?: () => void;
  onModeExit?: () => void;
}

export type ExtensionRegister = {
  id: string;
  create: (p: ExtensionParams) => Extension;
};

export type CommandsModule = {
  actions: Record<string, unknown>;
  definitions: Record<string, unknown>;
  defaultContext?: string;
};

export default class ExtensionManager extends PubSubService {
  public static readonly EVENTS = {
    ACTIVE_DATA_SOURCE_CHANGED: 'event::activedatasourcechanged',
  };

  public static readonly MODULE_TYPES = MODULE_TYPES;

  private _commandsManager: CommandsManager;
  private _servicesManager: AppTypes.ServicesManager;
  private _hotkeysManager: HotkeysManager;
  private _serviceProvidersManager: ServiceProvidersManager;
  private modulesMap: Record<string, unknown>;
  private modules: Record<string, any[]>;
  private registeredExtensionIds: string[];
  private moduleTypeNames: string[];
  private _appConfig: any;
  private _extensionLifeCycleHooks: {
    onModeEnter: Record<string, any>;
    onModeExit: Record<string, any>;
  };
  private dataSourceMap: Record<string, any>;
  private dataSourceDefs: Record<string, any>;
  private defaultDataSourceName: string;
  private activeDataSource: string;

  constructor({
    commandsManager,
    servicesManager,
    serviceProvidersManager,
    hotkeysManager,
    appConfig = {},
  }: ExtensionConstructor) {
    super(ExtensionManager.EVENTS);
    this.modules = {};
    this.registeredExtensionIds = [];
    this.moduleTypeNames = Object.values(MODULE_TYPES);
    //
    this._commandsManager = commandsManager;
    this._servicesManager = servicesManager;
    this._serviceProvidersManager = serviceProvidersManager;
    this._hotkeysManager = hotkeysManager;
    this._appConfig = appConfig;

    this.modulesMap = {};
    this.moduleTypeNames.forEach(moduleType => {
      this.modules[moduleType] = [];
    });
    this._extensionLifeCycleHooks = { onModeEnter: {}, onModeExit: {} };
    this.dataSourceMap = {};
    this.dataSourceDefs = {};
    this.defaultDataSourceName = appConfig.defaultDataSourceName;
    this.activeDataSource = appConfig.defaultDataSourceName;
  }

  public setActiveDataSource(dataSource: string): void {
    if (this.activeDataSource === dataSource) {
      return;
    }

    this.activeDataSource = dataSource;

    this._broadcastEvent(
      ExtensionManager.EVENTS.ACTIVE_DATA_SOURCE_CHANGED,
      this.dataSourceDefs[this.activeDataSource]
    );
  }

  public getRegisteredExtensionIds() {
    return [...this.registeredExtensionIds];
  }

  /**
   * Calls all the services and extension on mode enters.
   * The service onModeEnter is called first
   * Then registered extensions onModeEnter is called
   * This is supposed to setup the extension for a standard entry.
   */
  public onModeEnter(): void {
    const {
      registeredExtensionIds,
      _servicesManager,
      _commandsManager,
      _hotkeysManager,
      _extensionLifeCycleHooks,
    } = this;

    // The onModeEnter of the service must occur BEFORE the extension
    // onModeEnter in order to reset the state to a standard state
    // before the extension restores and cached data.
    for (const service of Object.values(_servicesManager.services)) {
      service?.onModeEnter?.();
    }

    registeredExtensionIds.forEach(extensionId => {
      const onModeEnter = _extensionLifeCycleHooks.onModeEnter[extensionId];

      if (typeof onModeEnter === 'function') {
        onModeEnter({
          servicesManager: _servicesManager,
          commandsManager: _commandsManager,
          hotkeysManager: _hotkeysManager,
        });
      }
    });
  }

  public onModeExit(): void {
    const { registeredExtensionIds, _servicesManager, _commandsManager, _extensionLifeCycleHooks } =
      this;

    registeredExtensionIds.forEach(extensionId => {
      const onModeExit = _extensionLifeCycleHooks.onModeExit[extensionId];

      if (typeof onModeExit === 'function') {
        onModeExit({
          servicesManager: _servicesManager,
          commandsManager: _commandsManager,
        });
      }
    });

    // The service onModeExit calls must occur after the extension ones
    // so that extension ones can store/restore data.
    for (const service of Object.values(_servicesManager.services)) {
      try {
        service?.onModeExit?.();
      } catch (e) {
        console.warn('onModeExit caught', e);
      }
    }
  }

  /**
   * An array of extensions, or an array of arrays that contains extension
   * configuration pairs.
   *
   * @param {Object[]} extensions - Array of extensions
   */
  public registerExtensions = async (
    extensions: (ExtensionRegister | [ExtensionRegister, ExtensionConfiguration])[],
    dataSources: unknown[] = []
  ): Promise<void> => {
    // Todo: we ideally should be able to run registrations in parallel
    // but currently since some extensions need to be registered before
    // others, we need to run them sequentially. We need a postInit hook
    // to avoid this sequential async registration
    for (let i = 0; i < extensions.length; i++) {
      const extension = extensions[i];
      const hasConfiguration = Array.isArray(extension);
      try {
        if (hasConfiguration) {
          // Important: for some reason in the line below the type
          // of extension is not recognized as [ExtensionRegister,
          // ExtensionConfiguration] by babel DON"T CHANGE IT
          // Same for the for loop above don't use
          // for (const extension of extensions)
          const ohifExtension = extension[0];
          const configuration = extension[1];
          await this.registerExtension(ohifExtension, configuration, dataSources);
        } else {
          await this.registerExtension(extension, {}, dataSources);
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  /**
   *
   * TODO: Id Management: SopClassHandlers currently refer to viewport module by id; setting the extension id as viewport module id is a workaround for now
   * @param {Object} extension
   * @param {Object} configuration
   */
  public registerExtension = async (
    extension: ExtensionRegister,
    configuration = {},
    dataSources = []
  ): Promise<void> => {
    if (!extension) {
      throw new Error('Attempting to register a null/undefined extension.');
    }

    const extensionId = extension.id;

    if (!extensionId) {
      // Note: Mode framework cannot function without IDs.
      log.warn(extension);
      throw new Error(`Extension ID not set`);
    }

    if (this.registeredExtensionIds.includes(extensionId)) {
      log.warn(
        `Extension ID ${extensionId} has already been registered. Exiting before duplicating modules.`
      );
      return;
    }

    // preRegistrationHook
    if (extension.preRegistration) {
      await extension.preRegistration({
        servicesManager: this._servicesManager,
        serviceProvidersManager: this._serviceProvidersManager,
        commandsManager: this._commandsManager,
        hotkeysManager: this._hotkeysManager,
        extensionManager: this,
        appConfig: this._appConfig,
        configuration,
      });
    }

    if (extension.onModeEnter) {
      this._extensionLifeCycleHooks.onModeEnter[extensionId] = extension.onModeEnter;
    }

    if (extension.onModeExit) {
      this._extensionLifeCycleHooks.onModeExit[extensionId] = extension.onModeExit;
    }

    // Register Modules
    this.moduleTypeNames.forEach(moduleType => {
      const extensionModule = this._getExtensionModule(
        moduleType,
        extension,
        extensionId,
        configuration
      );

      if (!extensionModule) {
        return;
      }

      switch (moduleType) {
        case MODULE_TYPES.COMMANDS:
          this._initCommandsModule(extensionModule);
          break;

        case MODULE_TYPES.DATA_SOURCE:
          this._initDataSourcesModule(extensionModule, extensionId, dataSources);
          break;

        case MODULE_TYPES.HANGING_PROTOCOL:
          this._initHangingProtocolsModule(extensionModule, extensionId);
          break;

        case MODULE_TYPES.PANEL:
          this._initPanelModule(extensionModule, extensionId);
          break;

        case MODULE_TYPES.TOOLBAR:
          this._initToolbarModule(extensionModule, extensionId);
          break;

        case MODULE_TYPES.VIEWPORT:
        case MODULE_TYPES.SOP_CLASS_HANDLER:
        case MODULE_TYPES.CONTEXT:
        case MODULE_TYPES.LAYOUT_TEMPLATE:
        case MODULE_TYPES.CUSTOMIZATION:
        case MODULE_TYPES.STATE_SYNC:
        case MODULE_TYPES.UTILITY:
          this.processExtensionModule(extensionModule, extensionId, moduleType);
          break;
        default:
          throw new Error(`Module type invalid: ${moduleType}`);
      }

      this.modules[moduleType].push({
        extensionId,
        module: extensionModule,
      });
    });

    // Track extension registration
    this.registeredExtensionIds.push(extensionId);
  };

  /**
   * Retrieves the module entry associated with the given string entry
   * @param stringEntry - The string entry to retrieve the module entry for which is
   * in the format of `${extensionId}.${moduleType}.${moduleName}`
   * @returns The module entry associated with the given string entry.
   */
  getModuleEntry = stringEntry => {
    return this.modulesMap[stringEntry];
  };

  /**
   * Retrieves all modules of a given type for all registered extensions.
   *
   * @param moduleType - The type of modules to retrieve.
   * @returns An array of modules of the specified type.
   */
  getModulesByType = (moduleType: string) => {
    return this.modules[moduleType];
  };

  getDataSources = dataSourceName => {
    if (dataSourceName === undefined) {
      // Default to the activeDataSource
      dataSourceName = this.activeDataSource;
    }

    // Note: this currently uses the data source name, which feels weird...
    return this.dataSourceMap[dataSourceName];
  };

  getActiveDataSource = () => {
    return this.dataSourceMap[this.activeDataSource];
  };

  /**
   * Gets the data source definition for the given data source name.
   * If no data source name is provided, the active data source definition is
   * returned.
   * @param dataSourceName the data source name
   * @returns the data source definition
   */
  getDataSourceDefinition = dataSourceName => {
    if (dataSourceName === undefined) {
      // Default to the activeDataSource
      dataSourceName = this.activeDataSource;
    }

    return this.dataSourceDefs[dataSourceName];
  };

  /**
   * Gets the data source definition for the active data source.
   */
  getActiveDataSourceDefinition = () => {
    return this.getDataSourceDefinition(this.activeDataSource);
  };

  /**
   * @private
   * @param {string} moduleType
   * @param {Object} extension
   * @param {string} extensionId - Used for logging warnings
   */
  _getExtensionModule = (moduleType, extension, extensionId, configuration) => {
    const getModuleFnName = 'get' + _capitalizeFirstCharacter(moduleType);
    const getModuleFn = extension[getModuleFnName];

    if (!getModuleFn) {
      return;
    }

    try {
      const extensionModule = extension[getModuleFnName]({
        appConfig: this._appConfig,
        commandsManager: this._commandsManager,
        servicesManager: this._servicesManager,
        hotkeysManager: this._hotkeysManager,
        extensionManager: this,
        configuration,
      });

      if (!extensionModule) {
        log.warn(
          `Null or undefined returned when registering the ${getModuleFnName} module for the ${extensionId} extension`
        );
      }

      return extensionModule;
    } catch (ex) {
      console.log(ex);
      throw new Error(
        `Exception thrown while trying to call ${getModuleFnName} for the ${extensionId} extension`
      );
    }
  };

  _initHangingProtocolsModule = (extensionModule, extensionId) => {
    const { hangingProtocolService } = this._servicesManager.services;
    extensionModule.forEach(({ name, protocol }) => {
      if (protocol) {
        // Only auto-register if protocol specified, otherwise let mode register
        hangingProtocolService.addProtocol(name, protocol);
      }
    });
  };

  _initPanelModule = (extensionModule, extensionId) => {
    this.processExtensionModule(extensionModule, extensionId, MODULE_TYPES.PANEL);
  };

  _initToolbarModule = (extensionModule, extensionId) => {
    // check if the toolbar module has a handler function for evaluation of
    // the toolbar button state
    const { toolbarService } = this._servicesManager.services;
    extensionModule.forEach(toolbarButton => {
      if (toolbarButton.evaluate) {
        toolbarService.registerEvaluateFunction(toolbarButton.name, toolbarButton.evaluate);
      }
    });
  };

  /**
   * Processes an extension module.
   * @param extensionModule - The extension module to process.
   * @param extensionId - The ID of the extension.
   * @param moduleType - The type of the module.
   */
  private processExtensionModule(extensionModule, extensionId: string, moduleType: string) {
    extensionModule.forEach(element => {
      if (!element.name) {
        throw new Error(`Extension ID ${extensionId} module ${moduleType} element has no name`);
      }
      const id = `${extensionId}.${moduleType}.${element.name}`;
      element.id = id;
      this.modulesMap[id] = element;
    });
  }

  /**
   * Adds the given data source and optionally sets it as the active data source.
   * The method does this by first creating the data source.
   * @param dataSourceDef the data source definition to be added
   * @param activate flag to indicate if the added data source should be set to the active data source
   */
  addDataSource(dataSourceDef: DataSourceDefinition, options = { activate: false }) {
    const existingDataSource = this.getDataSources(dataSourceDef.sourceName);
    if (existingDataSource?.[0]) {
      // The data source already exists and cannot be added.
      return;
    }

    this._createDataSourceInstance(dataSourceDef);

    if (options.activate) {
      this.setActiveDataSource(dataSourceDef.sourceName);
    }
  }

  /**
   * Updates the configuration of the given data source name. It first creates a new data source with
   * the existing definition and the new configuration passed in.
   * @param dataSourceName the name of the data source to update
   * @param dataSourceConfiguration the new configuration to update the data source with
   */
  updateDataSourceConfiguration(dataSourceName: string, dataSourceConfiguration: any) {
    const existingDataSource = this.getDataSources(dataSourceName);
    if (!existingDataSource?.[0]) {
      // Cannot update a non existent data source.
      return;
    }

    const dataSourceDef = this.dataSourceDefs[dataSourceName];
    // Update the configuration.
    dataSourceDef.configuration = dataSourceConfiguration;
    this._createDataSourceInstance(dataSourceDef);

    if (this.activeDataSource === dataSourceName) {
      // When the active data source is changed/set, fire an event to indicate that its configuration has changed.
      this._broadcastEvent(ExtensionManager.EVENTS.ACTIVE_DATA_SOURCE_CHANGED, dataSourceDef);
    }
  }

  /**
   * Creates a data source instance from the given definition. The definition is
   * added to dataSourceDefs and the created instance is added to dataSourceMap.
   * @param dataSourceDef
   * @returns
   */
  _createDataSourceInstance(dataSourceDef: DataSourceDefinition) {
    const module = this.getModuleEntry(dataSourceDef.namespace);

    if (!module) {
      return;
    }

    this.dataSourceDefs[dataSourceDef.sourceName] = dataSourceDef;

    const dataSourceInstance = module.createDataSource(
      dataSourceDef.configuration,
      this._servicesManager,
      this
    );

    this.dataSourceMap[dataSourceDef.sourceName] = [dataSourceInstance];
  }

  _initDataSourcesModule(
    extensionModule,
    extensionId,
    dataSources: Array<DataSourceDefinition> = []
  ): void {
    extensionModule.forEach(element => {
      this.modulesMap[`${extensionId}.${MODULE_TYPES.DATA_SOURCE}.${element.name}`] = element;
    });

    extensionModule.forEach(element => {
      const namespace = `${extensionId}.${MODULE_TYPES.DATA_SOURCE}.${element.name}`;

      dataSources.forEach(dataSource => {
        if (dataSource.namespace === namespace) {
          this.addDataSource(dataSource);
        }
      });
    });
  }

  /**
   *
   * @private
   * @param {Object[]} commandDefinitions
   */
  _initCommandsModule = extensionModule => {
    let { definitions, defaultContext } = extensionModule;
    if (!definitions || Object.keys(definitions).length === 0) {
      log.warn('Commands Module contains no command definitions');
      return;
    }

    defaultContext = defaultContext || 'VIEWER';

    if (!this._commandsManager.getContext(defaultContext)) {
      this._commandsManager.createContext(defaultContext);
    }

    Object.keys(definitions).forEach(commandName => {
      const commandDefinition = definitions[commandName];
      const commandHasContextThatDoesNotExist =
        commandDefinition.context && !this._commandsManager.getContext(commandDefinition.context);

      if (commandHasContextThatDoesNotExist) {
        this._commandsManager.createContext(commandDefinition.context);
      }

      this._commandsManager.registerCommand(
        commandDefinition.context || defaultContext,
        commandName,
        commandDefinition
      );
    });
  };
}

/**
 * @private
 * @param {string} lower
 */
function _capitalizeFirstCharacter(lower) {
  return lower.charAt(0).toUpperCase() + lower.substring(1);
}
