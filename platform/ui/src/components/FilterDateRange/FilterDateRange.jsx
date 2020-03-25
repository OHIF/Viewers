import React from 'react';
import PropTypes from 'prop-types';

import { DateRange, FilterWrapper } from '@ohif/ui';

const FilterDateRange = ({
  label,
  isSortable,
  isBeingSorted,
  sortDirection,
  onLabelClick,
  inputValue,
  inputProps,
  onChange,
}) => {
  const { startDate, endDate } = inputValue;
  return (
    <FilterWrapper
      label={label}
      isSortable={isSortable}
      isBeingSorted={isBeingSorted}
      sortDirection={sortDirection}
      onLabelClick={onLabelClick}
    >
      <div className="relative">
        <DateRange
          {...inputProps}
          startDate={startDate}
          endDate={endDate}
          onChange={({ startDate, endDate }) => {
            if (onChange) {
              onChange({ startDate, endDate });
            }
          }}
        />
      </div>
    </FilterWrapper>
  );
};

FilterDateRange.defaultProps = {
  label: '',
  isSortable: false,
  isBeingSorted: false,
  sortDirection: 0,
  onLabelClick: () => {},
  inputValue: {},
  inputProps: {},
  onChange: () => {},
};

FilterDateRange.propTypes = {
  label: PropTypes.string,
  isSortable: PropTypes.bool,
  isBeingSorted: PropTypes.bool,
  sortDirection: PropTypes.oneOf([-1, 0, 1]),
  onLabelClick: PropTypes.func,
  value: PropTypes.shape({
    startDate: PropTypes.string,
    endDate: PropTypes.string,
  }),
  inputProps: PropTypes.object,
  onChange: PropTypes.func,
};

export default FilterDateRange;
