import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import './HotKeysPreferences.styl';

import {
  allowedKeys,
  disallowedCombinations,
  specialKeys,
} from './hotKeysConfig.js';

import isEqual from 'lodash.isequal';

const getKeysPressedArray = keyDownEvent => {
  const keysPressedArray = [];
  const { ctrlKey, altKey, shiftKey } = keyDownEvent;

  if (ctrlKey && !altKey) {
    keysPressedArray.push('ctrl');
  }

  if (shiftKey && !altKey) {
    keysPressedArray.push('shift');
  }

  if (altKey && !ctrlKey) {
    keysPressedArray.push('alt');
  }

  return keysPressedArray;
};

const findConflictingCommand = (
  originalHotKeys,
  currentCommandName,
  currentHotKeys
) => {
  let firstConflictingCommand = undefined;

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

/**
 * Splits given keysObj into arrays. Each array item will be a representation of column
 * @param {obj} keysObj objects to be splitted into columns
 * @param {number} columnSize How many rows per column
 */
const getHotKeysArrayColumns = (keysObj = {}, columnSize) => {
  if (isNaN(columnSize)) {
    return keysObj;
  }

  const keys = Object.keys(keysObj);
  const keysValues = Object.values(keysObj);
  const keysLength = keys.length;

  // Columns from left should be bigger;
  let currentColumn = 0;
  const dividedKeys = [];

  for (
    let it = 0;
    it < keysLength;
    it++, it % columnSize === 0 ? currentColumn++ : currentColumn
  ) {
    if (!dividedKeys[currentColumn]) {
      dividedKeys[currentColumn] = [];
    }

    dividedKeys[currentColumn][keys[it]] = keysValues[it];
  }

  return dividedKeys;
};

const NO_FIELD_ERROR_MESSAGE = undefined;
const formatPressedKeys = pressedKeysArray => pressedKeysArray.join('+');
const unFormatPressedKeys = pressedKeysStr => pressedKeysStr.split('+');
const inputValidators = (
  commandName,
  inputValue,
  pressedKeys,
  lastPressedKey,
  originalHotKeys
) => {
  const modifierValidator = ({ lastPressedKey }) => {
    // Check if it has a valid modifier
    const isModifier = ['ctrl', 'alt', 'shift'].includes(lastPressedKey);
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
    hasError: false,
    errorMessage: NO_FIELD_ERROR_MESSAGE,
  };
};
/**
 * HotKeysPreferencesRow
 * Renders a row hotkey
 * It stores current state and whenever it changes, component messages parent of new value (through function callback)
 * @param {object} props component props
 */
function HotKeyPreferencesRow({
  commandName,
  hotkeys,
  label,
  originalHotKeys,
  onSuccessChanged,
  onFailureChanged,
}) {
  const [inputValue, setInputValue] = useState(hotkeys);
  const [fieldErrorMessage, setFieldErrorMessage] = useState(
    NO_FIELD_ERROR_MESSAGE
  );

  const updateInputText = (keyDownEvent, displayPressedKey = false) => {
    const pressedKeys = getKeysPressedArray(keyDownEvent);

    if (displayPressedKey) {
      const specialKeyName = specialKeys[keyDownEvent.which];
      const keyName =
        specialKeyName ||
        keyDownEvent.key ||
        String.fromCharCode(keyDownEvent.keyCode);

      pressedKeys.push(keyName);
    }

    setInputValue(formatPressedKeys(pressedKeys));
  };

  // validate input value
  const validateInput = event => {
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

    if (hasError) {
      setInputValue('');
    } else {
      onSuccessChanged(inputValue);
    }
    setFieldErrorMessage(errorMessage);
  };

  const onInputKeyDown = event => {
    // Prevent ESC key from propagating and closing the modal
    if (event.key === 'Escape') {
      event.stopPropagation();
    }

    updateInputText(event, allowedKeys.includes(event.keyCode));
    event.preventDefault();
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
            vali="true"
            className="form-control hotkey text-center"
            onKeyDown={onInputKeyDown}
            onKeyUp={validateInput}
          />
          <span className="wrapperText" />
          <span className="errorMessage">{fieldErrorMessage}</span>
        </label>
      </td>
    </tr>
  );
}

/**
 * HotKeysPreferences tab
 * It renders all hotkeys displayed into columns/rows
 *
 * It stores current state and whenever it changes, component messages parent of new value (through function callback)
 * @param {object} props component props
 * @param {string} props.name Tab`s name
 * @param {object} props.hotkeyDefinitions Data for initial state
 * @param {function} props.onTabStateChanged Callback function to communicate parent in case its states changes
 */
function HotKeysPreferences({ hotkeyDefinitions, name, onTabStateChanged }) {
  const [tabState, setTabState] = useState(hotkeyDefinitions);

  const [numColumns] = useState(2);
  const [columnSize] = useState(() =>
    Math.ceil(Object.keys(tabState || {}).length / numColumns)
  );

  const splittedHotKeys = getHotKeysArrayColumns(tabState, columnSize);

  const onHotKeyChanged = (commandName, hotkeyDefinition, keys) => {
    setTabState({ ...tabState, [commandName]: { ...hotkeyDefinition, keys } });
  };

  // tell parent to update its state
  useEffect(() => {
    onTabStateChanged(name, { hotkeyDefinitions: tabState });
  }, [tabState]);

  return (
    <div className="HotKeysPreferences">
      {splittedHotKeys.length > 0
        ? splittedHotKeys.map((columnHotKeys, index) => {
            return (
              <div className="column" key={index}>
                <table className="full-width">
                  <thead>
                    <tr>
                      <th className="text-right p-r-1">Function</th>
                      <th className="text-center">Shortcut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(columnHotKeys).map(
                      hotkeyDefinitionTuple => (
                        <HotKeyPreferencesRow
                          key={hotkeyDefinitionTuple[0]}
                          commandName={hotkeyDefinitionTuple[0]}
                          hotkeys={hotkeyDefinitionTuple[1].keys}
                          label={hotkeyDefinitionTuple[1].label}
                          originalHotKeys={tabState}
                          onSuccessChanged={keys =>
                            onHotKeyChanged(
                              hotkeyDefinitionTuple[0],
                              hotkeyDefinitionTuple[1],
                              keys
                            )
                          }
                        ></HotKeyPreferencesRow>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            );
          })
        : null}
    </div>
  );
}

HotKeysPreferences.propTypes = {
  hotkeyDefinitions: PropTypes.any,
  name: PropTypes.string,
  onTabStateChanged: PropTypes.func,
};

export { HotKeysPreferences };
