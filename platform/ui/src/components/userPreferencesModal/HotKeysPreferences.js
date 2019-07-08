import './HotKeysPreferences.styl';
import React, { Component } from 'react';
import {
  allowedKeys,
  disallowedCombinations,
  specialKeys,
} from './hotKeysConfig.js';

import PropTypes from 'prop-types';

export class HotKeysPreferences extends Component {
  static propTypes = {
    hotKeysData: PropTypes.objectOf(
      PropTypes.shape({
        keys: PropTypes.arrayOf(PropTypes.string).isRequired,
        label: PropTypes.string.isRequired,
      })
    ).isRequired,
    onChange: PropTypes.func,
  };

  constructor(props) {
    super(props);

    const hotkeyCommands = Object.keys(this.props.hotKeysData);
    const localHotKeys = hotkeyCommands.map(commandName => {
      const definition = this.props.hotKeysData[commandName];

      return {
        commandName,
        keys: definition.keys,
        label: definition.label,
      };
    });

    this.state = {
      hotKeys: localHotKeys,
      errorMessages: {},
    };

    this.onInputKeyDown = this.onInputKeyDown.bind(this);
  }

  /**
   * Normalizes the keys used in a KeyPress event and returns an array of the
   * keys pressed
   *
   * @param {KeyDownEvent} keyDownEvent
   * @returns {string[]}
   */
  getKeysPressedArray(keyDownEvent) {
    const keysPressedArray = [];
    const { ctrlKey, altKey, shiftKey } = keyDownEvent;

    if (ctrlKey && !altKey) {
      keysPressedArray.push('CTRL');
    }

    if (shiftKey && !altKey) {
      keysPressedArray.push('SHIFT');
    }

    if (altKey && !ctrlKey) {
      keysPressedArray.push('ALT');
    }

    return keysPressedArray;
  }

  getConflictingCommand(currentToolKey, hotKeyCommand) {
    return Object.keys(this.state.hotKeys).find(tool => {
      const value = this.state.hotKeys[tool].command;
      return value && value === hotKeyCommand && tool !== currentToolKey;
    });
  }

  /**
   *
   * @param {String} commandName
   * @param {KeyDownEvent} keyDownEvent
   * @param {Boolean} [displayPressedKey=false]
   */
  updateInputText(commandName, keyDownEvent, displayPressedKey = false) {
    const pressedKeys = this.getKeysPressedArray(keyDownEvent);

    if (displayPressedKey) {
      const specialKeyName = specialKeys[keyDownEvent.which];
      const keyName =
        specialKeyName ||
        keyDownEvent.key ||
        String.fromCharCode(keyDownEvent.keyCode);
      pressedKeys.push(keyName.toUpperCase());
    }

    this.updateHotKeysState(commandName, pressedKeys.join('+'));
  }

  updateHotKeysState(commandName, keys) {
    const hotKeys = this.state.hotKeys;
    const hotKeyIndex = this.state.hotKeys.findIndex(
      x => x.commandName === commandName
    );
    hotKeys[hotKeyIndex].keys[0] = keys;
    this.setState({ hotKeys });
  }

  updateErrorsState(toolKey, errorMessage) {
    const errorMessages = this.state.errorMessages;
    errorMessages[toolKey] = errorMessage;
    this.setState({ errorMessages });
  }

  onInputKeyDown(event, commandName) {
    // Prevent ESC key from propagating and closing the modal
    if (event.key === 'Escape') {
      event.stopPropagation();
    }

    if (allowedKeys.includes(event.keyCode)) {
      this.updateInputText(commandName, event, true);
    } else {
      this.updateInputText(commandName, event, false);
    }

    event.preventDefault();
  }

