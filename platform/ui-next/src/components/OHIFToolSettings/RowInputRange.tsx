// RowInputRange.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  PropsWithChildren,
} from 'react';
import { Slider } from '../Slider';
import { Input } from '../Input';
import { Label } from '../Label';
import { cn } from '../../lib/utils';

/* ----------------------------------------------------------------------------
   1) Define context shape
----------------------------------------------------------------------------- */
interface RowInputRangeContextValue {
  value: number;
  min: number;
  max: number;
  step: number;
  setValue: (val: number) => void;
}
const RowInputRangeContext = createContext<RowInputRangeContextValue | null>(null);

/* ----------------------------------------------------------------------------
   2) Top-level Container
      - holds the internal state for the range value
      - sets up a Provider so sub-components can be composed
----------------------------------------------------------------------------- */
interface RowInputRangeContainerProps {
  value: number;
  onChange?: (newVal: number) => void;
  min?: number;
  max?: number;
  step?: number;
  containerClassName?: string;
}

function RowInputRangeContainer({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  containerClassName,
  children,
}: PropsWithChildren<RowInputRangeContainerProps>) {
  const [internalValue, setInternalValue] = useState<number>(value);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleValueChange = useCallback(
    (newVal: number) => {
      setInternalValue(newVal);
      onChange?.(newVal);
    },
    [onChange]
  );

  return (
    <RowInputRangeContext.Provider
      value={{
        value: internalValue,
        setValue: handleValueChange,
        min,
        max,
        step,
      }}
    >
      <div className={cn('flex items-center space-x-2', containerClassName)}>{children}</div>
    </RowInputRangeContext.Provider>
  );
}

/* ----------------------------------------------------------------------------
   3) Slider sub-component
      - consumes context and uses the underlying <Slider>
----------------------------------------------------------------------------- */
interface RowInputRangeSliderProps {
  className?: string;
}
function RowInputRangeSlider({ className }: RowInputRangeSliderProps) {
  const ctx = useContext(RowInputRangeContext);
  if (!ctx) {
    throw new Error('RowInputRangeSlider must be used inside RowInputRangeContainer');
  }
  const { value, setValue, min, max, step } = ctx;

  const handleSliderChange = useCallback(
    (vals: number[]) => {
      if (!vals || vals.length < 1) {
        return;
      }
      setValue(vals[0]);
    },
    [setValue]
  );

  return (
    <Slider
      className={cn('w-full', className)}
      min={min}
      max={max}
      step={step}
      value={[value]}
      onValueChange={handleSliderChange}
    />
  );
}

/* ----------------------------------------------------------------------------
   4) Label sub-component
      - uses context if you want to display the current value
      - or can just show a static label
----------------------------------------------------------------------------- */
interface RowInputRangeLabelProps {
  text?: string;
  showValue?: boolean;
  className?: string;
}
function RowInputRangeLabel({ text, showValue, className }: RowInputRangeLabelProps) {
  const ctx = useContext(RowInputRangeContext);
  if (!ctx) {
    throw new Error('RowInputRangeLabel must be used inside RowInputRangeContainer');
  }
  const { value } = ctx;

  return (
    <Label className={cn('flex items-center', className)}>
      {text}
      {showValue && `: ${value}`}
    </Label>
  );
}

/* ----------------------------------------------------------------------------
   5) NumberInput sub-component
      - allows direct numeric editing
----------------------------------------------------------------------------- */
interface RowInputRangeNumberInputProps {
  className?: string;
}
function RowInputRangeNumberInput({ className }: RowInputRangeNumberInputProps) {
  const ctx = useContext(RowInputRangeContext);
  if (!ctx) {
    throw new Error('RowInputRangeNumberInput must be used inside RowInputRangeContainer');
  }
  const { value, setValue, min, max } = ctx;

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let typedVal = parseFloat(e.target.value);
    if (isNaN(typedVal)) {
      typedVal = min;
    }
    typedVal = Math.max(min, Math.min(max, typedVal));
    setValue(typedVal);
  };

  return (
    <Input
      type="number"
      value={value}
      onChange={handleNumberChange}
      className={cn('w-[46px]', className)}
    />
  );
}

/* ----------------------------------------------------------------------------
   6) Export a named object, so it mirrors Radix/Shadcn style usage:
      import { RowInputRange } from './RowInputRange'
      <RowInputRange.Container value={...}>
        <RowInputRange.Label text="Speed" showValue />
        <RowInputRange.Slider />
        <RowInputRange.NumberInput />
      </RowInputRange.Container>
----------------------------------------------------------------------------- */
export const RowInputRange = {
  Container: RowInputRangeContainer,
  Slider: RowInputRangeSlider,
  Label: RowInputRangeLabel,
  NumberInput: RowInputRangeNumberInput,
};

export default RowInputRange;
