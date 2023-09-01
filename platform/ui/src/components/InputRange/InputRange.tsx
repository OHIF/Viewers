import React, { useState, useCallback, useEffect } from 'react';
import classNames from 'classnames';
import Typography from '../Typography';
import './InputRange.css';

/**
 * React Range Input component
 * it has two props, value and onChange
 * value is a number value
 * onChange is a function that will be called when the range input is changed
 *
 *
 */

const InputRange: React.FC<{
  value: number;
  onChange: (value) => void;
  minValue: number;
  maxValue: number;
  step: number;
  unit?: string;
  containerClassName?: string;
  inputClassName?: string;
  labelClassName?: string;
  labelVariant?: string;
  showLabel?: boolean;
  labelPosition?: string;
  trackColor?: string;
}> = ({
  value,
  onChange,
  minValue,
  maxValue,
  step = 1,
  unit = '',
  containerClassName,
  inputClassName,
  labelClassName,
  labelVariant,
  showLabel = true,
  labelPosition = '',
  trackColor,
}) => {
  const [rangeValue, setRangeValue] = useState(value);

  // Allow for the value property to update the range value.
  useEffect(() => setRangeValue(value), [value]);

  const handleChange = useCallback(
    e => {
      const rangeValue = Number(e.target.value);
      setRangeValue(rangeValue);
      onChange(rangeValue);
    },
    [onChange, setRangeValue]
  );

  const rangeValuePercentage = ((rangeValue - minValue) / (maxValue - minValue)) * 100;

  const rangeValueForStr = step >= 1 ? rangeValue.toFixed(0) : rangeValue.toFixed(1);

  return (
    <div
      className={`flex cursor-pointer items-center space-x-1 ${
        containerClassName ? containerClassName : ''
      }`}
    >
      {showLabel && labelPosition === 'left' && (
        <Typography
          variant={labelVariant ?? 'subtitle'}
          component="p"
          className={classNames('w-8', labelClassName ?? 'text-white')}
        >
          {rangeValueForStr}
          {unit}
        </Typography>
      )}
      <input
        type="range"
        min={minValue}
        max={maxValue}
        value={rangeValue}
        className={`input-range-thumb-design h-[3px] appearance-none rounded-lg ${
          inputClassName ? inputClassName : ''
        }`}
        style={{
          background:
            trackColor ||
            `linear-gradient(to right, #5acce6 0%, #5acce6 ${rangeValuePercentage - 10}%, #3a3f99 ${
              rangeValuePercentage + 10
            }%, #3a3f99 100%)`,
        }}
        onChange={handleChange}
        id="myRange"
        step={step}
      />
      {showLabel && (!labelPosition || labelPosition === 'right') && (
        <Typography
          variant={labelVariant ?? 'subtitle'}
          component="p"
          className={classNames('w-8', labelClassName ?? 'text-white')}
        >
          {rangeValueForStr}
          {unit}
        </Typography>
      )}
    </div>
  );
};

export default InputRange;