  onChange(event, commandName) {
    if (event.ctrlKey || event.altKey || event.shiftKey) {
      return;
    }

    const hotKeyIndex = this.state.hotKeys.findIndex(
      x => x.commandName === commandName
    );
    const hotKey = this.state.hotKeys[hotKeyIndex];
    const keys = hotKey.keys[0];
    const pressedKeys = keys.split('+');
    const lastPressedKey = pressedKeys[pressedKeys.length - 1].toUpperCase();

    // clear the prior errors
    this.setState({ errorMessages: {} }, () => {
      // Check if it has a valid modifier
      const isModifier = ['CTRL', 'ALT', 'SHIFT'].includes(lastPressedKey);
      if (isModifier) {
        this.updateHotKeysState(commandName, '');
        this.updateErrorsState(
          commandName,
          "It's not possible to define only modifier keys (CTRL, ALT and SHIFT) as a shortcut"
        );
        return;
      }

      /*
       * Check if it has some conflict
       */
      const conflictedCommandKey = this.getConflictingCommand(
        commandName,
        keys
      );
      if (conflictedCommandKey) {
        const conflictedCommand = this.state.hotKeys[conflictedCommandKey];

        this.updateErrorsState(
          commandName,
          `"${conflictedCommand.label}" is already using the "${
            conflictedCommand.command
          }" shortcut.`
        );
        this.updateErrorsState(conflictedCommandKey, '');
        this.updateHotKeysState(commandName, '');
        return;
      }

      /*
       * Check if is a valid combination
       */
      const modifierCommand = pressedKeys
        .slice(0, pressedKeys.length - 1)
        .join('+')
        .toUpperCase();

      const disallowedCombination = disallowedCombinations[modifierCommand];
      const hasDisallowedCombinations = disallowedCombination
        ? disallowedCombination.includes(lastPressedKey)
        : false;

      if (hasDisallowedCombinations) {
        this.updateHotKeysState(commandName, '');
        this.updateErrorsState(
          commandName,
          "It's not possible to define only modifier keys (CTRL, ALT and SHIFT) as a shortcut"
        );
        return;
      }
    });
  }

  renderRow({ commandName, label, keys }) {
    return (
      <tr key={commandName}>
        <td className="text-right p-r-1">{label}</td>
        <td width="200">
          <label
            className={`wrapperLabel ${
              this.state.errorMessages[commandName] !== undefined
                ? 'state-error'
                : ''
            } `}
            ref={input => (this[commandName] = input)}
            data-key="defaultTool"
          >
            <input
              readOnly={true}
              type="text"
              value={keys[0]}
              vali="true"
              className="form-control hotkey text-center"
              onKeyDown={event => this.onInputKeyDown(event, commandName)}
              onKeyUp={event => this.onChange(event, commandName)}
            />
            <span className="wrapperText" />
            <span className="errorMessage">
              {this.state.errorMessages[commandName]}
            </span>
          </label>
        </td>
      </tr>
    );
  }

  render() {
    const halfWayThough = Math.floor(this.state.hotKeys.length / 2);
    const firstHalfHotkeys = this.state.hotKeys.slice(0, halfWayThough);
    const secondHalfHotkeys = this.state.hotKeys.slice(
      halfWayThough,
      this.state.hotKeys.length
    );

    return (
      <div className="HotKeysPreferences">
        {/* <!-- Column 1 --> */}
        <div className="column">
          <table className="full-width">
            <thead>
              <tr>
                <th className="text-right p-r-1">Function</th>
                <th className="text-center">Shortcut</th>
              </tr>
            </thead>
            <tbody>
              {firstHalfHotkeys.map(hotkeyDefinition =>
                this.renderRow(hotkeyDefinition)
              )}
            </tbody>
          </table>
        </div>
        {/* <!-- Column 2 --> */}
        <div className="column">
          <table className="full-width">
            <thead>
              <tr>
                <th className="text-right p-r-1">Function</th>
                <th className="text-center">Shortcut</th>
              </tr>
            </thead>
            <tbody>
              {secondHalfHotkeys.map(hotkeyDefinition =>
                this.renderRow(hotkeyDefinition)
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}
