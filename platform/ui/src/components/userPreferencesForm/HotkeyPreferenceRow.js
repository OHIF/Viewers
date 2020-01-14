import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import { allowedKeys, disallowedCombinations } from './hotKeysConfig.js';
import isEqual from 'lodash.isequal';

const findConflictingCommand = (
  originalHotKeys,
  currentCommandName,
  hotkeys
) => {
  let firstConflictingCommand = undefined;
  const currentHotKeys = [formatPressedKeys(hotkeys)];

  for (const commandName in originalHotKeys) {
    const toolHotKeys = originalHotKeys[commandName].keys;

    if (
      isEqual(toolHotKeys, currentHotKeys) &&
      commandName !== currentCommandName
    ) {
      firstConflictingCommand = originalHotKeys[commandName];
      break;
    }
  }

  return firstConflictingCommand;
};

const NO_FIELD_ERROR_MESSAGE = undefined;
const MODIFIER_KEYS = ['ctrl', 'alt', 'shift'];

const unFormatPressedKeys = (pressedKeysStr = '') => pressedKeysStr.split('+');
const formatPressedKeys = pressedKeysArray => pressedKeysArray.join('+');
const inputValidators = (
  commandName,
  inputValue,
  pressedKeys,
  lastPressedKey,
  originalHotKeys
) => {
  let hasError = false;
  let errorMessage = NO_FIELD_ERROR_MESSAGE;

  const modifierValidator = ({ lastPressedKey }) => {
    // Check if it has a valid modifier
    const isModifier = MODIFIER_KEYS.includes(lastPressedKey);
    if (isModifier) {
      hasError = true;
      errorMessage =
        "It's not possible to define only modifier keys (ctrl, alt and shift) as a shortcut";
      return {
        hasError,
        errorMessage,
      };
    }
  };

  const emptyValidator = ({ inputValue }) => {
    if (!inputValue) {
      hasError = true;
      errorMessage = "Field can't be empty.";
      return {
        hasError,
        errorMessage,
      };
    }
  };
  const conflictingValidator = ({
    commandName,
    pressedKeys,
    originalHotKeys,
  }) => {
    const conflictingCommand = findConflictingCommand(
      originalHotKeys,
      commandName,
      pressedKeys
    );
    if (conflictingCommand) {
      hasError = true;
      errorMessage = `"${conflictingCommand.label}" is already using the "${pressedKeys}" shortcut.`;
      return {
        hasError,
        errorMessage,
      };
    }
  };

  const disallowedValidator = ({ inputValue, pressedKeys, lastPressedKey }) => {
    const modifierCommand = formatPressedKeys(
      pressedKeys.slice(0, pressedKeys.length - 1)
    );

    const disallowedCombination = disallowedCombinations[modifierCommand];
    const hasDisallowedCombinations = disallowedCombination
      ? disallowedCombination.includes(lastPressedKey)
      : false;

    if (hasDisallowedCombinations) {
      hasError = true;
      errorMessage = `"${inputValue}" shortcut combination is not allowed`;
      return {
        hasError,
        errorMessage,
      };
    }
  };

  const validators = [
    emptyValidator,
    modifierValidator,
    conflictingValidator,
    disallowedValidator,
  ];

  for (const validator of validators) {
    const validation = validator({
      commandName,
      inputValue,
      pressedKeys,
      lastPressedKey,
      originalHotKeys,
    });
    if (validation && validation.hasError) {
      return validation;
    }
  }

  // validation has passed successfully
  return {
    hasError,
    errorMessage,
  };
};

/**
 * HotKeysPreferencesRow
 * Renders row for hotkey preference
 * It stores current state and whenever it changes, component messages parent of new value (through function callback)
 * @param {object} props component props
 * @param {string} props.commandName command name associated to given row
 * @param {string[]} props.hotkeys keys associated to given command
 * @param {object} props.originalHotKeys original hotkeys values
 * @param {function} props.onSuccessChanged Callback function to communicate parent in case its states changes
 * @param {function} props.onFailureChanged Callback Function in case any error on row
 */
