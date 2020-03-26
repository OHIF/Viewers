import React from 'react';
import PropTypes from 'prop-types';

import { Select, InputLabelWrapper } from '@ohif/ui';

const InputSelect = ({
  label,
  isSortable,
  sortDirection,
  onLabelClick,
  value,
  placeholder,
  options,
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
        placeholder={placeholder}
        className="mt-2"
        options={options}
        value={value}
        isMulti={true}
        isClearable={false}
        isSearchable={false}
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        onChange={(inputvalues, { action }) => {
          switch (action) {
            case 'select-option':
            case 'remove-value':
            case 'deselect-option':
            case 'clear':
              onChange(inputvalues);
              break;
            default:
              break;
          }
        }}
      />
    </InputLabelWrapper>
  );
};

InputSelect.defaultProps = {
  value: [],
  placeholder: '',
  options: [],
};

InputSelect.propTypes = {
  label: PropTypes.string.isRequired,
  isSortable: PropTypes.bool.isRequired,
  sortDirection: PropTypes.oneOf(['ascending', 'descending', 'none'])
    .isRequired,
  onLabelClick: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string,
      label: PropTypes.string,
    })
  ),
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
  onChange: PropTypes.func.isRequired,
};

export default InputSelect;
