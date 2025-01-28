// TextMeta.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  PropsWithChildren,
} from 'react';
import { cn } from '../../lib/utils';

/* -------------------------------------------------------------------------
   7) FilterInput sub-component
      Implements a debounced filter input with an icon and clear button
---------------------------------------------------------------------------*/
import debounce from 'lodash.debounce';
import React, { useMemo, useRef } from 'react';

/*
  TextMeta is a "meta component" for text-related UI in a
  composition style. We avoid importing existing code and replicate
  only the relevant styling approach, so everything is self-contained.
*/

/* -------------------------------------------------------------------------
   1) Context shape
---------------------------------------------------------------------------*/
interface TextMetaContextValue {
  textValue: string;
  setTextValue: (val: string) => void;
  placeholder?: string;
  isSortable?: boolean;
  sortDirection?: 'ascending' | 'descending' | 'none';
  onLabelClick?: () => void;
}

const TextMetaContext = createContext<TextMetaContextValue | null>(null);

interface TextMetaContainerProps {
  value?: string;
  onChange?: (val: string) => void;
  placeholder?: string;
  isSortable?: boolean;
  sortDirection?: 'ascending' | 'descending' | 'none';
  onLabelClick?: () => void;
  containerClassName?: string;
}

/* -------------------------------------------------------------------------
   2) Container
---------------------------------------------------------------------------*/
function TextMetaContainer({
  value = '',
  onChange,
  placeholder,
  isSortable = false,
  sortDirection = 'none',
  onLabelClick,
  containerClassName,
  children,
}: PropsWithChildren<TextMetaContainerProps>) {
  const [textValue, setTextValue] = useState<string>(value);

  useEffect(() => {
    setTextValue(value);
  }, [value]);

  const handleTextChange = useCallback(
    (newVal: string) => {
      setTextValue(newVal);
      onChange?.(newVal);
    },
    [onChange]
  );

  return (
    <TextMetaContext.Provider
      value={{
        textValue,
        setTextValue: handleTextChange,
        placeholder,
        isSortable,
        sortDirection,
        onLabelClick,
      }}
    >
      <div className={cn('flex flex-col space-y-2', containerClassName)}>{children}</div>
    </TextMetaContext.Provider>
  );
}

/* -------------------------------------------------------------------------
   3) Basic label sub-component (not sortable/clickable)
---------------------------------------------------------------------------*/
interface TextMetaLabelProps {
  label: string;
  className?: string;
}

function TextMetaLabel({ label, className }: TextMetaLabelProps) {
  return <div className={cn('text-sm text-white', className)}>{label}</div>;
}

/* -------------------------------------------------------------------------
   4) Sortable label sub-component
      Renders an optional icon for ascending/descending, clickable.
---------------------------------------------------------------------------*/
interface SortableLabelProps {
  label: string;
  className?: string;
}

function SortableLabel({ label, className }: SortableLabelProps) {
  const ctx = useContext(TextMetaContext);
  if (!ctx) {
    throw new Error('SortableLabel must be used inside <TextMeta.Container>.');
  }
  const { isSortable, sortDirection, onLabelClick } = ctx;

  const icon = (() => {
    if (!isSortable) {
      return null;
    }
    if (sortDirection === 'ascending') {
      // Example minimal arrow up
      return <span className="text-primary-main ml-2">&uarr;</span>;
    }
    if (sortDirection === 'descending') {
      return <span className="text-primary-main ml-2">&darr;</span>;
    }
    // 'none'
    return <span className="text-primary-main ml-2">&#8597;</span>;
  })();

  return (
    <div
      className={cn('flex cursor-pointer items-center text-sm text-white', className)}
      onClick={() => isSortable && onLabelClick?.()}
    >
      {label}
      {icon}
    </div>
  );
}

/* -------------------------------------------------------------------------
   5) Text input sub-component
---------------------------------------------------------------------------*/
interface TextMetaInputProps {
  label?: string;
  className?: string;
}

