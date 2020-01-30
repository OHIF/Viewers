import React, { useState } from 'react';
import PropTypes from 'prop-types';

import {
  allowedKeys,
  disallowedCombinations,
  MODIFIER_KEYS,
} from './hotkeysConfig.js';

const formatPressedKeys = pressedKeysArray => pressedKeysArray.join('+');

/**
 * HotKeysPreferencesRow
 * Renders row for hotkey preference
 * It stores current state and whenever it changes, component messages parent of new value (through function callback)
 * @param {object} props component props
 * @param {string} props.commandName command name associated to given row
 * @param {string[]} props.hotkeys keys associated to given command
 * @param {object} props.originalHotKeys original hotkeys values
 * @param {function} props.onHotkeyChanged Callback function to communicate parent in case its states changes
 * @param {function} props.onFailureChanged Callback Function in case any error on row
 */
function HotKeyPreferencesRow({
  commandName,
  hotkeys,
  label,
  errorMessage,
  onHotkeyChanged,
  hotkeyRecord,
}) {
  const [inputValue, setInputValue] = useState(formatPressedKeys(hotkeys));

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
            errorMessage !== undefined ? 'state-error' : ''
          } `}
          data-key="defaultTool"
        >
          <input
            readOnly={true}
            type="text"
            value={inputValue}
            className="form-control hotkey text-center"
            onKeyDown={onInputKeyDown}
            onBlur={() => onHotkeyChanged([inputValue])}
          />
          <span className="wrapperText" />
          <span className="errorMessage">{errorMessage}</span>
        </label>
      </td>
    </tr>
  );
}

HotKeyPreferencesRow.propTypes = {
  commandName: PropTypes.string.isRequired,
  hotkeys: PropTypes.array.isRequired,
  label: PropTypes.string.isRequired,
  errorMessage: PropTypes.string,
  onHotkeyChanged: PropTypes.func.isRequired,
  hotkeyRecord: PropTypes.func.isRequired,
};

export default HotKeyPreferencesRow;
