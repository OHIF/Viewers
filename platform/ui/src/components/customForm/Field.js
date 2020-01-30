import React from 'react';
import PropTypes from 'prop-types';

const emptyFunc = () => {};

function Field({
  name = '',
  value = '',
  onChange = emptyFunc,
  onBlur = emptyFunc,
  onKeyDown = emptyFunc,
}) {
  return (
    <input
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
    />
  );
}

Field.propTypes = {
  name: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  onKeyDown: PropTypes.func,
};

export { Field };
