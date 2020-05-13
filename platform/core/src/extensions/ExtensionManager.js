import MODULE_TYPES from './MODULE_TYPES.js';
import log from './../log.js';

export default class ExtensionManager {
  constructor({ commandsManager, servicesManager, appConfig = {} }) {
    this.modules = {};
    this.registeredExtensionIds = [];
    this.moduleTypeNames = Object.values(MODULE_TYPES);
    //
    this._commandsManager = commandsManager;
    this._servicesManager = servicesManager;
    this._appConfig = appConfig;

    this.modulesMap = {};
    this.moduleTypeNames.forEach(moduleType => {
      this.modules[moduleType] = [];
    });
    this.dataSourceMap = {};

    console.log('modules map');
    console.log(this.modulesMap);
  }

  /**
   * An array of extensions, or an array of arrays that contains extension
   * configuration pairs.
   *
   * @param {Object[]} extensions - Array of extensions
   */
  registerExtensions = (extensions, dataSources) => {
    extensions.forEach(extension => {
      const hasConfiguration = Array.isArray(extension);

      if (hasConfiguration) {
        const [ohifExtension, configuration] = extension;
        this.registerExtension(ohifExtension, dataSources, configuration);
      } else {
        this.registerExtension(extension, dataSources);
      }
    });
  };

  /**
   *
   * TODO: Id Management: SopClassHandlers currently refer to viewport module by id; setting the extension id as viewport module id is a workaround for now
   * @param {Object} extension
   * @param {Object} configuration
   */
  registerExtension = (extension, dataSources, configuration = {}) => {
    if (!extension) {
      log.warn(
        'Attempting to register a null/undefined extension. Exiting early.'
      );
      return;
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
      extension.preRegistration({
        servicesManager: this._servicesManager,
        commandsManager: this._commandsManager,
        appConfig: this._appConfig,
        configuration,
      });
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
          case MODULE_TYPES.TOOLBAR:
            this._initToolBarModule(extensionModule, extensionId);
            break;

          case MODULE_TYPES.PANEL:
          case MODULE_TYPES.SOP_CLASS_HANDLER:
          case MODULE_TYPES.VIEWPORT:
          case MODULE_TYPES.CONTEXT:
          case MODULE_TYPES.LAYOUT_TEMPLATE:
            // Default for most extension points,
            // Just adds each entry ready for consumption by mode.
            if (!extensionModule.forEach) {
              debugger;
            }

            extensionModule.forEach(element => {
              this.modulesMap[
                `${extensionId}.${moduleType}.${element.name}`
              ] = element;
            });
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
    // Note: this currently uses the data source name, which feels weird...
    return this.dataSourceMap[dataSourceName];
  };

  _initToolBarModule = (extensionModule, extensionId) => {
    let { definitions, defaultContext } = extensionModule;
    if (!definitions || Object.keys(definitions).length === 0) {
      log.warn('Commands Module contains no command definitions');
      return;
    }

    defaultContext = defaultContext || 'VIEWER';

    definitions.forEach(definition => {
      console.log(`${extensionId}.${MODULE_TYPES.TOOLBAR}.${definition.id}`);

      // TODO -> Deep copy instead of mutation? We only do this once, but would be better.
      definition.context = definition.context || defaultContext;

      this.modulesMap[
        `${extensionId}.${MODULE_TYPES.TOOLBAR}.${definition.id}`
      ] = definition;
    });
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
        servicesManager: this._servicesManager,
        commandsManager: this._commandsManager,
        appConfig: this._appConfig,
        configuration,
      });

      if (!extensionModule) {
        log.warn(
          `Null or undefined returned when registering the ${getModuleFnName} module for the ${extensionId} extension`
        );
      }

      return extensionModule;
    } catch (ex) {
      log.error(
        `Exception thrown while trying to call ${getModuleFnName} for the ${extensionId} extension`
      );
      log.error(ex);
    }
  };

  _initDataSourcesModule(extensionModule, extensionId, dataSources) {
    extensionModule.forEach(element => {
      const namespace = `${extensionId}.${MODULE_TYPES.DATA_SOURCE}.${element.name}`;

      dataSources.forEach(dataSource => {
        if (dataSource.namespace === namespace) {
          const dataSourceInstance = element.createDataSource(
            dataSource.configuration
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
  return lower.charAt(0).toUpperCase() + lower.substr(1);
}
