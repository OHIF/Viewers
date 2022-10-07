import './Range.css';

import React, { useState } from 'react';
import PropTypes from 'prop-types';

function Range(props) {
  const [value, setValue] = useState(props.value);
  const handleChange = event => {
    setValue(event.target.value);
    if (props.onChange) props.onChange(event);
  };


  return (
    <>
      <input
        ref={props.ref}
        type="range"
        value={props.value}
        min={props.min}
        max={props.max}
        step={props.step || 1}
        onChange={handleChange}
        id={props.id}
        className="range"
      />
      {props.showPercentage && <span>{`${value}%`}</span>}
      {props.showValue && (
        <span>
          {props.valueRenderer
            ? props.valueRenderer(props.value)
            : props.value}
        </span>
      )}
    </>
  );
}

Range.propTypes = {
  value: PropTypes.number,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  step: PropTypes.number,
  id: PropTypes.string,
  valueRenderer: PropTypes.func,
  onChange: PropTypes.func,
  showPercentage: PropTypes.bool,
  showValue: PropTypes.bool,
  ref: PropTypes.any,
};

Range.defaultProps = {
  showPercentage: false,
  showValue: false,
};

export default Range;
