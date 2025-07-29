import React from 'react';

import Input from '../Input';
import InputLabelWrapper from '../InputLabelWrapper';

interface InputTextProps {
  id?: string;
  label: string;
  isSortable?: boolean;
  sortDirection?: "ascending" | "descending" | "none";
  onLabelClick?(...args: unknown[]): unknown;
  value?: any;
  onChange(...args: unknown[]): unknown;
}

const InputText = ({
  id,
  label,
  isSortable = false,
  sortDirection = 'none',
  onLabelClick = () => {},
  value = '',
  onChange
}: InputTextProps) => {
  return (
    <InputLabelWrapper
      label={label}
      isSortable={isSortable}
      sortDirection={sortDirection}
      onLabelClick={onLabelClick}
    >
      <Input
        id={id}
        className="mt-2"
        type="text"
        containerClassName="mr-2"
        value={value}
        onChange={event => {
          onChange(event.target.value);
        }}
      />
    </InputLabelWrapper>
  );
};

export default InputText;
