import React from 'react';
import PropTypes from 'prop-types';

import { Select, InputLabelWrapper } from '@ohif/ui';

const InputSelect = ({
  label,
  isSortable,
  sortDirection,
  onLabelClick,
  value,
  isMulti,
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
        isMulti={isMulti}
        placeholder={placeholder}
        options={options}
        value={value}
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
  label: '',
  isSortable: false,
  sortDirection: 'none',
  onLabelClick: () => {},
  value: [],
  isMulti: false,
  placeholder: '',
  options: [],
  onChange: () => {},
};

InputSelect.propTypes = {
  label: PropTypes.string,
  isSortable: PropTypes.bool,
  sortDirection: PropTypes.oneOf(['ascending', 'descending', 'none']),
  onLabelClick: PropTypes.func,
  isMulti: PropTypes.bool,
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
  onChange: PropTypes.func,
};

export default InputSelect;
