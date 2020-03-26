import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import ReactSelect from 'react-select';

import './Select.css';

const Select = ({
  className,
  isDisabled,
  isMulti,
  onChange,
  options,
  placeholder,
  value,
}) => {
  return (
    <ReactSelect
      className={classnames(
        className,
        'flex flex-col flex-1 mt-2 customSelect__wrapper'
      )}
      classNamePrefix="customSelect"
      isDisabled={isDisabled}
      isMulti={isMulti}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      value={value}
    ></ReactSelect>
  );
};

Select.propTypes = {
  className: PropTypes.string,
  isDisabled: PropTypes.bool,
  isMulti: PropTypes.bool,
  onChange: PropTypes.func,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string,
      label: PropTypes.string,
    })
  ),
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.string,
        label: PropTypes.string,
      })
    ),
    PropTypes.shape({
      value: PropTypes.string,
      label: PropTypes.string,
    }),
  ]),
};

export default Select;