function HotKeyPreferencesRow({
  commandName,
  hotkeys,
  label,
  originalHotKeys,
  tabError,
  onSuccessChanged,
  onFailureChanged,
  hotkeyRecord,
}) {
  const [inputValue, setInputValue] = useState(formatPressedKeys(hotkeys));
  const [error, setError] = useState(false);

  const [fieldErrorMessage, setFieldErrorMessage] = useState(
    NO_FIELD_ERROR_MESSAGE
  );

  // reset error count if tab has no errors
  useEffect(() => {
    if (!tabError) {
      setError(false);
      setFieldErrorMessage(NO_FIELD_ERROR_MESSAGE);
      setInputValue(formatPressedKeys(hotkeys));
    }
  }, [tabError]);

  // update state values if props changes
  useEffect(() => {
    setInputValue(formatPressedKeys(hotkeys));
  }, [hotkeys]);

  // validate input value
  const validateInput = () => {
    if (error) {
      onSuccessChanged([inputValue]);
    }
  };

  useEffect(() => {
    onFailureChanged(error);
  }, [error]);

  useEffect(() => {
    const pressedKeys = unFormatPressedKeys(inputValue);
    const lastPressedKey = pressedKeys[pressedKeys.length - 1];

    const {
      hasError = false,
      errorMessage = NO_FIELD_ERROR_MESSAGE,
    } = inputValidators(
      commandName,
      inputValue,
      pressedKeys,
      lastPressedKey,
      originalHotKeys
    );

    if (hasError !== error) {
      setError(hasError);
    }

    setFieldErrorMessage(errorMessage);
  }, [inputValue]);

  /**
   * formats given keys sequence to insert the modifier keys in the first index of the array
   * @param {string} sequence keys sequence from MouseTrap Record -> "shift+left"
   * @returns {Array} keys in array-format -> ['shift','left']
   */
  const getKeys = sequence => {
    const keysArray = sequence.join(' ').split('+');
    let keys = [];
    let modifiers = [];
    keysArray.forEach(key => {
      if (MODIFIER_KEYS.includes(key)) {
        modifiers.push(key);
      } else {
        keys.push(key);
      }
    });
    return [...modifiers, ...keys];
  };

  const onInputKeyDown = event => {
    // Prevent ESC key from propagating and closing the modal
    if (event.key === 'Escape') {
      event.stopPropagation();
    }

    hotkeyRecord(sequence => {
      const keys = getKeys(sequence);

      // TODO: Validate allowedKeys
      setInputValue(formatPressedKeys(keys));
    });
  };

  return (
    <tr key={commandName}>
      <td className="text-right p-r-1">{label}</td>
      <td width="200">
        <label
          className={`wrapperLabel ${
            fieldErrorMessage !== undefined ? 'state-error' : ''
          } `}
          data-key="defaultTool"
        >
          <input
            readOnly={true}
            type="text"
            value={inputValue}
            className="form-control hotkey text-center"
            onKeyDown={onInputKeyDown}
            onBlur={validateInput}
          />
          <span className="wrapperText" />
          <span className="errorMessage">{fieldErrorMessage}</span>
        </label>
      </td>
    </tr>
  );
}

HotKeyPreferencesRow.propTypes = {
  commandName: PropTypes.string.isRequired,
  hotkeys: PropTypes.array.isRequired,
  label: PropTypes.string.isRequired,
  originalHotKeys: PropTypes.object.isRequired,
  tabError: PropTypes.bool.isRequired,
  onSuccessChanged: PropTypes.func.isRequired,
  onFailureChanged: PropTypes.func.isRequired,
  hotkeyRecord: PropTypes.func.isRequired,
};

export default HotKeyPreferencesRow;
