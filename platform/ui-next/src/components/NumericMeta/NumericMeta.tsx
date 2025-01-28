// NumericMeta.tsx
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

/* -------------------------------------------------------------------------
   1) Context shape
---------------------------------------------------------------------------*/
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
   2) Container
      Maintains either a singleValue or doubleValue in state,
      depending on the mode.
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
   3) Label sub-component
---------------------------------------------------------------------------*/
interface NumericMetaLabelProps {
  text: string;
  showValue?: boolean; // optionally show the current numeric value(s)
  className?: string;
}

function NumericMetaLabel({ text, showValue, className }: NumericMetaLabelProps) {
  const ctx = useContext(NumericMetaContext);
  if (!ctx) {
    throw new Error('NumericMetaLabel must be used inside <NumericMeta.Container>.');
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
      {text}
      {showValue && `: ${displayedValue}`}
    </div>
  );
}

/* -------------------------------------------------------------------------
   4) SingleRange sub-component
      Renders a slider and optional number input
      (Implementation is new but borrows styling approach.)
---------------------------------------------------------------------------*/

interface SingleRangeProps {
  showNumberInput?: boolean;
  sliderClassName?: string;
  numberInputClassName?: string;
}

function SingleRange({ showNumberInput, sliderClassName, numberInputClassName }: SingleRangeProps) {
  const ctx = useContext(NumericMetaContext);
  if (!ctx) {
    throw new Error('SingleRange must be used inside <NumericMeta.Container>.');
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
   5) DoubleRange sub-component
      Renders a pair of slider thumbs and optional numeric boxes
---------------------------------------------------------------------------*/
interface DoubleRangeProps {
  showNumberInputs?: boolean;
  className?: string;
}

function DoubleRange({ showNumberInputs, className }: DoubleRangeProps) {
  const ctx = useContext(NumericMetaContext);
  if (!ctx) {
    throw new Error('DoubleRange must be used inside <NumericMeta.Container>.');
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
   6) Basic NumberInput sub-component
      (mode = "number")
---------------------------------------------------------------------------*/
interface NumberOnlyInputProps {
  className?: string;
}

function NumberOnlyInput({ className }: NumberOnlyInputProps) {
  const ctx = useContext(NumericMetaContext);
  if (!ctx) {
    throw new Error('NumberOnlyInput must be used inside <NumericMeta.Container>.');
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

/* -------------------------------------------------------------------------
   7) Export everything
---------------------------------------------------------------------------*/
export const NumericMeta = {
  Container: NumericMetaContainer,
  Label: NumericMetaLabel,
  SingleRange,
  DoubleRange,
  NumberOnlyInput,
};

export default NumericMeta;
