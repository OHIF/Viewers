import React from 'react';
import PropTypes from 'prop-types';

import { DatePickerWithRange } from '@ohif/ui-next';
import InputLabelWrapper from '../InputLabelWrapper';

const InputDateRange = ({
  id,
  label,
  isSortable,
  sortDirection,
  onLabelClick = () => {},
  value = {},
  onChange,
}) => {
  const { startDate, endDate } = value;

  const onClickHandler = event => {
    event.preventDefault();
    onLabelClick(event);
  };

  return (
    <InputLabelWrapper
      label={label}
      isSortable={isSortable}
      sortDirection={sortDirection}
      onLabelClick={onClickHandler}
      className="xl:min-w-[284px]"
    >
      <div className="relative xl:max-w-[246px]">
        <DatePickerWithRange
          className="mt-2"
          id={id}
          startDate={startDate}
          endDate={endDate}
          onChange={onChange}
        />
      </div>
    </InputLabelWrapper>
  );
};

InputDateRange.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string.isRequired,
  isSortable: PropTypes.bool.isRequired,
  sortDirection: PropTypes.oneOf(['ascending', 'descending', 'none']).isRequired,
  onLabelClick: PropTypes.func.isRequired,
  value: PropTypes.shape({
    /** YYYYMMDD (19921022) */
    startDate: PropTypes.string,
    /** YYYYMMDD (19921022) */
    endDate: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

export default InputDateRange;
