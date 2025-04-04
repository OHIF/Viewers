import React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

import { cn } from '../../lib/utils';
import { Input } from '../Input';

interface DoubleSliderProps {
  className?: string;
  min: number;
  max: number;
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
      onValueChange,
      step = 1,
      defaultValue = [min, max],
      showNumberInputs = false,
    },
    ref
  ) => {
    const [value, setValue] = React.useState<[number, number]>(defaultValue);

    const prevDefaultValueRef = React.useRef<[number, number] | null>(null);

    const isInteger = step % 1 === 0;

    React.useEffect(() => {
      // Only update if defaultValue has actually changed
      if (
        !prevDefaultValueRef.current ||
        prevDefaultValueRef.current[0] !== defaultValue[0] ||
        prevDefaultValueRef.current[1] !== defaultValue[1]
      ) {
        setValue(defaultValue);
        prevDefaultValueRef.current = defaultValue;
      }
    }, [defaultValue]);

    const roundToStep = (num: number): number => {
      const inverse = 1 / step;
      return Math.round(num * inverse) / inverse;
    };

    const handleSliderChange = React.useCallback(
      (newValue: number[]) => {
        const clampedValue: [number, number] = [
          roundToStep(Math.max(min, Math.min(newValue[0], max))),
          roundToStep(Math.min(max, Math.max(newValue[1], min))),
        ];
        setValue(clampedValue);
        onValueChange?.(clampedValue);
      },
      [min, max, onValueChange, step]
    );

    const handleInputChange = React.useCallback(
      (index: 0 | 1, inputValue: string) => {
        const newValue = parseFloat(inputValue);
        if (!isNaN(newValue)) {
          const clampedValue: [number, number] = [...value];
          clampedValue[index] = roundToStep(Math.min(Math.max(newValue, min), max));
          if (index === 0 && clampedValue[0] > clampedValue[1]) {
            clampedValue[1] = clampedValue[0];
          } else if (index === 1 && clampedValue[1] < clampedValue[0]) {
            clampedValue[0] = clampedValue[1];
          }
          setValue(clampedValue);
          onValueChange?.(clampedValue);
        }
      },
      [value, min, max, onValueChange, step]
    );

    const formatValue = (val: number) => {
      return isInteger ? Math.round(val) : val;
    };

    return (
      <div
        ref={ref}
        className={cn('flex w-full items-center space-x-2', className)}
      >
        {showNumberInputs && (
          <Input
            type="number"
            value={formatValue(value[0])}
            onChange={e => handleInputChange(0, e.target.value)}
            onBlur={() => handleInputChange(0, value[0].toString())}
            className="w-14"
            min={min}
            max={max}
            step={step}
          />
        )}
        <SliderPrimitive.Root
          className="relative flex h-4 w-full touch-none select-none items-center"
          min={min}
          max={max}
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
            type="number"
            value={formatValue(value[1])}
            onChange={e => handleInputChange(1, e.target.value)}
            onBlur={() => handleInputChange(1, value[1].toString())}
            className="w-14"
            min={min}
            max={max}
            step={step}
          />
        )}
      </div>
    );
  }
);
DoubleSlider.displayName = 'DoubleSlider';

export { DoubleSlider };
