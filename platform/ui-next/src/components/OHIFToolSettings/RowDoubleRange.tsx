/**
 * File: platform/ui-next/src/components/ToolSettings/RowDoubleRange.tsx
 */

import React, { useEffect, useState } from 'react';
import { DoubleSlider } from '@ohif/ui-next';

/**
 * Props match the old InputDoubleRange usage in ToolSettings.tsx.
 * They ensure the new component can be a drop-in replacement.
 */
interface RowDoubleRangeProps {
  /**
   * The current range values [start, end].
   */
  values: [number, number];

  /**
   * Callback invoked whenever the range changes.
   */
  onChange: (values: [number, number]) => void;

  /**
   * Minimum slider value
   */
  minValue: number;

  /**
   * Maximum slider value
   */
  maxValue: number;

  /**
   * Slider step
   */
  step: number;

  /**
   * True if you want to show numeric inputs next to the slider (if desired).
   * This prop was used in InputDoubleRange, but you may or may not need it
   * depending on whether you want to allow editing the numbers directly.
   */
  showLabel?: boolean;

  /**
   * For completeness, you may keep additional props if you had them in InputDoubleRange
   * (labelPosition, labelClassName, containerClassName, etc.).
   * Omitted here if not strictly needed.
   */
  [key: string]: any;
}

/**
 * RowDoubleRange
 *
 * Replaces the old InputDoubleRange. Uses DoubleSlider from ui-next
 * to mimic the layout in your attached design screenshot.
 */
const RowDoubleRange: React.FC<RowDoubleRangeProps> = ({
  values,
  onChange,
  minValue,
  maxValue,
  step,
  showLabel = false,
  ...rest
}) => {
  const [currentValues, setCurrentValues] = useState<[number, number]>(values);

  // When parent re-renders with a new "values" prop, sync local state:
  useEffect(() => {
    setCurrentValues(values);
  }, [values]);

  // Handler for when slider thumbs move
  const handleSliderChange = (newValues: [number, number]) => {
    setCurrentValues(newValues);
    if (typeof onChange === 'function') {
      onChange(newValues);
    }
  };

  return (
    <div
      className="flex w-full flex-col space-y-2 py-2"
      {...rest}
    >
      {showLabel ? (
        <div className="text-sm text-white">
          <span>{currentValues[0]}</span> &mdash; <span>{currentValues[1]}</span>
        </div>
      ) : null}

      {/*
        The DoubleSlider already includes numeric inputs on the left and right.
        If you prefer those, great. If you want to hide them and just have thumbs,
        you can tweak DoubleSlider to do so.
      */}
      <DoubleSlider
        min={minValue}
        max={maxValue}
        step={step}
        defaultValue={currentValues}
        onValueChange={handleSliderChange}
      />
    </div>
  );
};

export default RowDoubleRange;
