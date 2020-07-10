import React from 'react';
import PropTypes from 'prop-types';

import { hotkeys } from '@ohif/core';
import { Input } from '@ohif/ui';

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
const getKeys = ({ sequence, modifierKeys }) => {
  const keysArray = sequence.join(' ').split('+');
  let keys = [];
  let modifiers = [];
  keysArray.forEach(key => {
    if (modifierKeys && modifierKeys.includes(key)) {
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
 * @param {function} props.onChange Callback function to communicate parent once value is changed
 * @param {string} props.className string caontaining classes to be added in the input field
 * @param {Array[]} props.modifierKeys
 */
const HotkeyField = ({ keys, onChange, className, modifierKeys }) => {
  const inputValue = formatKeysForInput(keys);

  const onInputKeyDown = event => {
    event.stopPropagation();
    event.preventDefault();

    hotkeys.record(sequence => {
      const keys = getKeys({ sequence, modifierKeys });
      hotkeys.unpause();
      onChange(keys);
    });
  };

  const onFocus = () => {
    hotkeys.pause();
    hotkeys.startRecording();
  };

  return (
    <Input
      readOnly
      value={inputValue}
      onKeyDown={onInputKeyDown}
      onFocus={onFocus}
      className={className}
    />
  );
};

HotkeyField.propTypes = {
  keys: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
  modifierKeys: PropTypes.array,
};

export default HotkeyField;
