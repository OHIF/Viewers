import React from 'react';
import PropTypes from 'prop-types';

const InputCheckbox = ({ value, onChange, label }) => {
  return (
    <div className="flex flex-col">
      <label className="text-primary-light pl-1 text-sm">{label}</label>
      <div className="flex h-[30px] items-center pl-1">
        <input
          type="checkbox"
          className="text-primary focus:ring-primary h-4 w-4 cursor-pointer rounded border-gray-300 bg-black"
          checked={value || false}
          onChange={e => onChange(e.target.checked)}
        />
      </div>
    </div>
  );
};

InputCheckbox.propTypes = {
  value: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
};

export default InputCheckbox;
