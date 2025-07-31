import React from 'react';

import { DatePickerWithRange } from '@ohif/ui-next';
import InputLabelWrapper from '../InputLabelWrapper';

interface InputDateRangeProps {
  id?: string;
  label: string;
  isSortable: boolean;
  sortDirection: "ascending" | "descending" | "none";
  onLabelClick(...args: unknown[]): unknown;
  value?: {
    /** YYYYMMDD (19921022) */
    startDate?: string;
    /** YYYYMMDD (19921022) */
    endDate?: string;
  };
  onChange(...args: unknown[]): unknown;
}

const InputDateRange = ({
  id,
  label,
  isSortable,
  sortDirection,
  onLabelClick = () => {},
  value = {},
  onChange
}: InputDateRangeProps) => {
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

export default InputDateRange;
