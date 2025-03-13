import * as React from 'react';
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import debounce from 'lodash.debounce';
import { cn } from '../../lib/utils';
import { Input } from '../Input';
import { Icons } from '../Icons';

// Context to share state between compound components
type FilterInputContextType = {
  value: string;
  setValue: (value: string) => void;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  clearValue: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
};

const FilterInputContext = createContext<FilterInputContextType | undefined>(undefined);

function useFilterInputContext() {
  const context = useContext(FilterInputContext);
  if (!context) {
    throw new Error('FilterInput compound components must be used within FilterInput.Root');
  }
  return context;
}

// Root component
interface RootProps {
  children: React.ReactNode;
  className?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  onDebounceChange?: (value: string) => void;
  debounceTime?: number;
}

function Root({
  children,
  className,
  defaultValue = '',
  value: controlledValue,
  onChange,
  onDebounceChange,
  debounceTime = 200,
}: RootProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Determine if this is a controlled or uncontrolled component
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const debouncedOnChange = useMemo(() => {
    return debounce(onDebounceChange || (() => {}), debounceTime);
  }, [onDebounceChange, debounceTime]);

  useEffect(() => {
    return () => debouncedOnChange.cancel();
  }, [debouncedOnChange]);

  const setValue = useCallback(
    (newValue: string) => {
      if (!isControlled) {
        setUncontrolledValue(newValue);
      }

      if (onChange) {
        onChange(newValue);
      }

      if (onDebounceChange) {
        debouncedOnChange(newValue);
      }
    },
    [isControlled, onChange, onDebounceChange, debouncedOnChange]
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValue(event.target.value);
    },
    [setValue]
  );

  const clearValue = useCallback(() => {
    setValue('');
    inputRef.current?.focus();
  }, [setValue]);

  return (
    <FilterInputContext.Provider value={{ value, setValue, handleChange, clearValue, inputRef }}>
      <div className={cn('relative', className)}>{children}</div>
    </FilterInputContext.Provider>
  );
}

// Input component
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  className?: string;
}

function InputComponent({ className, placeholder, ...props }: InputProps) {
  const { value, handleChange, inputRef } = useFilterInputContext();

  return (
    <Input
      ref={inputRef}
      className={cn('w-full', className)}
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      {...props}
    />
  );
}

// Search icon component
interface SearchIconProps {
  className?: string;
}

function SearchIcon({ className }: SearchIconProps) {
  return (
    <span className={cn('absolute inset-y-0 left-0 flex items-center pl-2', className)}>
      <Icons.Search className="text-muted-foreground" />
    </span>
  );
}

// Clear button component
interface ClearButtonProps {
  className?: string;
}

function ClearButton({ className }: ClearButtonProps) {
  const { value, clearValue } = useFilterInputContext();

  if (!value) {
    return null;
  }

  return (
    <span className={cn('absolute inset-y-0 right-0 flex items-center pr-2', className)}>
      <Icons.Clear
        className={cn('cursor-pointer', className)}
        onClick={clearValue}
      />
    </span>
  );
}

// Pre-composed component for simpler usage
interface FilterInputProps {
  className?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onDebounceChange?: (value: string) => void;
  debounceTime?: number;
}

function FilterInput({
  className,
  placeholder = 'Search...',
  value,
  defaultValue = '',
  onChange,
  onDebounceChange,
  debounceTime = 200,
}: FilterInputProps) {
  return (
    <Root
      className={className}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      onDebounceChange={onDebounceChange}
      debounceTime={debounceTime}
    >
      <SearchIcon />
      <InputComponent
        placeholder={placeholder}
        className="pl-9 pr-9"
      />
      <ClearButton />
    </Root>
  );
}

// Attach subcomponents as static properties
FilterInput.Root = Root;
FilterInput.Input = InputComponent;
FilterInput.SearchIcon = SearchIcon;
FilterInput.ClearButton = ClearButton;

export { FilterInput, type FilterInputProps };
