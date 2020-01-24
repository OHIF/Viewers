import React from 'react';
import PropTypes from 'prop-types';

const emptyFunc = () => {};

function HotkeyField({
  name = '',
  value = '',
  type = 'text',
  className = '',
  onChange = emptyFunc,
  onBlur = emptyFunc,
  onKeyDown = emptyFunc,
}) {
  return (
    <input
      name={name}
      value={value}
      readOnly={true}
      type={type}
      className={className}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
    />
  );
}

HotkeyField.propTypes = {
  name: PropTypes.string,
  value: PropTypes.string,
  type: PropTypes.string,
  className: PropTypes.string,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  onKeyDown: PropTypes.func,
};

export { HotkeyField };
