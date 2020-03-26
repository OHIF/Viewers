import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import ReactSelect, { components } from 'react-select';

import './Select.css';

const MultiValueContainer = ({ data }) => {
  return <span>{`${data.label}, `}</span>;
};

const MultiValue = props => {
  return (
    <components.MultiValue {...props}>
      <span>{props.data.label}</span>
    </components.MultiValue>
  );
};

const Option = props => {
  return (
    <div>
      <components.Option {...props}>
        <input
          type="checkbox"
          checked={props.isSelected}
          className="w-6 h-6"
          onChange={e => null}
        />{' '}
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
  const _components = isMulti
    ? { MultiValueContainer, Option, MultiValue }
    : {};

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
