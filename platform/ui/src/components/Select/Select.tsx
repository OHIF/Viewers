import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import ReactSelect, { components } from 'react-select';
import { Icon } from '@ohif/ui';

import './Select.css';

const MultiValue = props => {
  const values = props.selectProps.value;
  const lastValue = values[values.length - 1];
  let label = props.data.label;
  if (lastValue.label !== label) {
    label += ', ';
  }

  return <span>{label}</span>;
};

const Option = props => {
  return (
    <components.Option {...props}>
      <div className="flex items-center">
        <div className="w-2 h-2">
          {props.isSelected ? (
            <Icon name={'checkbox-active'} />
          ) : (
            <Icon name={'checkbox-default'} />
          )}
        </div>
        <label id={props.data.value} className="ml-3 mt-1">
          <span>{props.value}</span>
        </label>
      </div>
    </components.Option>
  );
};

const Select = ({
  id,
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
  noIcons,
  menuPlacement,
  value,
}) => {
  const _noIconComponents = {
    DropdownIndicator: () => null,
    IndicatorSeparator: () => null,
  };
  let _components = isMulti ? { Option, MultiValue } : {};
  _components = noIcons
    ? { ..._components, ..._noIconComponents }
    : _components;
  const selectedOptions = [];

  // Map array of values to an array of selected options
  if (value && Array.isArray(value)) {
    value.forEach(val => {
      const found = options.find(opt => opt.value === val);
      if (found) {
        selectedOptions.push(JSON.parse(JSON.stringify(found)));
      }
    });
  }

  return (
    <ReactSelect
      inputId={`input-${id}`}
      className={classnames(
        className,
        'flex flex-col flex-1 customSelect__wrapper'
      )}
      classNamePrefix="customSelect"
      isDisabled={isDisabled}
      isClearable={isClearable}
      isMulti={isMulti}
      isSearchable={isSearchable}
      menuPlacement={menuPlacement}
      closeMenuOnSelect={closeMenuOnSelect}
      hideSelectedOptions={hideSelectedOptions}
      components={_components}
      placeholder={placeholder}
      options={options}
      value={value && Array.isArray(value) ? selectedOptions : value}
      onChange={(selectedOptions, { action }) => {
        const newSelection = !selectedOptions.length
          ? selectedOptions
          : selectedOptions.reduce((acc, curr) => acc.concat([curr.value]), []);
        onChange(newSelection, action);
      }}
    />
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
  noIcons: false,
  menuPlacement: 'auto',
  value: [],
};

Select.propTypes = {
  className: PropTypes.string,
  closeMenuOnSelect: PropTypes.bool,
  hideSelectedOptions: PropTypes.bool,
  isClearable: PropTypes.bool,
  isDisabled: PropTypes.bool,
  isMulti: PropTypes.bool,
  isSearchable: PropTypes.bool,
  noIcons: PropTypes.bool,
  menuPlacement: PropTypes.oneOf(['auto', 'bottom', 'top']),
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string,
      label: PropTypes.string,
    })
  ),
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.any,
  ]),
};

export default Select;
