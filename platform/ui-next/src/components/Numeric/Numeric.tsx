// Numeric.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  PropsWithChildren,
} from 'react';
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
  value?: number; // for single-value usage
  values?: [number, number]; // for double-range usage
  onChange?: (val: number | [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
  containerClassName?: string;
}

function NumericMetaContainer({
  mode,
  value = 0,
  values = [0, 100],
  onChange,
  min = 0,
  max = 100,
  step = 1,
  containerClassName,
  children,
}: PropsWithChildren<NumericMetaContainerProps>) {
  const [singleValue, setSingleValue] = useState<number>(value);
  const [doubleValue, setDoubleValue] = useState<[number, number]>(values);

  useEffect(() => {
    setSingleValue(value);
  }, [value]);

  useEffect(() => {
    setDoubleValue(values);
  }, [values]);

  const handleSingleChange = useCallback(
    (newVal: number) => {
      setSingleValue(newVal);
      onChange?.(newVal);
    },
    [onChange]
  );

  const handleDoubleChange = useCallback(
    (newVals: [number, number]) => {
      setDoubleValue(newVals);
      onChange?.(newVals);
    },
    [onChange]
  );

  return (
    <NumericMetaContext.Provider
      value={{
        mode,
        singleValue,
        doubleValue,
        setSingleValue: handleSingleChange,
        setDoubleValue: handleDoubleChange,
        min,
        max,
        step,
      }}
    >
      <div className={cn('flex flex-col space-y-2', containerClassName)}>{children}</div>
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
  if (mode === 'number' || mode === 'singleRange') {
    displayedValue = singleValue.toString();
  } else if (mode === 'doubleRange') {
    displayedValue = `[${doubleValue[0]}, ${doubleValue[1]}]`;
  }

  return (
    <div className={cn('text-sm text-white', className)}>
      {children}
      {showValue && `: ${displayedValue}`}
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
    <div className="flex items-center space-x-2">
      <Slider
        className={cn('w-full', sliderClassName)}
        value={[singleValue]}
        min={min}
        max={max}
        step={step}
        onValueChange={handleSliderChange}
      />
      {showNumberInput && (
        <Input
          type="number"
          className={cn('w-[50px]', numberInputClassName)}
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
    <div className={cn('flex items-center', className)}>
      <DoubleSlider
        min={min}
        max={max}
        step={step}
        defaultValue={doubleValue}
        onValueChange={handleSliderChange}
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

  return (
    <Input
      type="number"
      value={singleValue}
      step={step}
      min={min}
      max={max}
      onChange={handleChange}
      className={cn('w-[60px]', className)}
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
