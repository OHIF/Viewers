import React from 'react';

import Select from '../Select';
import InputLabelWrapper from '../InputLabelWrapper';

interface InputMultiSelectProps {
  id?: string;
  label: string;
  isSortable: boolean;
  sortDirection: "ascending" | "descending" | "none";
  onLabelClick(...args: unknown[]): unknown;
  onChange(...args: unknown[]): unknown;
  placeholder?: string;
  /** Array of options to list as options */
  options?: {
    value?: string;
    label?: string;
  }[];
  /** Array of string values that exist in our list of options */
  value?: string[];
}

const InputMultiSelect = ({
  id,
  label,
  isSortable,
  sortDirection,
  onLabelClick,
  value = [],
  placeholder = '',
  options = [],
  onChange
}: InputMultiSelectProps) => {
  return (
    <InputLabelWrapper
      label={label}
      isSortable={isSortable}
      sortDirection={sortDirection}
      onLabelClick={onLabelClick}
    >
      <Select
        id={id}
        placeholder={placeholder}
        className="mt-2"
        options={options}
        value={value}
        isMulti={true}
        isClearable={false}
        isSearchable={true}
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        onChange={(selectedOptions, action) => {
          switch (action) {
            case 'select-option':
            case 'remove-value':
            case 'deselect-option':
            case 'clear':
              onChange(selectedOptions);
              break;
            default:
              break;
          }
        }}
      />
    </InputLabelWrapper>
  );
};

export default InputMultiSelect;
