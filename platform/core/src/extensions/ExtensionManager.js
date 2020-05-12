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
      extensionId = Math.random()
        .toString(36)
        .substr(2, 5);

      log.warn(`Extension ID not set. Using random string ID: ${extensionId}`);
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
        this._initSpecialModuleTypes(
          extensionId,
          moduleType,
          extensionModule,
          dataSources
        );

        this.modules[moduleType].push({
          extensionId,
          module: extensionModule,
        });

        // TODO -> deal with command modules.

        extensionModule.forEach(element => {
          this.modulesMap[
            `${extensionId}.${moduleType}.${element.name}`
          ] = element;
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

  _initSpecialModuleTypes = (
    extensionId,
    moduleType,
    extensionModule,
    dataSources
  ) => {
    switch (moduleType) {
      case 'commandsModule': {
        const { definitions, defaultContext } = extensionModule;
        if (!definitions || Object.keys(definitions).length === 0) {
          log.warn('Commands Module contains no command definitions');
          return;
        }
        this._initCommandsModule(definitions, defaultContext);
        break;
      }
      case 'dataSourcesModule': {
        extensionModule.forEach(element => {
          const namespace = `${extensionId}.${moduleType}.${element.name}`;

          dataSources.forEach(dataSource => {
            if (dataSource.namespace === namespace) {
              const dataSourceInstance = element.createDataSource(
                dataSource.configuration
              );

              if (this.dataSourceMap[dataSource.sourceName]) {
                this.dataSourceMap[dataSource.sourceName].push(
                  dataSourceInstance
                );
              } else {
                this.dataSourceMap[dataSource.sourceName] = [
                  dataSourceInstance,
                ];
              }
            }
          });
        });

        break;
      }
      default:
      // code block
    }
  };

  /**
   *
   * @private
   * @param {Object[]} commandDefinitions
   */
  _initCommandsModule = (commandDefinitions, defaultContext = 'VIEWER') => {
    if (!this._commandsManager.getContext(defaultContext)) {
      this._commandsManager.createContext(defaultContext);
    }

    Object.keys(commandDefinitions).forEach(commandName => {
      const commandDefinition = commandDefinitions[commandName];
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
