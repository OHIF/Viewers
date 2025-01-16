/*****************************************************
 * File: platform/ui-next/src/components/ToolSettings/InputRange.tsx
 *
 * Purpose:
 *   - A single-handle slider for numeric input, similar
 *     to the legacy "InputRange" in /platform/ui.
 *   - Supports an optional numeric input box and a label
 *     on the left or right side.
 *
 * Usage:
 *   <InputRange
 *     value={someNumber}
 *     onChange={val => console.log('new val:', val)}
 *     minValue={0}
 *     maxValue={100}
 *     step={1}
 *     label="Radius (mm)"
 *     showLabel={true}
 *     labelPosition="right"
 *     allowNumberEdit={true}
 *   />
 *
 *****************************************************/

import React, { useCallback, useState, useEffect } from 'react';
import { Slider } from '../Slider'; // from your Radix-based slider in ui-next
import { Input } from '../Input'; // from ui-next
import { Label } from '../Label'; // from ui-next

/** If you want consistent utility functions or class merges */
import { cn } from '../../lib/utils';

/**
 * InputRangeProps
 * ---------------
 * Below are typical props that mirror the old InputRange functionality.
 * Adjust or rename them as you see fit to match your codebase.
 */
interface InputRangeProps {
  /** Current slider value */
  value: number;
  /** Called when the slider value changes */
  onChange: (newValue: number) => void;

  /** Min/Max/Step for the slider track */
  minValue?: number;
  maxValue?: number;
  step?: number;

  /** Label text that appears next to the slider */
  label?: string;
  /** If true, show the label, else hide it */
  showLabel?: boolean;
  /** "left" or "right" - where to place the label or numeric input */
  labelPosition?: 'left' | 'right';

  /** If true, user can edit the numeric value in a text box */
  allowNumberEdit?: boolean;
  /** If true, we show the numeric input (and label) in the layout */
  showNumberInput?: boolean;

  /** Additional styling classes */
  className?: string;
  /** Additional styling for the container around the slider. */
  containerClassName?: string;
}

/**
 * InputRange
 * ----------
 * A single-handle slider + optional numeric text input + label.
 * This replicates the older logic from the legacy InputRange, but
 * uses `@radix-ui/react-slider` under the hood for the slider.
 */
export const InputRange: React.FC<InputRangeProps> = ({
  value,
  onChange,
  minValue = 0,
  maxValue = 100,
  step = 1,
  label = '',
  showLabel = false,
  labelPosition = 'right',
  allowNumberEdit = false,
  showNumberInput = true,
  className,
  containerClassName,
}) => {
  // Internal state mirrors the “value” prop so we can handle
  // immediate user input before calling onChange.
  const [internalValue, setInternalValue] = useState<number>(value);

  // Keep state in sync if parent changes "value" externally
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  /**
   * Called whenever the user drags the slider.
   * The Radix <Slider> uses an array of values, so we only have one handle: [internalValue].
   */
  const handleSliderChange = useCallback(
    (newValues: number[]) => {
      if (!newValues || newValues.length < 1) {
        return;
      }
      const [val] = newValues;
      setInternalValue(val);
      onChange?.(val);
    },
    [onChange]
  );

  /** For user-typed numeric input, clamp to [minValue, maxValue], step if desired */
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let typedVal = parseFloat(e.target.value);
    if (isNaN(typedVal)) {
      typedVal = minValue;
    }

    // Optional: clamp + step rounding logic
    typedVal = Math.max(minValue, Math.min(maxValue, typedVal));
    // if you'd like to enforce step intervals, do so here

    setInternalValue(typedVal);
    onChange?.(typedVal);
  };

  /**
   * Determine if we place the label & optional <Input> on the left or right
   * side of the slider. We'll create a small helper sub-component to render
   * the numeric input if "allowNumberEdit" is true, else just a read-only label.
   */
  const renderLabelOrNumberInput = () => {
    if (!showLabel && !showNumberInput) {
      return null;
    }

    // If user can edit numeric value:
    if (allowNumberEdit && showNumberInput) {
      return (
        <div className="flex items-center space-x-1">
          {showLabel && label && <Label className="mr-1">{label}</Label>}
          <Input
            type="number"
            value={internalValue}
            onChange={handleNumberChange}
            className="w-[60px]" // narrower text box
          />
        </div>
      );
    }

    // If user can't edit, but we still want to show a label:
    if (showLabel && label) {
      return (
        <Label>
          {label}: {internalValue}
        </Label>
      );
    }

    // Possibly show a read-only numeric value if you prefer:
    return <span>{internalValue}</span>;
  };

  /**
   * The UI layout:
   * We'll do something like:
   *   1) label/number input (left) -- slider -- (possibly label/number input right)
   * or
   *   slider -- label
   * We'll put them in a row, flex. We'll handle "left" vs "right" logic.
   */
  return (
    <div className={cn('flex items-center space-x-2', containerClassName)}>
      {/* If label is on the 'left', we render here */}
      {labelPosition === 'left' && renderLabelOrNumberInput()}

      {/* The Slider from Radix. We pass an array for the single handle. */}
      <Slider
        className={cn('w-full', className)}
        min={minValue}
        max={maxValue}
        step={step}
        value={[internalValue]}
        onValueChange={handleSliderChange}
      />

      {/* If label is on the 'right', we render here */}
      {labelPosition === 'right' && renderLabelOrNumberInput()}
    </div>
  );
};

export default InputRange;
