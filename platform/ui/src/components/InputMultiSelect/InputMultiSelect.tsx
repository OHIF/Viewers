import React from 'react';
import PropTypes from 'prop-types';

import Select from '../Select';
import InputLabelWrapper from '../InputLabelWrapper';

const InputMultiSelect = ({
  id,
  label,
  isSortable,
  sortDirection,
  onLabelClick,
  value = [],
  placeholder = '',
  options = [],
  onChange,
}) => {
  return (
    <InputLabelWrapper
      label={label}
      isSortable={isSortable}
      sortDirection={sortDirection}
      onLabelClick={onLabelClick}
    >
      <Select
        id={id}
        placeholder={placeholder}
        className="mt-2"
        options={options}
        value={value}
        isMulti={true}
        isClearable={false}
        isSearchable={true}
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        onChange={(selectedOptions, action) => {
          switch (action) {
            case 'select-option':
            case 'remove-value':
            case 'deselect-option':
            case 'clear':
              onChange(selectedOptions);
              break;
            default:
              break;
          }
        }}
      />
    </InputLabelWrapper>
  );
};

InputMultiSelect.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string.isRequired,
  isSortable: PropTypes.bool.isRequired,
  sortDirection: PropTypes.oneOf(['ascending', 'descending', 'none']).isRequired,
  onLabelClick: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  /** Array of options to list as options */
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string,
      label: PropTypes.string,
    })
  ),
  /** Array of string values that exist in our list of options */
  value: PropTypes.arrayOf(PropTypes.string),
};

export default InputMultiSelect;
