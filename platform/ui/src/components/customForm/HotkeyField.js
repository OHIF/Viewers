import React from 'react';
import PropTypes from 'prop-types';

import { hotkeys } from '@ohif/core';

/**
 * Take the pressed key array and return the readable string for the keys
 *
 * @param {Array} [keys=[]]
 * @returns {string} string representation of an array of keys
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
 */
function HotkeyField({ keys, handleChange, classNames, modifier_keys }) {
  const inputValue = formatKeysForInput(keys);

  const onInputKeyDown = event => {
    event.stopPropagation();
    event.preventDefault();

    hotkeys.record(sequence => {
      const keys = getKeys({ sequence, modifier_keys });
      hotkeys.unpause();
      handleChange(keys);
    });
  };

  const onFocus = () => {
    hotkeys.pause();
    hotkeys.startRecording();
  };

  return (
    <input
      readOnly={true}
      type="text"
      value={inputValue}
      className={classNames}
      onKeyDown={onInputKeyDown}
      onFocus={onFocus}
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
