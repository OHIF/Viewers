import React from 'react';
import PropTypes from 'prop-types';

import { utils } from '@ohif/core';

const { hotkeyRecord } = utils;

/**
 * Take the pressed key array and return the readable string for the keys
 *
 * @param {Array} [keys=[]]
 */
const formatKeysForInput = (keys = []) => keys.join('+');

/**
 * formats given keys sequence to insert the modifier keys in the first index of the array
 * @param {string} sequence keys sequence from MouseTrap Record -> "shift+left"
 * @returns {Array} keys in array-format -> ['shift','left']
 */
const getKeys = ({ sequence, modifier_keys }) => {
  const keysArray = sequence.join(' ').split('+');
  let keys = [];
  let modifiers = [];
  keysArray.forEach(key => {
    if (modifier_keys && modifier_keys.includes(key)) {
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
 * @param {Array[]} props.keys array of keys to be controlled by this field
 * @param {function} props.handleChange Callback function to communicate parent once value is changed
 * @param {string} props.classNames string caontaining classes to be added in the input field
 * @param {Array[]} props.modifier_keys
 * @param {Array[]} props.allowed_keys
 */
function HotkeyField({
  keys,
  handleChange,
  classNames,
  modifier_keys,
  allowed_keys,
}) {
  const inputValue = formatKeysForInput(keys);

  const onInputKeyDown = event => {
    // Prevent ESC key from propagating and closing the modal
    if (event.key === 'Escape') {
      event.stopPropagation();
    }

    hotkeyRecord(sequence => {
      const keys = getKeys({ sequence, modifier_keys });

      // TODO: Validate allowedKeys
      handleChange(keys);
    });
  };

  return (
    <input
      readOnly={true}
      type="text"
      value={inputValue}
      className={classNames}
      onKeyDown={onInputKeyDown}
    />
  );
}

HotkeyField.propTypes = {
  keys: PropTypes.array.isRequired,
  handleChange: PropTypes.func.isRequired,
  classNames: PropTypes.string,
  modifier_keys: PropTypes.array,
  allowed_keys: PropTypes.array,
};

export { HotkeyField };
