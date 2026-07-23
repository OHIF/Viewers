// Numeric.tsx
import React, { createContext, useContext, useCallback, PropsWithChildren } from 'react';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { cn } from '../../lib/utils';
import { Input } from '../Input/Input';
import { Slider } from '../Slider/Slider';
import { DoubleSlider } from '../DoubleSlider/DoubleSlider';
import { Button } from '../Button/Button';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

// Calculate decimal places based on step
const getDecimalPlaces = (step: number): number => {
  if (Number.isInteger(step)) {
    return 0;
  }
  const stepStr = step.toString();
  if (stepStr.includes('.')) {
    return stepStr.split('.')[1].length;
  }
  return 0;
};

interface NumericMetaContextValue {
  mode: 'number' | 'singleRange' | 'doubleRange' | 'stepper';
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
  mode: 'number' | 'singleRange' | 'doubleRange' | 'stepper';
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
    prop: mode === 'number' || mode === 'singleRange' || mode === 'stepper' ? value : undefined,
    defaultProp: calculatedDefaultValue,
    onChange: newVal => {
      if (mode === 'number' || mode === 'singleRange' || mode === 'stepper') {
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
  if (mode === 'number' || mode === 'singleRange' || mode === 'stepper') {
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

/* -------------------------------------------------------------------------
   6) NumberStepper sub-component
---------------------------------------------------------------------------*/
interface NumberStepperProps {
  className?: string;
  children?: React.ReactNode;
  direction?: 'horizontal' | 'vertical';
  inputWidth?: string;
}

// Modified NumberStepper component to properly position left/right controls
function NumberStepper({ className, children, direction, inputWidth }: NumberStepperProps) {
  const ctx = useContext(NumericMetaContext);
  if (!ctx) {
    throw new Error('NumberStepper must be used inside <Numeric.Container>.');
  }

  const { mode, singleValue, setSingleValue, min, max, step } = ctx;
  if (mode !== 'stepper') {
    return null;
  }

  // Calculate decimal places based on step
  const decimalPlaces = getDecimalPlaces(step);

  // Format displayed value with proper decimal places
  const displayValue = React.useMemo(() => {
    return decimalPlaces > 0 ? singleValue.toFixed(decimalPlaces) : singleValue.toString();
  }, [singleValue, decimalPlaces]);

  const handleInputChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const val = evt.target.value;

    // Allow empty string, minus sign, or decimal point for flexibility
    if (val === '' || val === '-' || val === '.') {
      return;
    }

    const numValue = Number(val);
    if (!isNaN(numValue)) {
      setSingleValue(Math.max(min, Math.min(numValue, max)));
    }
  };

  const handleBlur = () => {
    // Ensure value is within constraints when input loses focus
    const boundedValue = Math.max(min, Math.min(singleValue, max));
    if (boundedValue !== singleValue) {
      setSingleValue(boundedValue);
    }
  };

  // Check if children is HorizontalControls component
  const hasHorizontalControls = direction === 'horizontal';

  if (hasHorizontalControls) {
    // We'll handle the control positioning ourselves
    return (
      <div
        className={cn(
          'bg-background border-input flex h-[28px] items-center overflow-hidden rounded-md border',
          className
        )}
      >
        <LeftControl
          min={min}
          step={step}
          value={singleValue}
          setValue={setSingleValue}
        />
        <Input
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          className={cn(
            'h-6 appearance-none border-none p-0 text-center shadow-none focus:border-none focus:outline-none',
            inputWidth
          )}
        />
        {children}
        <RightControl
          max={max}
          step={step}
          value={singleValue}
          setValue={setSingleValue}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-background border-input flex items-center overflow-hidden rounded-md border',
        className
      )}
    >
      <Input
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        className={cn(
          'h-6 appearance-none border-none p-0 text-center shadow-none focus:border-none focus:outline-none',
          inputWidth ? inputWidth : 'max-w-12 min-w-0'
        )}
      />
      <div className="ml-1 flex flex-shrink-0 flex-col">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSingleValue(singleValue + step)}
          disabled={singleValue >= max}
          className="text-primary h-3 w-5"
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSingleValue(singleValue - step)}
          disabled={singleValue <= min}
          className="text-primary h-3 w-5"
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// New components for left and right controls
function LeftControl({ min, step, value, setValue }) {
  const decrement = useCallback(() => {
    const newValue = Math.max(value - step, min);
    setValue(newValue);
  }, [value, min, step, setValue]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={decrement}
      className="text-primary h-full w-4 cursor-pointer p-0"
    >
      <ChevronLeft className="h-4 w-4" />
    </Button>
  );
}

function RightControl({ max, step, value, setValue }) {
  const increment = useCallback(() => {
    const newValue = Math.min(value + step, max);
    setValue(newValue);
  }, [value, max, step, setValue]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={increment}
      className="text-primary h-full w-4 cursor-pointer p-0"
    >
      <ChevronRight className="h-4 w-4" />
    </Button>
  );
}

export const Numeric = {
  Container: NumericMetaContainer,
  Label: NumericMetaLabel,
  SingleRange,
  DoubleRange,
  NumberInput,
  NumberStepper,
};

export default Numeric;
