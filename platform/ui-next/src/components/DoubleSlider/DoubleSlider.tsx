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
  lockMode?: boolean;
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
      lockMode = false,
    },
    ref
  ) => {
    const [value, setValue] = React.useState<[number, number]>(defaultValue);
    const trackRef = React.useRef<HTMLDivElement>(null);
    const dragStateRef = React.useRef<{
      startX: number;
      startValue: [number, number];
      rangeWidth: number;
      trackLeft: number;
      trackWidth: number;
    } | null>(null);

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

    const handleRangePointerDown = (event: React.PointerEvent) => {
      if (!lockMode) {
        return;
      }
      event.preventDefault();
      const rect = trackRef.current!.getBoundingClientRect();
      dragStateRef.current = {
        startX: event.clientX,
        startValue: [...value] as [number, number],
        rangeWidth: value[1] - value[0],
        trackLeft: rect.left,
        trackWidth: rect.width,
      };
      window.addEventListener('pointermove', handleRangePointerMove);
      window.addEventListener('pointerup', handleRangePointerUp, { once: true });
    };

    const handleRangePointerMove = (event: PointerEvent) => {
      const state = dragStateRef.current;
      if (!state) {
        return;
      }
      const { startX, startValue, rangeWidth, trackWidth } = state;
      const dxPx = event.clientX - startX;
      const pct = dxPx / trackWidth;
      const delta = pct * (max - min);

      let newLeft = startValue[0] + delta;
      let newRight = newLeft + rangeWidth;

      // clamp to bounds
      if (newLeft < min) {
        newLeft = min;
        newRight = min + rangeWidth;
      } else if (newRight > max) {
        newRight = max;
        newLeft = max - rangeWidth;
      }

      const clampedLeft = roundToStep(newLeft);
      const clampedRight = roundToStep(newRight);
      setValue([clampedLeft, clampedRight]);
      onValueChange?.([clampedLeft, clampedRight]);
    };

    const handleRangePointerUp = () => {
      dragStateRef.current = null;
      window.removeEventListener('pointermove', handleRangePointerMove);
    };

    const handleSliderChange = React.useCallback(
      (newValue: number[]) => {
        // Default behavior (no lock mode)
        if (!lockMode) {
          const clampedValue: [number, number] = [
            roundToStep(Math.max(min, Math.min(newValue[0], max))),
            roundToStep(Math.min(max, Math.max(newValue[1], min))),
          ];
          setValue(clampedValue);
          onValueChange?.(clampedValue);
          return;
        }

        // Lock mode behavior
        // First, determine if this is a symmetric expansion/contraction or a range shift
        // by checking which thumb(s) moved
        const isLeftThumbMoved = newValue[0] !== value[0];
        const isRightThumbMoved = newValue[1] !== value[1];

        // Case 1: Left thumb moved, right thumb needs to move symmetrically (opposite)
        if (isLeftThumbMoved && !isRightThumbMoved) {
          const delta = newValue[0] - value[0];
          const centerPoint = (value[0] + value[1]) / 2;

          // Symmetric movement: move right thumb in opposite direction
          const newRight = value[1] - delta;

          // Ensure values stay within bounds
          const clampedLeft = roundToStep(Math.max(min, Math.min(newValue[0], max)));
          const clampedRight = roundToStep(Math.min(max, Math.max(newRight, min)));

          // Special case: If right would go out of bounds, adjust left too to maintain center
          if (newRight !== clampedRight) {
            // Calculate new delta given the clamped right value
            const adjustedDelta = value[1] - clampedRight;
            // Apply same delta to left but in opposite direction
            const adjustedLeft = value[0] + adjustedDelta;
            const finalClampedLeft = roundToStep(Math.max(min, Math.min(adjustedLeft, max)));

            const finalValues: [number, number] = [finalClampedLeft, clampedRight];
            setValue(finalValues);
            onValueChange?.(finalValues);
            return;
          }

          const finalValues: [number, number] = [clampedLeft, clampedRight];
          setValue(finalValues);
          onValueChange?.(finalValues);
          return;
        }

        // Case 2: Right thumb moved, left thumb needs to move symmetrically (opposite)
        if (!isLeftThumbMoved && isRightThumbMoved) {
          const delta = newValue[1] - value[1];
          const centerPoint = (value[0] + value[1]) / 2;

          // Symmetric movement: move left thumb in opposite direction
          const newLeft = value[0] - delta;

          // Ensure values stay within bounds
          const clampedRight = roundToStep(Math.min(max, Math.max(newValue[1], min)));
          const clampedLeft = roundToStep(Math.max(min, Math.min(newLeft, max)));

          // Special case: If left would go out of bounds, adjust right too to maintain center
          if (newLeft !== clampedLeft) {
            // Calculate new delta given the clamped left value
            const adjustedDelta = value[0] - clampedLeft;
            // Apply same delta to right but in opposite direction
            const adjustedRight = value[1] + adjustedDelta;
            const finalClampedRight = roundToStep(Math.min(max, Math.max(adjustedRight, min)));

            const finalValues: [number, number] = [clampedLeft, finalClampedRight];
            setValue(finalValues);
            onValueChange?.(finalValues);
            return;
          }

          const finalValues: [number, number] = [clampedLeft, clampedRight];
          setValue(finalValues);
          onValueChange?.(finalValues);
          return;
        }

        // Case 3: Both thumbs moved (range shift) - maintain the same distance between thumbs
        if (isLeftThumbMoved && isRightThumbMoved) {
          const rangeWidth = value[1] - value[0];

          // Calculate how much the left thumb moved
          const leftDelta = newValue[0] - value[0];

          // New values maintaining the same range width
          let newLeft = newValue[0];
          let newRight = newLeft + rangeWidth;

          // Handle bounds checking
          if (newRight > max) {
            newRight = max;
            newLeft = newRight - rangeWidth;
          }

          if (newLeft < min) {
            newLeft = min;
            newRight = newLeft + rangeWidth;
          }

          const clampedValues: [number, number] = [
            roundToStep(Math.max(min, Math.min(newLeft, max))),
            roundToStep(Math.min(max, Math.max(newRight, min))),
          ];

          setValue(clampedValues);
          onValueChange?.(clampedValues);
          return;
        }

        // Fallback to default behavior
        const clampedValue: [number, number] = [
          roundToStep(Math.max(min, Math.min(newValue[0], max))),
          roundToStep(Math.min(max, Math.max(newValue[1], min))),
        ];
        setValue(clampedValue);
        onValueChange?.(clampedValue);
      },
      [min, max, onValueChange, step, value, lockMode]
    );

    const handleInputChange = React.useCallback(
      (index: 0 | 1, inputValue: string) => {
        const newValue = parseFloat(inputValue);
        if (!isNaN(newValue)) {
          // Default behavior (no lock mode)
          if (!lockMode) {
            const clampedValue: [number, number] = [...value];
            clampedValue[index] = roundToStep(Math.min(Math.max(newValue, min), max));
            if (index === 0 && clampedValue[0] > clampedValue[1]) {
              clampedValue[1] = clampedValue[0];
            } else if (index === 1 && clampedValue[1] < clampedValue[0]) {
              clampedValue[0] = clampedValue[1];
            }
            setValue(clampedValue);
            onValueChange?.(clampedValue);
            return;
          }

          // Lock mode behavior
          const centerPoint = (value[0] + value[1]) / 2;
          const rangeWidth = value[1] - value[0];
          const clampedValue: [number, number] = [...value];

          // Calculate new value with constraints
          const boundedNewValue = roundToStep(Math.min(Math.max(newValue, min), max));

          if (index === 0) {
            // Left thumb changed
            const delta = boundedNewValue - value[0];

            // Symmetric change: move right thumb in opposite direction
            const newRight = value[1] - delta;
            const boundedNewRight = roundToStep(Math.min(Math.max(newRight, min), max));

            // If right would go out of bounds, adjust left too
            if (newRight !== boundedNewRight) {
              // Adjust to maintain the same width but respect bounds
              if (boundedNewRight === max) {
                clampedValue[0] = roundToStep(Math.max(max - rangeWidth, min));
                clampedValue[1] = max;
              } else if (boundedNewRight === min) {
                clampedValue[0] = min;
                clampedValue[1] = roundToStep(Math.min(min + rangeWidth, max));
              }
            } else {
              clampedValue[0] = boundedNewValue;
              clampedValue[1] = boundedNewRight;
            }
          } else {
            // Right thumb changed
            const delta = boundedNewValue - value[1];

            // Symmetric change: move left thumb in opposite direction
            const newLeft = value[0] - delta;
            const boundedNewLeft = roundToStep(Math.min(Math.max(newLeft, min), max));

            // If left would go out of bounds, adjust right too
            if (newLeft !== boundedNewLeft) {
              // Adjust to maintain the same width but respect bounds
              if (boundedNewLeft === min) {
                clampedValue[0] = min;
                clampedValue[1] = roundToStep(Math.min(min + rangeWidth, max));
              } else if (boundedNewLeft === max) {
                clampedValue[0] = roundToStep(Math.max(max - rangeWidth, min));
                clampedValue[1] = max;
              }
            } else {
              clampedValue[0] = boundedNewLeft;
              clampedValue[1] = boundedNewValue;
            }
          }

          setValue(clampedValue);
          onValueChange?.(clampedValue);
        }
      },
      [value, min, max, onValueChange, step, lockMode]
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
          <SliderPrimitive.Track
            ref={trackRef}
            className="bg-primary/30 relative h-1 w-full grow overflow-hidden rounded-full"
          >
            <SliderPrimitive.Range
              className={cn('bg-primary absolute h-full', lockMode && 'cursor-grab')}
              onPointerDown={handleRangePointerDown}
            />
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
