import React from 'react';
import PropTypes from 'prop-types';

import { DateRange, FilterWrapper } from '@ohif/ui';

const FilterDateRange = ({
  label,
  isSortable,
  isBeingSorted,
  sortDirection,
  onLabelClick,
  inputValue = {},
  inputProps = {},
  onChange = () => {},
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

FilterDateRange.propTypes = {
  value: PropTypes.shape({
    startDate: PropTypes.string,
    endDate: PropTypes.string,
  }),
  inputProps: PropTypes.object,
  onChange: PropTypes.func,
};

export default FilterDateRange;
