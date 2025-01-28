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

  // Move hooks before the conditional return
  const handleSliderChange = useCallback(
    (val: number) => {
      setSingleValue(val);
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
    return null; // Skip rendering if in the wrong mode
  }

  // The slider range is from min to max, storing one value
  const sliderPercent = ((singleValue - min) / (max - min)) * 100 || 0;

  return (
    <div className="flex items-center space-x-2">
      <div className={cn('relative flex h-2 w-full items-center', sliderClassName)}>
        <div className="absolute h-[3px] w-full rounded-lg bg-gray-500" />
        <div
          className="absolute h-[3px] rounded-lg bg-cyan-400"
          style={{
            width: `${sliderPercent}%`,
          }}
        />
        {/* Slider Thumb */}
        <div
          className="absolute h-3 w-3 cursor-pointer rounded-full bg-white shadow"
          style={{
            left: `calc(${sliderPercent}% - 6px)`,
          }}
          onMouseDown={evt => {
            // Basic pointer drag logic
            evt.preventDefault();
            const initialX = evt.clientX;
            const handleMouseMove = (moveEvt: MouseEvent) => {
              moveEvt.preventDefault();
              const dx = moveEvt.clientX - initialX;
              const sliderRect = (evt.target as HTMLElement).parentElement?.getBoundingClientRect();
              if (!sliderRect) {
                return;
              }
              const fraction = dx / sliderRect.width;
              const newVal = singleValue + fraction * (max - min);
              handleSliderChange(parseFloat(newVal.toFixed(3)));
            };
            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        />
      </div>
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
  if (mode !== 'doubleRange') {
    return null;
  }

  const [startVal, endVal] = doubleValue;

  const toPercent = (val: number) => ((val - min) / (max - min)) * 100;

  const handleStartChange = (newVal: number) => {
    const clamped = Math.min(Math.max(newVal, min), endVal);
    setDoubleValue([clamped, endVal]);
  };

  const handleEndChange = (newVal: number) => {
    const clamped = Math.max(Math.min(newVal, max), startVal);
    setDoubleValue([startVal, clamped]);
  };

  // Each thumb is draggable
  const dragThumb = (thumb: 'start' | 'end', evt: React.MouseEvent) => {
    evt.preventDefault();
    const initialX = evt.clientX;
    const initialStart = startVal;
    const initialEnd = endVal;
    const parentRect = (evt.target as HTMLElement).parentElement?.getBoundingClientRect();
    if (!parentRect) {
      return;
    }

    function handleMouseMove(moveEvt: MouseEvent) {
      moveEvt.preventDefault();
      const dx = moveEvt.clientX - initialX;
      const fraction = dx / parentRect.width;
      const rangeSize = max - min;
      const delta = fraction * rangeSize;
      if (thumb === 'start') {
        handleStartChange(parseFloat((initialStart + delta).toFixed(3)));
      } else {
        handleEndChange(parseFloat((initialEnd + delta).toFixed(3)));
      }
    }

    function handleMouseUp() {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Number input changes
  const handleNumberChange = (index: 0 | 1) => (evt: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(evt.target.value);
    if (isNaN(val)) {
      return;
    }
    if (index === 0) {
      handleStartChange(val);
    } else {
      handleEndChange(val);
    }
  };

  const leftPercent = toPercent(startVal);
  const rightPercent = toPercent(endVal);

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {showNumberInputs && (
        <Input
          type="number"
          step={step}
          min={min}
          max={max}
          value={startVal}
          onChange={handleNumberChange(0)}
          className="w-[50px]"
        />
      )}
      <div className="relative flex h-2 w-full items-center">
        <div className="absolute h-[3px] w-full rounded-lg bg-gray-500" />
        <div
          className="absolute h-[3px] rounded-lg bg-cyan-400"
          style={{
            left: `${leftPercent}%`,
            width: `${rightPercent - leftPercent}%`,
          }}
        />
        {/* Start Thumb */}
        <div
          className="absolute h-3 w-3 cursor-pointer rounded-full bg-white shadow"
          style={{ left: `calc(${leftPercent}% - 6px)` }}
          onMouseDown={evt => dragThumb('start', evt)}
        />
        {/* End Thumb */}
        <div
          className="absolute h-3 w-3 cursor-pointer rounded-full bg-white shadow"
          style={{ left: `calc(${rightPercent}% - 6px)` }}
          onMouseDown={evt => dragThumb('end', evt)}
        />
      </div>
      {showNumberInputs && (
        <Input
          type="number"
          step={step}
          min={min}
          max={max}
          value={endVal}
          onChange={handleNumberChange(1)}
          className="w-[50px]"
        />
      )}
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
