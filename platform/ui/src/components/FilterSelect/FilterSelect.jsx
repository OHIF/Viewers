import React from 'react';
import PropTypes from 'prop-types';

import { Select, FilterWrapper } from '@ohif/ui';

const FilterSelect = ({
  label,
  isSortable,
  isBeingSorted,
  sortDirection,
  onLabelClick,
  inputValue = '',
  inputProps = {},
  onChange = () => {},
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

FilterSelect.propTypes = {
  value: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  inputProps: PropTypes.object,
  onChange: PropTypes.func,
};

export default FilterSelect;
