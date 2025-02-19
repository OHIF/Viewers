// Numeric.tsx
import React, { createContext, useContext, useCallback, PropsWithChildren } from 'react';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { cn } from '../../lib/utils';
import { Input } from '../Input/Input';
import { Slider } from '../Slider/Slider';
import { DoubleSlider } from '../DoubleSlider/DoubleSlider';

interface NumericMetaContextValue {
  mode: 'number' | 'singleRange' | 'doubleRange';
  singleValue: number;
  doubleValue: [number, number];
  setSingleValue: (val: number) => void;
  setDoubleValue: (vals: [number, number]) => void;
  min: number;
  max: number;
  step: number;
}

const NumericMetaContext = createContext<NumericMetaContextValue | null>(null);

/* -------------------------------------------------------------------------
   1) Container
---------------------------------------------------------------------------*/
interface NumericMetaContainerProps {
  mode: 'number' | 'singleRange' | 'doubleRange';
  value?: number; // for controlled single-value usage from parent
  defaultValue?: number; // for uncontrolled single-value usage
  values?: [number, number]; // for controlled double-range usage from parent
  defaultValues?: [number, number]; // for uncontrolled double-range usage
  onChange?: (val: number | [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

function NumericMetaContainer({
  mode,
  value,
  defaultValue,
  values,
  defaultValues,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  className,
  children,
}: PropsWithChildren<NumericMetaContainerProps>) {
  // Calculate default values based on min and max
  const calculatedDefaultValue = defaultValue ?? min + (max - min) / 2;
  const calculatedDefaultValues = defaultValues ?? [
    min + (max - min) * 0.3,
    min + (max - min) * 0.7,
  ];

  // Use useControllableState for both single and double values
  const [internalSingleValue, setInternalSingleValue] = useControllableState({
    prop: mode === 'number' || mode === 'singleRange' ? value : undefined,
    defaultProp: calculatedDefaultValue,
    onChange: newVal => {
      if (mode === 'number' || mode === 'singleRange') {
        onChange?.(newVal);
      }
    },
  });

  const [internalDoubleValue, setInternalDoubleValue] = useControllableState({
    prop: mode === 'doubleRange' ? values : undefined,
    defaultProp: calculatedDefaultValues,
    onChange: newVals => {
      if (mode === 'doubleRange') {
        onChange?.(newVals);
      }
    },
  });

  const handleSingleChange = useCallback(
    (newVal: number) => {
      setInternalSingleValue(newVal);
    },
    [setInternalSingleValue]
  );

  const handleDoubleChange = useCallback(
    (newVals: [number, number]) => {
      setInternalDoubleValue(newVals);
    },
    [setInternalDoubleValue]
  );

  return (
    <NumericMetaContext.Provider
      value={{
        mode,
        singleValue: internalSingleValue,
        doubleValue: internalDoubleValue,
        setSingleValue: handleSingleChange,
        setDoubleValue: handleDoubleChange,
        min,
        max,
        step,
      }}
    >
      <div className={cn('flex flex-col', className)}>{children}</div>
    </NumericMetaContext.Provider>
  );
}

/* -------------------------------------------------------------------------
   2) Label sub-component
---------------------------------------------------------------------------*/
interface NumericMetaLabelProps {
  showValue?: boolean; // optionally show the current numeric value(s)
  className?: string;
  children: React.ReactNode;
}

function NumericMetaLabel({ children, showValue, className }: NumericMetaLabelProps) {
  const ctx = useContext(NumericMetaContext);
  if (!ctx) {
    throw new Error('NumericMetaLabel must be used inside <Numeric.Container>.');
  }

  const { mode, singleValue, doubleValue } = ctx;

  let displayedValue = '';
  let valueClasses = '';
  if (mode === 'number' || mode === 'singleRange') {
    displayedValue = singleValue.toString();
    valueClasses = 'w-10';
  } else if (mode === 'doubleRange') {
    displayedValue = `[${doubleValue[0]} - ${doubleValue[1]}]`;
  }

  return (
    <div className={cn('text-foreground flex text-base', className)}>
      {children}
      {showValue && (
        <span className={cn('inline-block', valueClasses)}>{`: ${displayedValue}`}</span>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------
   3) SingleRange sub-component
---------------------------------------------------------------------------*/

interface SingleRangeProps {
  showNumberInput?: boolean;
  sliderClassName?: string;
  numberInputClassName?: string;
}

function SingleRange({ showNumberInput, sliderClassName, numberInputClassName }: SingleRangeProps) {
  const ctx = useContext(NumericMetaContext);
  if (!ctx) {
    throw new Error('SingleRange must be used inside <Numeric.Container>.');
  }

  const { mode, singleValue, setSingleValue, min, max, step } = ctx;

  const handleSliderChange = useCallback(
    (val: number[]) => {
      setSingleValue(val[0]);
    },
    [setSingleValue]
  );

  const handleNumberChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = parseFloat(evt.target.value);
      if (!isNaN(parsed)) {
        setSingleValue(Math.max(min, Math.min(parsed, max)));
      }
    },
    [min, max, setSingleValue]
  );

  if (mode !== 'singleRange') {
    return null;
  }

  return (
    <div className="flex flex-1 items-center space-x-2">
      <Slider
        className={cn('flex-1', sliderClassName)}
        value={[singleValue]}
        min={min}
        max={max}
        step={step}
        onValueChange={handleSliderChange}
      />
      {showNumberInput && (
        <Input
          type="number"
          className={cn('w-[50px] shrink-0', numberInputClassName)}
          value={singleValue}
          step={step}
          min={min}
          max={max}
          onChange={handleNumberChange}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------
   4) DoubleRange sub-component
---------------------------------------------------------------------------*/
interface DoubleRangeProps {
  showNumberInputs?: boolean;
  className?: string;
}

function DoubleRange({ showNumberInputs, className }: DoubleRangeProps) {
  const ctx = useContext(NumericMetaContext);
  if (!ctx) {
    throw new Error('DoubleRange must be used inside <Numeric.Container>.');
  }

  const { mode, doubleValue, setDoubleValue, min, max, step } = ctx;

  const handleSliderChange = useCallback(
    (values: [number, number]) => {
      setDoubleValue(values);
    },
    [setDoubleValue]
  );

  if (mode !== 'doubleRange') {
    return null;
  }

  return (
    <div className={cn('min-w-0 flex-1', className)}>
      <DoubleSlider
        min={min}
        max={max}
        step={step}
        defaultValue={doubleValue}
        onValueChange={handleSliderChange}
        showNumberInputs={showNumberInputs}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------
   5) Basic NumberInput sub-component
---------------------------------------------------------------------------*/
interface NumberInputProps {
  className?: string;
}

function NumberInput({ className }: NumberInputProps) {
  const ctx = useContext(NumericMetaContext);
  if (!ctx) {
    throw new Error('NumberInput must be used inside <Numeric.Container>.');
  }

  const { mode, singleValue, setSingleValue, min, max, step } = ctx;
  if (mode !== 'number') {
    return null;
  }

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(evt.target.value);
    if (!isNaN(val)) {
      setSingleValue(Math.max(min, Math.min(val, max)));
    }
  };

  // Calculate width based on max value's length, with a minimum of 3 characters
  const maxLength = Math.max(3, max?.toString().length ?? 3);
  const calculatedWidth = `${maxLength + 1.5}ch`;

  return (
    <Input
      type="number"
      value={singleValue}
      step={step}
      min={min}
      max={max}
      onChange={handleChange}
      className={cn('min-w-[60px]', `w-[${calculatedWidth}]`, className)}
    />
  );
}

export const Numeric = {
  Container: NumericMetaContainer,
  Label: NumericMetaLabel,
  SingleRange,
  DoubleRange,
  NumberInput,
};

export default Numeric;
