import React from 'react';
import PropTypes from 'prop-types';

import { Select, InputLabelWrapper } from '@ohif/ui';

const InputSelect = ({
  label,
  isSortable,
  isBeingSorted,
  sortDirection,
  onLabelClick,
  value,
  inputProps,
  onChange,
}) => {
  const { options, isMulti, isDisabled, placeholder } = inputProps;
  return (
    <InputLabelWrapper
      label={label}
      isSortable={isSortable}
      isBeingSorted={isBeingSorted}
      sortDirection={sortDirection}
      onLabelClick={onLabelClick}
    >
      <Select
        isMulti={isMulti}
        isDisabled={isDisabled}
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
  isBeingSorted: false,
  sortDirection: 0,
  onLabelClick: () => {},
  value: [],
  inputProps: {},
  onChange: () => {},
};

InputSelect.propTypes = {
  label: PropTypes.string,
  isSortable: PropTypes.bool,
  isBeingSorted: PropTypes.bool,
  sortDirection: PropTypes.oneOf([-1, 0, 1]),
  onLabelClick: PropTypes.func,
  inputProps: PropTypes.shape({
    isMulti: PropTypes.bool,
    isDisabled: PropTypes.bool,
    placeholder: PropTypes.string,
    options: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.string,
        label: PropTypes.string,
      })
    ),
  }),
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
