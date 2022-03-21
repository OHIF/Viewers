import MODULE_TYPES from './MODULE_TYPES.js';
import log from './../log.js';

export default class ExtensionManager {
  constructor({ commandsManager, servicesManager, api, appConfig = {} }) {
    this.modules = {};
    this.registeredExtensionIds = [];
    this.registeredExtensionVesions = {};
    this.moduleTypeNames = Object.values(MODULE_TYPES);
    //
    this._commandsManager = commandsManager;
    this._servicesManager = servicesManager;
    this._appConfig = appConfig;
    this._api = api;

    this.moduleTypeNames.forEach(moduleType => {
      this.modules[moduleType] = [];
    });
  }

  /**
   * An array of extensions, or an array of arrays that contains extension
   * configuration pairs.
   *
   * @param {Object[]} extensions - Array of extensions
   */
  registerExtensions(extensions) {
    extensions.forEach(extension => {
      const hasConfiguration = Array.isArray(extension);

      if (hasConfiguration) {
        const [ohifExtension, configuration] = extension;
        this.registerExtension(ohifExtension, configuration);
      } else {
        this.registerExtension(extension);
      }
    });
  }

  /**
   *
   * TODO: Id Management: SopClassHandlers currently refer to viewport module by id; setting the extension id as viewport module id is a workaround for now
   * @param {Object} extension
   * @param {Object} configuration
   */
  registerExtension(extension, configuration = {}) {
    if (!extension) {
      log.warn(
        'Attempting to register a null/undefined extension. Exiting early.'
      );
      return;
    }

    let extensionId = extension.id;
    const version = extension.version;

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
        this._initSpecialModuleTypes(moduleType, extensionModule);

        this.modules[moduleType].push({
          extensionId,
          module: extensionModule,
        });
      }
    });

    // Track extension registration
    this.registeredExtensionIds.push(extensionId);

    this.registeredExtensionVesions[extensionId] = version;
  }

  /**
   * @private
   * @param {string} moduleType
   * @param {Object} extension
   * @param {string} extensionId - Used for logging warnings
   */
  _getExtensionModule(moduleType, extension, extensionId, configuration) {
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
        api: this._api,
        extensionManager: this,
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
    }
  }

  _initSpecialModuleTypes(moduleType, extensionModule) {
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
      default:
      // code block
    }
  }

  /**
   *
   * @private
   * @param {Object[]} commandDefinitions
   */
  _initCommandsModule(commandDefinitions, defaultContext = 'VIEWER') {
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
  }
}

/**
 * @private
 * @param {string} lower
 */
function _capitalizeFirstCharacter(lower) {
  return lower.charAt(0).toUpperCase() + lower.substr(1);
}
