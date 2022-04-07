import hotkeys from './../utils/hotkeys';
import log from './../log.js';

/**
 *
 *
 * @typedef {Object} HotkeyDefinition
 * @property {String} commandName - Command to call
 * @property {String} label - Display name for hotkey
 * @property {String[]} keys - Keys to bind; Follows Mousetrap.js binding syntax
 */

export class HotkeysManager {
  constructor(commandsManager, servicesManager) {
    this.hotkeyDefinitions = {};
    this.hotkeyDefaults = [];
    this.isEnabled = true;

    if (!commandsManager) {
      log.warn(
        'HotkeysManager instantiated without a commandsManager. Hotkeys will be unable to find and run commands.'
      );
    }

    this._servicesManager = servicesManager;
    this._commandsManager = commandsManager;
  }

  /**
   * Exposes Mousetrap.js's `.record` method, added by the record plugin.
   *
   * @param {*} event
   */
  record(event) {
    return hotkeys.record(event);
  }

  /**
   * Disables all hotkeys. Hotkeys added while disabled will not listen for
   * input.
   */
  disable() {
    this.isEnabled = false;
    hotkeys.pause();
  }

  /**
   * Enables all hotkeys.
   */
  enable() {
    this.isEnabled = true;
    hotkeys.unpause();
  }

  /**
   * Registers a list of hotkeydefinitions.
   *
   * @param {HotkeyDefinition[] | Object} [hotkeyDefinitions=[]] Contains hotkeys definitions
   */
  setHotkeys(hotkeyDefinitions = []) {
    try {
      const definitions = this._getValidDefinitions(hotkeyDefinitions);

      definitions.forEach(definition => this.registerHotkeys(definition));
    } catch (error) {
      const {
        UINotificationService,
        LoggerService,
      } = this._servicesManager.services;
      const message = 'Erro while setting hotkeys';
      LoggerService.error({ error, message });
      UINotificationService.show({
        title: 'Hotkeys Manager',
        message,
        type: 'error',
      });
    }
  }

  /**
   * Set default hotkey bindings. These
   * values are used in `this.restoreDefaultBindings`.
   *
   * @param {HotkeyDefinition[] | Object} [hotkeyDefinitions=[]] Contains hotkeys definitions
   */
  setDefaultHotKeys(hotkeyDefinitions = []) {
    const definitions = this._getValidDefinitions(hotkeyDefinitions);

    this.hotkeyDefaults = definitions;
  }

  /**
   * Take hotkey definitions that can be an array or object and make sure that it
   * returns an array of hotkeys
   *
   * @param {HotkeyDefinition[] | Object} [hotkeyDefinitions=[]] Contains hotkeys definitions
   */
  _getValidDefinitions(hotkeyDefinitions) {
    const definitions = Array.isArray(hotkeyDefinitions)
      ? [...hotkeyDefinitions]
      : this._parseToArrayLike(hotkeyDefinitions);

    return definitions;
  }

  /**
   * It parses given object containing hotkeyDefinition to array like.
   * Each property of given object will be mapped to an object of an array. And its property name will be the value of a property named as commandName
   *
   * @param {HotkeyDefinition[] | Object} [hotkeyDefinitions={}] Contains hotkeys definitions
   * @returns {HotkeyDefinition[]}
   */
  _parseToArrayLike(hotkeyDefinitionsObj = {}) {
    const copy = { ...hotkeyDefinitionsObj };
    return Object.entries(copy).map(entryValue =>
      this._parseToHotKeyObj(entryValue[0], entryValue[1])
    );
  }

  /**
   * Return HotkeyDefinition object like based on given property name and property value
   * @param {string} propertyName property name of hotkey definition object
   * @param {object} propertyValue property value of hotkey definition object
   *
   * @example
   *
   * const hotKeyObj = {hotKeyDefA: {keys:[],....}}
   *
   * const parsed = _parseToHotKeyObj(Object.keys(hotKeyDefA)[0], hotKeyObj[hotKeyDefA]);
   *  {
   *   commandName: hotKeyDefA,
   *   keys: [],
   *   ....
   *  }
   *
   */
  _parseToHotKeyObj(propertyName, propertyValue) {
    return {
      commandName: propertyName,
      ...propertyValue,
    };
  }

  /**
   * (unbinds and) binds the specified command to one or more key combinations.
   * When a hotkey combination is triggered, the command name and active contexts
   * are used to locate the correct command to call.
   *
   * @param {HotkeyDefinition} commandName
   * @param {String} extension
   * @returns {undefined}
   */
  registerHotkeys({ commandName, keys, label } = {}, extension) {
    if (!commandName) {
      log.warn(`No command was defined for hotkey "${keys}"`);
      return;
    }

    const previouslyRegisteredDefinition = this.hotkeyDefinitions[commandName];

    if (previouslyRegisteredDefinition) {
      const previouslyRegisteredKeys = previouslyRegisteredDefinition.keys;
      this._unbindHotkeys(commandName, previouslyRegisteredKeys);
      log.info(`Unbinding ${commandName} from ${previouslyRegisteredKeys}`);
    }

    // Set definition & bind
    this.hotkeyDefinitions[commandName] = { keys, label };
    this._bindHotkeys(commandName, keys);
    log.info(`Binding ${commandName} to ${keys}`);
  }

  /**
   * Uses most recent
   *
   * @returns {undefined}
   */
  restoreDefaultBindings() {
    this.setHotkeys(this.hotkeyDefaults);
  }

  /**
   *
   */
  destroy() {
    this.hotkeyDefaults = [];
    this.hotkeyDefinitions = {};
    hotkeys.reset();
  }

  /**
   * Binds one or more set of hotkey combinations for a given command
   *
   * @private
   * @param {string} commandName - The name of the command to trigger when hotkeys are used
   * @param {string[]} keys - One or more key combinations that should trigger command
   * @returns {undefined}
   */
  _bindHotkeys(commandName, keys) {
    const isKeyDefined = keys === '' || keys === undefined;
    if (isKeyDefined) {
      return;
    }

    const isKeyArray = keys instanceof Array;
    const combinedKeys = isKeyArray ? keys.join('+') : keys;

    hotkeys.bind(combinedKeys, evt => {
      evt.preventDefault();
      evt.stopPropagation();
      this._commandsManager.runCommand(commandName, { evt });
    });
  }

  /**
   * unbinds one or more set of hotkey combinations for a given command
   *
   * @private
   * @param {string} commandName - The name of the previously bound command
   * @param {string[]} keys - One or more sets of previously bound keys
   * @returns {undefined}
   */
  _unbindHotkeys(commandName, keys) {
    const isKeyDefined = keys !== '' && keys !== undefined;
    if (!isKeyDefined) {
      return;
    }

    const isKeyArray = keys instanceof Array;
    if (isKeyArray) {
      const combinedKeys = keys.join('+');
      this._unbindHotkeys(commandName, combinedKeys);
      return;
    }

    hotkeys.unbind(keys);
  }
}

export default HotkeysManager;

// Commands Contexts:

// --> Name and Priority
// GLOBAL: 0
// VIEWER::CORNERSTONE: 1
// VIEWER::VTK: 1