function TextMetaInput({ label, className }: TextMetaInputProps) {
  const ctx = useContext(TextMetaContext);
  if (!ctx) {
    throw new Error('TextMetaInput must be used inside <TextMeta.Container>.');
  }
  const { textValue, setTextValue, placeholder } = ctx;

  return (
    <div className={cn('flex flex-col', className)}>
      {label && <label className="mb-1 text-sm text-white">{label}</label>}
      <input
        type="text"
        value={textValue}
        placeholder={placeholder}
        onChange={e => setTextValue(e.target.value)}
        className="border-inputfield-main focus:border-inputfield-focus placeholder-inputfield-placeholder w-full rounded border bg-black py-2 px-3 text-sm text-white shadow transition duration-300 focus:outline-none"
      />
    </div>
  );
}

/* -------------------------------------------------------------------------
   6) LabeledInput sub-component
      This mimics an input with its own label, possibly sorted
---------------------------------------------------------------------------*/
interface LabeledInputProps {
  label: string;
  className?: string;
}

function LabeledInput({ label, className }: LabeledInputProps) {
  const ctx = useContext(TextMetaContext);
  if (!ctx) {
    throw new Error('LabeledInput must be used inside <TextMeta.Container>.');
  }
  const { textValue, setTextValue, isSortable, sortDirection, onLabelClick } = ctx;

  // Minimally replicate a "label wrapper" with optional sorting
  const icon = (() => {
    if (!isSortable) {
      return null;
    }
    if (sortDirection === 'ascending') {
      return <span className="text-primary-main ml-2">&uarr;</span>;
    }
    if (sortDirection === 'descending') {
      return <span className="text-primary-main ml-2">&darr;</span>;
    }
    return <span className="text-primary-main ml-2">&#8597;</span>;
  })();

  const onLabelPress = () => {
    if (isSortable && onLabelClick) {
      onLabelClick();
    }
  };

  return (
    <label className={cn('flex flex-col text-sm text-white', className)}>
      <span
        className="flex cursor-pointer select-none items-center"
        onClick={onLabelPress}
      >
        {label}
        {icon}
      </span>
      <input
        type="text"
        className="border-inputfield-main focus:border-inputfield-focus placeholder-inputfield-placeholder mt-2 w-full rounded border bg-black py-2 px-3 text-sm text-white transition duration-300 focus:outline-none"
        value={textValue}
        onChange={e => setTextValue(e.target.value)}
      />
    </label>
  );
} // Overriding import for clarity

interface FilterInputProps {
  className?: string;
  debounceTime?: number;
}

function FilterInput({ className, debounceTime = 200 }: FilterInputProps) {
  const ctx = useContext(TextMetaContext);
  if (!ctx) {
    throw new Error('FilterInput must be used inside <TextMeta.Container>.');
  }
  const { textValue, setTextValue, placeholder } = ctx;

  const inputRef = useRef<HTMLInputElement | null>(null);

  const debouncedSet = useMemo(
    () => debounce((val: string) => setTextValue(val), debounceTime),
    [debounceTime, setTextValue]
  );

  useEffect(() => {
    return () => {
      debouncedSet.cancel();
    };
  }, [debouncedSet]);

  const onChangeImmediate = (val: string) => {
    setTextValue(val);
    debouncedSet(val);
  };

  const clearValue = () => {
    onChangeImmediate('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className={cn('relative', className)}>
      <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-white opacity-75">
        🔍
      </span>
      <input
        ref={inputRef}
        type="text"
        defaultValue={textValue}
        placeholder={placeholder || 'Filter...'}
        onChange={e => onChangeImmediate(e.target.value)}
        className="border-inputfield-main focus:border-inputfield-focus placeholder:text-inputfield-placeholder w-full rounded-md border bg-black py-2 px-8 text-sm text-white transition duration-300 focus:outline-none"
      />
      {textValue?.length > 0 && (
        <span className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-2 text-white opacity-75">
          <span onClick={clearValue}>✕</span>
        </span>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------
   8) Export
---------------------------------------------------------------------------*/
export const TextMeta = {
  Container: TextMetaContainer,
  Label: TextMetaLabel,
  SortableLabel,
  Input: TextMetaInput,
  LabeledInput,
  FilterInput,
};

export default TextMeta;
