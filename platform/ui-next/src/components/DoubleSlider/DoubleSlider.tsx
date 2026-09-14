import React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

import { cn } from '../../lib/utils';
import { Input } from '../Input';

interface DoubleSliderProps {
  className?: string;
  min: number;
  max: number;
  hardMin?: number;
  hardMax?: number;
  step?: number;
  defaultValue?: [number, number];
  onValueChange?: (value: [number, number]) => void;
  showNumberInputs?: boolean;
}

const DoubleSlider = React.forwardRef<HTMLDivElement, DoubleSliderProps>(
  (
    {
      className,
      min,
      max,
      hardMin,
      hardMax,
      onValueChange,
      step = 1,
      defaultValue = [min, max],
      showNumberInputs = false,
    },
    ref
  ) => {
    const [value, setValue] = React.useState<[number, number]>(defaultValue);
    const [effectiveMin, setEffectiveMin] = React.useState(min);
    const [effectiveMax, setEffectiveMax] = React.useState(max);
    const [inputValues, setInputValues] = React.useState<[string, string]>([
      defaultValue[0].toString(),
      defaultValue[1].toString(),
    ]);

    const prevDefaultValueRef = React.useRef<[number, number] | null>(null);
    const prevLimitsRef = React.useRef({ min, max });

    React.useEffect(() => {
      // Only update if defaultValue has actually changed
      if (
        !prevDefaultValueRef.current ||
        prevDefaultValueRef.current[0] !== defaultValue[0] ||
        prevDefaultValueRef.current[1] !== defaultValue[1]
      ) {
        setValue(defaultValue);
        setInputValues([defaultValue[0].toString(), defaultValue[1].toString()]);
        setEffectiveMin(currentMin => Math.min(currentMin, defaultValue[0]));
        setEffectiveMax(currentMax => Math.max(currentMax, defaultValue[1]));
        prevDefaultValueRef.current = defaultValue;
      }
    }, [defaultValue]);

    React.useEffect(() => {
      if (prevLimitsRef.current.min !== min || prevLimitsRef.current.max !== max) {
        setEffectiveMin(Math.min(min, defaultValue[0]));
        setEffectiveMax(Math.max(max, defaultValue[1]));
        prevLimitsRef.current = { min, max };
      }
    }, [defaultValue, min, max]);

    const roundToStep = (num: number): number => {
      const inverse = 1 / step;
      return Math.round(num * inverse) / inverse;
    };

    const handleSliderChange = React.useCallback(
      (newValue: number[]) => {
        const clampedValue: [number, number] = [
          roundToStep(Math.max(effectiveMin, Math.min(newValue[0], effectiveMax))),
          roundToStep(Math.min(effectiveMax, Math.max(newValue[1], effectiveMin))),
        ];
        setValue(clampedValue);
        setInputValues([clampedValue[0].toString(), clampedValue[1].toString()]);
        onValueChange?.(clampedValue);
      },
      [effectiveMin, effectiveMax, onValueChange, step]
    );

    const commitInputValue = React.useCallback(
      (index: 0 | 1) => {
        const parsedValue = Number(inputValues[index]);
        if (inputValues[index].trim() === '' || !Number.isFinite(parsedValue)) {
          return false;
        }

        const hardLimitedValue = Math.max(
          hardMin ?? -Infinity,
          Math.min(parsedValue, hardMax ?? Infinity)
        );
        const newValue: [number, number] = [...value];
        newValue[index] = roundToStep(hardLimitedValue);

        if (index === 0 && newValue[0] > newValue[1]) {
          newValue[1] = newValue[0];
        } else if (index === 1 && newValue[1] < newValue[0]) {
          newValue[0] = newValue[1];
        }

        setEffectiveMin(currentMin => Math.min(currentMin, newValue[0]));
        setEffectiveMax(currentMax => Math.max(currentMax, newValue[1]));
        setValue(newValue);
        setInputValues([newValue[0].toString(), newValue[1].toString()]);
        onValueChange?.(newValue);
        return true;
      },
      [hardMax, hardMin, inputValues, onValueChange, step, value]
    );

    const restorePreviousInputValue = React.useCallback(
      (index: 0 | 1) => {
        setInputValues(currentValues => {
          const nextValues: [string, string] = [...currentValues];
          nextValues[index] = value[index].toString();
          return nextValues;
        });
      },
      [value]
    );

    const handleInputBlur = React.useCallback(
      (index: 0 | 1) => {
        if (!commitInputValue(index)) {
          restorePreviousInputValue(index);
        }
      },
      [commitInputValue, restorePreviousInputValue]
    );

    const handleInputKeyDown = React.useCallback(
      (index: 0 | 1, event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          if (!commitInputValue(index)) {
            restorePreviousInputValue(index);
          }
        }
      },
      [commitInputValue, restorePreviousInputValue]
    );

    return (
      <div
        ref={ref}
        className={cn('flex w-full items-center space-x-2', className)}
      >
        {showNumberInputs && (
          <Input
            type="text"
            inputMode="decimal"
            value={inputValues[0]}
            onChange={event =>
              setInputValues(currentValues => [event.target.value, currentValues[1]])
            }
            onKeyDown={event => handleInputKeyDown(0, event)}
            onBlur={() => handleInputBlur(0)}
            className="w-14"
          />
        )}
        <SliderPrimitive.Root
          className="relative flex h-4 w-full touch-none select-none items-center"
          min={effectiveMin}
          max={effectiveMax}
          step={step}
          value={value}
          onValueChange={handleSliderChange}
        >
          <SliderPrimitive.Track className="bg-primary/30 relative h-1 w-full grow overflow-hidden rounded-full">
            <SliderPrimitive.Range className="bg-primary absolute h-full" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb className="border-background bg-primary focus-visible:ring-ring block h-4 w-4 rounded-full border-2 shadow transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50" />
          <SliderPrimitive.Thumb className="border-background bg-primary focus-visible:ring-ring block h-4 w-4 rounded-full border-2 shadow transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50" />
        </SliderPrimitive.Root>
        {showNumberInputs && (
          <Input
            type="text"
            inputMode="decimal"
            value={inputValues[1]}
            onChange={event =>
              setInputValues(currentValues => [currentValues[0], event.target.value])
            }
            onKeyDown={event => handleInputKeyDown(1, event)}
            onBlur={() => handleInputBlur(1)}
            className="w-14"
          />
        )}
      </div>
    );
  }
);
DoubleSlider.displayName = 'DoubleSlider';

export { DoubleSlider };
