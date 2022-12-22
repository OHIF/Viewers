import MODULE_TYPES from './MODULE_TYPES.js';
import log from './../log.js';

export default class ExtensionManager {
  constructor({
    commandsManager,
    servicesManager,
    hotkeysManager,
    appConfig = {},
  }) {
    this.modules = {};
    this.registeredExtensionIds = [];
    this.moduleTypeNames = Object.values(MODULE_TYPES);
    //
    this._commandsManager = commandsManager;
    this._servicesManager = servicesManager;
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
    this.activeDataSource = undefined;
  }

  setActiveDataSource(dataSourceName) {
    this.activeDataSource = dataSourceName;
  }

  onModeEnter() {
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

  onModeExit() {
    const {
      registeredExtensionIds,
      _servicesManager,
      _commandsManager,
      _extensionLifeCycleHooks,
    } = this;

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
  registerExtensions = async (extensions, dataSources = []) => {
    // Todo: we ideally should be able to run registrations in parallel
    // but currently since some extensions need to be registered before
    // others, we need to run them sequentially. We need a postInit hook
    // to avoid this sequential async registration
    for (const extension of extensions) {
      const hasConfiguration = Array.isArray(extension);
      try {
        if (hasConfiguration) {
          const [ohifExtension, configuration] = extension;
          await this.registerExtension(
            ohifExtension,
            configuration,
            dataSources
          );
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
  registerExtension = async (
    extension,
    configuration = {},
    dataSources = []
  ) => {
    if (!extension) {
      throw new Error('Attempting to register a null/undefined extension.');
    }

    let extensionId = extension.id;

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
        commandsManager: this._commandsManager,
        hotkeysManager: this._hotkeysManager,
        extensionManager: this,
        appConfig: this._appConfig,
        configuration,
      });
    }

    if (extension.onModeEnter) {
      this._extensionLifeCycleHooks.onModeEnter[extensionId] =
        extension.onModeEnter;
    }

    if (extension.onModeExit) {
      this._extensionLifeCycleHooks.onModeExit[extensionId] =
        extension.onModeExit;
    }

    // Register Modules
    this.moduleTypeNames.forEach(moduleType => {
      const extensionModule = this._getExtensionModule(
        moduleType,
        extension,
        extensionId,
        configuration
      );

      if (extensionModule) {
        switch (moduleType) {
          case MODULE_TYPES.COMMANDS:
            this._initCommandsModule(extensionModule);
            break;
          case MODULE_TYPES.DATA_SOURCE:
            this._initDataSourcesModule(
              extensionModule,
              extensionId,
              dataSources
            );
            break;
          case MODULE_TYPES.HANGING_PROTOCOL:
            this._initHangingProtocolsModule(extensionModule, extensionId);
          case MODULE_TYPES.TOOLBAR:
          case MODULE_TYPES.VIEWPORT:
          case MODULE_TYPES.PANEL:
          case MODULE_TYPES.SOP_CLASS_HANDLER:
          case MODULE_TYPES.CONTEXT:
          case MODULE_TYPES.LAYOUT_TEMPLATE:
          case MODULE_TYPES.CUSTOMIZATION:
          case MODULE_TYPES.UTILITY:
            // Default for most extension points,
            // Just adds each entry ready for consumption by mode.
            extensionModule.forEach(element => {
              this.modulesMap[
                `${extensionId}.${moduleType}.${element.name}`
              ] = element;
            });
            break;
          default:
            throw new Error(`Module type invalid: ${moduleType}`);
        }

        this.modules[moduleType].push({
          extensionId,
          module: extensionModule,
        });
      }
    });

    // Track extension registration
    this.registeredExtensionIds.push(extensionId);
  };

  getModuleEntry = stringEntry => {
    return this.modulesMap[stringEntry];
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

  getDataSource = () => {
    return this.dataSourceMap[this.activeDataSource];
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
      const extensionModule = getModuleFn({
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
      throw new Error(
        `Exception thrown while trying to call ${getModuleFnName} for the ${extensionId} extension`
      );
    }
  };

  _initHangingProtocolsModule = (extensionModule, extensionId) => {
    const { HangingProtocolService } = this._servicesManager.services;
    extensionModule.forEach(({ id, protocol }) => {
      if (protocol) {
        // Only auto-register if protocol specified, otherwise let mode register
        HangingProtocolService.addProtocol(id, protocol);
      }
    });
  };

  _initDataSourcesModule(extensionModule, extensionId, dataSources = []) {
    const { UserAuthenticationService } = this._servicesManager.services;
    dataSources.forEach(dataSource => {
      this.dataSourceDefs[dataSource.sourceName] = dataSource;
    });

    extensionModule.forEach(element => {
      const namespace = `${extensionId}.${MODULE_TYPES.DATA_SOURCE}.${element.name}`;

      dataSources.forEach(dataSource => {
        if (dataSource.namespace === namespace) {
          const dataSourceInstance = element.createDataSource(
            dataSource.configuration,
            UserAuthenticationService
          );

          if (this.dataSourceMap[dataSource.sourceName]) {
            this.dataSourceMap[dataSource.sourceName].push(dataSourceInstance);
          } else {
            this.dataSourceMap[dataSource.sourceName] = [dataSourceInstance];
          }
        }
      });
    });

    extensionModule.forEach(element => {
      this.modulesMap[
        `${extensionId}.${MODULE_TYPES.DATA_SOURCE}.${element.name}`
      ] = element;
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
        commandDefinition.context &&
        !this._commandsManager.getContext(commandDefinition.context);

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
