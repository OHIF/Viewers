import React from 'react';
import PropTypes from 'prop-types';

import { MODIFIER_KEYS } from './hotkeysConfig.js';
import { utils } from '@ohif/core';

const { hotkeyRecord } = utils;

/**
 * Take the pressed key array and return the readable string for the keys
 *
 * @param {Array} [pressedKeys=[]]
 */
const formatPressedKeys = (pressedKeys = []) => pressedKeys.join('+');

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

/**
 * HotkeyField
 * Renders a hotkey input
 *
 * @param {object} props component props
 * @param {Array[]} props.value array of keys to be controlled by this field
 * @param {function} props.handleChange Callback function to communicate parent once value is changed
 */
function HotkeyField({ value, handleChange }) {
  const formatedInput = formatPressedKeys(value);

  const onInputKeyDown = event => {
    // Prevent ESC key from propagating and closing the modal
    if (event.key === 'Escape') {
      event.stopPropagation();
    }

    hotkeyRecord(sequence => {
      const keys = getKeys(sequence);

      // TODO: Validate allowedKeys
      handleChange(keys);
    });
  };

  return (
    <input
      readOnly={true}
      type="text"
      value={formatedInput}
      className="form-control hotkey text-center"
      onKeyDown={onInputKeyDown}
    />
  );
}

HotkeyField.propTypes = {
  value: PropTypes.array.isRequired,
  handleChange: PropTypes.func.isRequired,
};

export default HotkeyField;
