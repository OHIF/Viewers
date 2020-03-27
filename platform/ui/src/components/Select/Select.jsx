import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import ReactSelect, { components } from 'react-select';

import './Select.css';

const MultiValue = props => {
  const values = props.selectProps.value;
  const lastValue = values[values.length - 1];
  let label = props.data.label;
  if (lastValue.label != label) {
    label += ', ';
  }

  return <span>{label}</span>;
};

const Option = props => {
  return (
    <div>
      <components.Option {...props}>
        <input
          type="checkbox"
          checked={props.isSelected}
          className="w-6 h-6 mr-2"
          onChange={e => null}
        />
        <label>{props.value} </label>
      </components.Option>
    </div>
  );
};

const Select = ({
  className,
  closeMenuOnSelect,
  hideSelectedOptions,
  isClearable,
  isDisabled,
  isMulti,
  isSearchable,
  onChange,
  options,
  placeholder,
  value,
}) => {
  const _components = isMulti ? { Option, MultiValue } : {};

  return (
    <ReactSelect
      className={classnames(
        className,
        'flex flex-col flex-1 customSelect__wrapper'
      )}
      classNamePrefix="customSelect"
      isDisabled={isDisabled}
      isClearable={isClearable}
      isMulti={isMulti}
      isSearchable={isSearchable}
      closeMenuOnSelect={closeMenuOnSelect}
      hideSelectedOptions={hideSelectedOptions}
      components={_components}
      placeholder={placeholder}
      options={options}
      value={value}
      onChange={onChange}
    ></ReactSelect>
  );
};

Select.defaultProps = {
  className: '',
  closeMenuOnSelect: true,
  hideSelectedOptions: true,
  isClearable: true,
  isDisabled: false,
  isMulti: false,
  isSearchable: true,
};

Select.propTypes = {
  className: PropTypes.string,
  closeMenuOnSelect: PropTypes.bool,
  hideSelectedOptions: PropTypes.bool,
  isClearable: PropTypes.bool,
  isDisabled: PropTypes.bool,
  isMulti: PropTypes.bool,
  isSearchable: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
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
