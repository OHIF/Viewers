import React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

import { cn } from '../../lib/utils';
import { Input } from '../Input';

interface DoubleSliderProps {
  className?: string;
  min: number;
  max: number;
  allowTypedExpansion?: boolean | [number, number];
  step?: number;
  defaultValue?: [number, number];
  onValueChange?: (value: [number, number]) => void;
  showNumberInputs?: boolean;
}

const DoubleSlider = ({
  className,
  min,
  max,
  allowTypedExpansion = false,
  onValueChange,
  step = 1,
  defaultValue = [min, max],
  showNumberInputs = false,
  ref,
}: DoubleSliderProps & { ref?: React.Ref<HTMLDivElement> }) => {
  const [value, setValue] = React.useState<[number, number]>(defaultValue);
  const [inputValues, setInputValues] = React.useState<[string, string]>([
    defaultValue[0].toString(),
    defaultValue[1].toString(),
  ]);
  const [sliderMin, setSliderMin] = React.useState(() => Math.min(min, defaultValue[0]));
  const [sliderMax, setSliderMax] = React.useState(() => Math.max(max, defaultValue[1]));

  // Adjust prop-derived state during render so React retries before committing stale values.
  // See https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevDefaultValue, setPrevDefaultValue] = React.useState(defaultValue);
  const [prevLimits, setPrevLimits] = React.useState({ min, max });

  let nextSliderMin = sliderMin;
  let nextSliderMax = sliderMax;

  if (prevLimits.min !== min || prevLimits.max !== max) {
    setPrevLimits({ min, max });
    nextSliderMin = min;
    nextSliderMax = max;
  }

  if (prevDefaultValue[0] !== defaultValue[0] || prevDefaultValue[1] !== defaultValue[1]) {
    setPrevDefaultValue(defaultValue);
    setValue(defaultValue);
    setInputValues([defaultValue[0].toString(), defaultValue[1].toString()]);
    nextSliderMin = Math.min(nextSliderMin, defaultValue[0]);
    nextSliderMax = Math.max(nextSliderMax, defaultValue[1]);
  }

  if (nextSliderMin !== sliderMin) {
    setSliderMin(nextSliderMin);
  }
  if (nextSliderMax !== sliderMax) {
    setSliderMax(nextSliderMax);
  }

  const roundToStep = (num: number): number => {
    const inverse = 1 / step;
    return Math.round(num * inverse) / inverse;
  };

  const handleSliderChange = (newValue: number[]) => {
    const clampedValue: [number, number] = [
      roundToStep(Math.max(sliderMin, Math.min(newValue[0], sliderMax))),
      roundToStep(Math.min(sliderMax, Math.max(newValue[1], sliderMin))),
    ];
    setValue(clampedValue);
    setInputValues([clampedValue[0].toString(), clampedValue[1].toString()]);
    onValueChange?.(clampedValue);
  };

  const commitInputValue = (index: 0 | 1) => {
    const inputValue = inputValues[index].trim();

    if (inputValue === '') {
      const newValue: [number, number] = [...value];
      newValue[index] = index === 0 ? min : max;

      if (index === 0 && newValue[0] > newValue[1]) {
        newValue[1] = newValue[0];
      } else if (index === 1 && newValue[1] < newValue[0]) {
        newValue[0] = newValue[1];
      }

      if (index === 0) {
        setSliderMin(min);
      } else {
        setSliderMax(max);
      }
      setValue(newValue);
      setInputValues([newValue[0].toString(), newValue[1].toString()]);
      onValueChange?.(newValue);
      return true;
    }

    const parsedValue = Number(inputValue);
    if (!Number.isFinite(parsedValue)) {
      return false;
    }

    const [inputMin, inputMax] = Array.isArray(allowTypedExpansion)
      ? allowTypedExpansion
      : allowTypedExpansion
        ? [-Infinity, Infinity]
        : [min, max];
    const hardLimitedValue = Math.max(inputMin, Math.min(parsedValue, inputMax));
    const newValue: [number, number] = [...value];
    const roundedValue = roundToStep(hardLimitedValue);
    newValue[index] = Math.max(inputMin, Math.min(roundedValue, inputMax));

    if (index === 0 && newValue[0] > newValue[1]) {
      newValue[1] = newValue[0];
    } else if (index === 1 && newValue[1] < newValue[0]) {
      newValue[0] = newValue[1];
    }

    setSliderMin(currentMin => Math.min(currentMin, newValue[0]));
    setSliderMax(currentMax => Math.max(currentMax, newValue[1]));
    setValue(newValue);
    setInputValues([newValue[0].toString(), newValue[1].toString()]);
    onValueChange?.(newValue);
    return true;
  };

  const restorePreviousInputValue = (index: 0 | 1) => {
    setInputValues(currentValues => {
      const nextValues: [string, string] = [...currentValues];
      nextValues[index] = value[index].toString();
      return nextValues;
    });
  };

  const handleInputBlur = (index: 0 | 1) => {
    if (!commitInputValue(index)) {
      restorePreviousInputValue(index);
    }
  };

  const handleInputKeyDown = (index: 0 | 1, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) {
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      if (!commitInputValue(index)) {
        restorePreviousInputValue(index);
      }
    }
  };

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
        min={sliderMin}
        max={sliderMax}
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
};
DoubleSlider.displayName = 'DoubleSlider';

export { DoubleSlider };
