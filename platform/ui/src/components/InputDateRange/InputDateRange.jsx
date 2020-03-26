import React from 'react';
import PropTypes from 'prop-types';

import { DateRange, InputLabelWrapper } from '@ohif/ui';

const InputDateRange = ({
  label,
  isSortable,
  isBeingSorted,
  sortDirection,
  onLabelClick,
  value,
  onChange,
}) => {
  const { startDate, endDate } = value;
  return (
    <InputLabelWrapper
      label={label}
      isSortable={isSortable}
      isBeingSorted={isBeingSorted}
      sortDirection={sortDirection}
      onLabelClick={onLabelClick}
    >
      <div className="relative">
        <DateRange
          startDate={startDate}
          endDate={endDate}
          onChange={({ startDate, endDate }) => {
            if (onChange) {
              onChange({ startDate, endDate });
            }
          }}
        />
      </div>
    </InputLabelWrapper>
  );
};

InputDateRange.defaultProps = {
  label: '',
  isSortable: false,
  isBeingSorted: false,
  sortDirection: 0,
  onLabelClick: () => {},
  value: {},
  onChange: () => {},
};

InputDateRange.propTypes = {
  label: PropTypes.string,
  isSortable: PropTypes.bool,
  isBeingSorted: PropTypes.bool,
  sortDirection: PropTypes.oneOf([-1, 0, 1]),
  onLabelClick: PropTypes.func,
  value: PropTypes.shape({
    /** Start date moment object */
    startDate: PropTypes.object, // moment date is an object
    /** End date moment object */
    endDate: PropTypes.object, // moment date is an object
  }),
  onChange: PropTypes.func,
};

export default InputDateRange;
