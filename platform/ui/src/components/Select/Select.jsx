import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import ReactSelect from 'react-select';

import './Select.css';

const Select = ({
  autoFocus,
  className,
  isDisabled,
  isMulti,
  isSearchable,
  name,
  onChange,
  options,
  placeholder,
  noOptionsMessage,
  value,
}) => {
  return (
    <ReactSelect
      autoFocus={autoFocus}
      className={classnames(
        className,
        'flex flex-col flex-1 mt-2 customSelect__wrapper'
      )}
      classNamePrefix="customSelect"
      isDisabled={isDisabled}
      isMulti={isMulti}
      isSearchable={isSearchable}
      name={name}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      noOptionsMessage={noOptionsMessage}
      value={value}
    ></ReactSelect>
  );
};

Select.propTypes = {
  autoFocus: PropTypes.bool,
  className: PropTypes.string,
  isDisabled: PropTypes.bool,
  isMulti: PropTypes.bool,
  isSearchable: PropTypes.bool,
  name: PropTypes.string,
  onChange: PropTypes.func,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string,
      label: PropTypes.string,
    })
  ),
  placeholder: PropTypes.string,
  noOptionsMessage: PropTypes.func,
  value: PropTypes.string,
};

export default Select;
