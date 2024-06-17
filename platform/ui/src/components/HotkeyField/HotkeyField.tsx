import React from 'react';
import PropTypes from 'prop-types';

import Input from '../Input';
import { getKeys, formatKeysForInput } from './utils';

/**
 * HotkeyField
 * Renders a hotkey input that records keys
 *
 * @param {object} props component props
 * @param {Array[]} props.keys keys to be controlled by this field
 * @param {boolean} props.disabled disables the field
 * @param {function} props.onChange callback with changed values
 * @param {string} props.className input classes
 * @param {Array[]} props.modifierKeys
 */
const HotkeyField = ({ disabled = false, keys, onChange, className, modifierKeys, hotkeys }) => {
  const inputValue = formatKeysForInput(keys);

  const onInputKeyDown = event => {
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
      disabled={disabled}
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
  disabled: PropTypes.bool,
  hotkeys: PropTypes.shape({
    initialize: PropTypes.func.isRequired,
    pause: PropTypes.func.isRequired,
    unpause: PropTypes.func.isRequired,
    startRecording: PropTypes.func.isRequired,
    record: PropTypes.func.isRequired,
  }).isRequired,
};

export default HotkeyField;
