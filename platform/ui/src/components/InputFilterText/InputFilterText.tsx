import classNames from 'classnames';
import debounce from 'lodash.debounce';
import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Icon from '../Icon';

type InputFilterTextProps = {
  className?: string;
  value?: string;
  placeholder: string;
  onDebounceChange?: (val: string) => void;
  onChange?: (val: string) => void;
  debounceTime?: number;
};

/**
 * A component to use as the input for text to filter by/on. A debounced callback is automatically provided
 * so that the filtering in-turn will be debounced. There is also a straight onChange callback when the filter value is
 * required immediately and NOT debounced. The debounce time is also configurable.
 */
const InputFilterText = ({
  className,
  value = '',
  placeholder,
  onDebounceChange,
  onChange,
  debounceTime = 200,
}: InputFilterTextProps): ReactElement => {
  const [filterValue, setFilterValue] = useState<string>(value);

  const searchInputRef = useRef(null);

  const debouncedOnChange = useMemo(() => {
    return debounce(onDebounceChange || (() => {}), debounceTime);
  }, []);

  // This allows for the filter value to be updated via the props.
  useEffect(() => setFilterValue(value), [value]);

  useEffect(() => {
    return debouncedOnChange?.cancel();
  }, []);

  const handleFilterTextChanged = useCallback(value => {
    setFilterValue(value);

    if (onChange) {
      onChange(value);
    }

    if (onDebounceChange) {
      debouncedOnChange(value);
    }
  }, []);

  return (
    <label className={classNames('relative', className)}>
      <span className="absolute inset-y-0 left-0 flex items-center pl-2">
        <Icon name="icon-search"></Icon>
      </span>
      <input
        ref={searchInputRef}
        type="text"
        className="border-inputfield-main focus:border-inputfield-focus disabled:border-inputfield-disabled placeholder:text-inputfield-placeholder block w-full w-full appearance-none rounded-md border bg-black py-2 px-9 text-base leading-tight shadow transition duration-300 focus:outline-none"
        placeholder={placeholder}
        onChange={event => handleFilterTextChanged(event.target.value)}
        autoComplete="off"
        value={filterValue}
      ></input>
      <span className="absolute inset-y-0 right-0 flex items-center pr-2">
        <Icon
          name="icon-clear-field"
          className={classNames('cursor-pointer', filterValue ? '' : 'hidden')}
          onClick={() => {
            searchInputRef.current.value = '';
            handleFilterTextChanged('');
          }}
        ></Icon>
      </span>
    </label>
  );
};

export default InputFilterText;
