import React from 'react';
import PropTypes from 'prop-types';

import { Select, FilterWrapper } from '@ohif/ui';

const FilterSelect = ({
  label,
  isSortable,
  isBeingSorted,
  sortDirection,
  onLabelClick,
  inputValue,
  inputProps,
  onChange,
}) => {
  return (
    <FilterWrapper
      label={label}
      isSortable={isSortable}
      isBeingSorted={isBeingSorted}
      sortDirection={sortDirection}
      onLabelClick={onLabelClick}
    >
      <Select
        {...inputProps}
        value={inputValue}
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
    </FilterWrapper>
  );
};

FilterSelect.defaultProps = {
  label: '',
  isSortable: false,
  isBeingSorted: false,
  sortDirection: 0,
  onLabelClick: () => {},
  inputValue: '',
  inputProps: {},
  onChange: () => {},
};

FilterSelect.propTypes = {
  label: PropTypes.string,
  isSortable: PropTypes.bool,
  isBeingSorted: PropTypes.bool,
  sortDirection: PropTypes.number,
  onLabelClick: PropTypes.func,
  value: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  inputProps: PropTypes.object,
  onChange: PropTypes.func,
};

export default FilterSelect;
