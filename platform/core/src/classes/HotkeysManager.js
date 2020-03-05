import hotkeys from './../utils/hotkeys';
import { defaultHotkeys } from './defaultHotkeys';
import log from './../log.js';

/**
 *
 *
 * @typedef {Object} HotkeyDefinition
 * @property {String} commandName - Command to call
 * @property {String} label - Display name for hotkey
 * @property {String[]} keys - Keys to bind; Follows Mousetrap.js binding syntax
 * @property {Object} commandOptions - Options to be passed to commandManager
 */

const isValidHotkeyDefinition = ({ commandName, label, keys }) => {
  const isCommandNameValid = commandName && typeof commandName === 'string';
  const isKeysValid =
    keys &&
    ((Array.isArray(keys) && keys.length > 0) || typeof keys === 'string');
  const isLabelValid = label && typeof label === 'string';

  return isCommandNameValid && isKeysValid && isLabelValid;
};

export class HotkeysManager {
  constructor(commandsManager, servicesManager) {
    this.hotkeyDefinitions = [];
    this.hotkeyDefaults = defaultHotkeys;
    this.isEnabled = true;

    if (!commandsManager) {
      log.warn(
        'HotkeysManager instantiated without a commandsManager. Hotkeys will be unable to find and run commands.'
      );
    }

    this._servicesManager = servicesManager;
    this._commandsManager = commandsManager;

    this.setDefaultHotkeys();
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
   * Registers the new list of hotkey definitions.
   *
   * @param {HotkeyDefinition[]} [hotkeyDefinitions=[]] Contains hotkeys definitions
   */
  setHotkeys(hotkeyDefinitions = []) {
    try {
      this._unbindAndClearCurrentHotkeys();

      hotkeyDefinitions.forEach(hotkeyDefinition => {
        const { commandName, keys, commandOptions } = hotkeyDefinition;

        if (!isValidHotkeyDefinition(hotkeyDefinition)) {
          return;
        }
        // Push hotkeyDefinition and bind it only if its valid
        this.hotkeyDefinitions.push(hotkeyDefinition);

        this._bindHotkeys(commandName, keys, commandOptions);
      });
    } catch (error) {
      const { UINotificationService } = this._servicesManager.services;
      if (UINotificationService) {
        UINotificationService.show({
          title: 'Hotkeys Manager',
          message: 'Error while setting hotkeys',
          type: 'error',
        });
      } else {
        log.warn('Hotkeys Manager | Error while setting hotkeys');
      }
    }
  }

  /**
   * Set default hotkeys bindings
   */
  setDefaultHotkeys() {
    this.setHotkeys(this.hotkeyDefaults);
  }

  /**
   * Replace hotkeys into default values
   *
   * @param {HotkeyDefinition[]} [hotkeyDefinitions=[]] Contains hotkeys definitions
   */
  replaceDefaultHotkeys(hotkeyDefinitions = []) {
    this.hotkeyDefaults = hotkeyDefinitions;
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
   * Function to be use to filter invalid hotkeys
   *
   * @param {HotkeyDefinition} hotkeys
   * @returns validHotkeys - Return an array of valid hotkeys or undefined
   */
  getValidHotkeys(hotkeys) {
    let validHotkeys = [];
    if (Array.isArray(hotkeys) && hotkeys.length) {
      validHotkeys = hotkeys.filter(isValidHotkeyDefinition);
    }

    return validHotkeys;
  }

  /**
   *  Get the string that MouseTrap will use to bind
   *
   * @param {Array | String} keys
   * @returns
   * @memberof HotkeysManager
   */
  _getHotkeyKey(keys) {
    const isKeyArray = keys instanceof Array;
    return isKeyArray ? keys.join('+') : keys;
  }

  /**
   * Unbind all current hotkeys and clear current hotkeys definitions
   *
   * @memberof HotkeysManager
   */
  _unbindAndClearCurrentHotkeys() {
    this.hotkeyDefinitions.forEach(({ keys }) => {
      this._unbindHotkeys(keys);
    });

    this.hotkeyDefinitions = [];
  }

  /**
   * Binds one or more set of hotkey combinations for a given command
   *
   * @private
   * @param {string} commandName - The name of the command to trigger when hotkeys are used
   * @param {string[]} keys - One or more key combinations that should trigger command
   * @param {object} commandOptions - Any additional command options
   * @returns {undefined}
   */
  _bindHotkeys(commandName, keys, commandOptions) {
    const combinedKeys = this._getHotkeyKey(keys);

    hotkeys.bind(combinedKeys, evt => {
      evt.preventDefault();
      evt.stopPropagation();
      this._commandsManager.runCommand(commandName, { evt, ...commandOptions });
    });
  }

  /**
   * unbinds one or more set of hotkey combinations for a given command
   *
   * @private
   * @param {string[]} keys - One or more sets of previously bound keys
   * @returns {undefined}
   */
  _unbindHotkeys(keys) {
    const combinedKeys = this._getHotkeyKey(keys);

    hotkeys.unbind(combinedKeys);
  }
}

export default HotkeysManager;

// Commands Contexts:

// --> Name and Priority
// GLOBAL: 0
// VIEWER::CORNERSTONE: 1
// VIEWER::VTK: 1
