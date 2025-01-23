import React, { useEffect, useState } from 'react';
import { DoubleSlider } from '@ohif/ui-next';

interface RowDoubleRangeProps {
  values: [number, number];
  onChange: (values: [number, number]) => void;
  minValue: number;
  maxValue: number;
  step: number;
  showLabel?: boolean;
  [key: string]: any;
}

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

  useEffect(() => {
    setCurrentValues(values);
  }, [values]);

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
