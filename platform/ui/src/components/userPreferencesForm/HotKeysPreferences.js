/* eslint-disable react-hooks/exhaustive-deps */
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
const unFormatPressedKeys = (pressedKeysStr = '') => pressedKeysStr.split('+');
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

  const updateInputText = (keyDownEvent, displayPressedKey = false) => {
    const pressedKeys = getKeysPressedArray(keyDownEvent);

    if (displayPressedKey) {
      const specialKeyName = specialKeys[keyDownEvent.which];
      const keyName =
        specialKeyName ||
        keyDownEvent.key ||
        String.fromCharCode(keyDownEvent.keyCode);

      // ensure lowerCase
      pressedKeys.push(keyName.toLowerCase());
    }

    setInputValue(formatPressedKeys(pressedKeys));
  };

  // validate input value
  const validateInput = () => {
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
      onSuccessChanged([inputValue]);
    }

    if (hasError !== error) {
      setError(hasError);
    }

    setFieldErrorMessage(errorMessage);
  };

  useEffect(() => {
    onFailureChanged(error);
  }, [error]);

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
};

/**
 * HotKeysPreferences tab
 * It renders all hotkeys displayed into columns/rows
 *
 * It stores current state and whenever it changes, component messages parent of new value (through function callback)
 * @param {object} props component props
 * @param {string} props.name Tab`s name
 * @param {object} props.hotkeyDefinitions Data for initial state
 * @param {function} props.onTabStateChanged Callback function to communicate parent in case its states changes
 * @param {function} props.onTabErrorChanged Callback Function in case any error on tab
 */
function HotKeysPreferences({
  hotkeyDefinitions,
  name,
  tabError,
  onTabStateChanged,
  onTabErrorChanged,
}) {
  const [tabState, setTabState] = useState(hotkeyDefinitions);
  const [tabErrorCounter, setTabErrorCounter] = useState(0);

  const [numColumns] = useState(2);
  const [columnSize] = useState(() =>
    Math.ceil(Object.keys(tabState || {}).length / numColumns)
  );

  const splittedHotKeys = getHotKeysArrayColumns(tabState, columnSize);

  const onHotKeyChanged = (commandName, hotkeyDefinition, keys) => {
    const newState = {
      ...tabState,
      [commandName]: { ...hotkeyDefinition, keys },
    };
    setTabState(newState);
    onTabStateChanged(name, { hotkeyDefinitions: newState });
  };

  const onErrorChanged = (toInc = true) => {
    const increment = toInc ? 1 : -1;
    const newValue = tabErrorCounter + increment;
    if (newValue >= 0) {
      setTabErrorCounter(newValue);
    }
  };

  // reset error count if tab has no errors
  useEffect(() => {
    if (!tabError) {
      setTabErrorCounter(0);
      // update tab state
      setTabState({ ...hotkeyDefinitions });
    }
  }, [tabError]);

  // tell parent to update its state
  useEffect(() => {
    if (tabErrorCounter === 0) {
      onTabErrorChanged(name, false);
    }

    if (tabErrorCounter === 1) {
      onTabErrorChanged(name, true);
    }
  }, [tabErrorCounter]);

  // update local state if parent updates
  useEffect(() => {
    setTabState({ ...hotkeyDefinitions });
  }, [hotkeyDefinitions]);

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
                          tabError={tabError}
                          onSuccessChanged={keys =>
                            onHotKeyChanged(
                              hotkeyDefinitionTuple[0],
                              hotkeyDefinitionTuple[1],
                              keys
                            )
                          }
                          onFailureChanged={onErrorChanged}
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
  tabError: PropTypes.bool,
  onTabStateChanged: PropTypes.func,
  onTabErrorChanged: PropTypes.func,
};

export { HotKeysPreferences };
