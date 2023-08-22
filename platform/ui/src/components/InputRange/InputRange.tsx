import React, { useState, useCallback, useEffect } from 'react';
import classNames from 'classnames';
import { Typography, InputNumber } from '../../components';
import './InputRange.css';

/**
 * React Range Input component
 * it has two props, value and onChange
 * value is a number value
 * onChange is a function that will be called when the range input is changed
 *
 *
 */
type InputRangeProps = {
  value: number;
  onChange: (value: number) => void;
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
  allowNumberEdit?: boolean;
  showNumberEditArrows?: boolean;
};

const Label: React.FC<{
  value: number;
  unit: string;
  className?: string;
  variant?: string;
}> = ({ value, unit, className, variant }) => (
  <Typography
    variant={variant ?? 'subtitle'}
    component="p"
    className={classNames('w-8', className ?? 'text-white')}
  >
    {value.toFixed(value >= 1 ? 0 : 1)}
    {unit}
  </Typography>
);

const InputRange: React.FC<InputRangeProps> = ({
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
  labelPosition = 'right',
  trackColor,
  allowNumberEdit = false,
  showNumberEditArrows = true,
}) => {
  const [rangeValue, setRangeValue] = useState(value);

  useEffect(() => setRangeValue(value), [value]);

  const handleChange = useCallback(
    e => {
      const val = Number(e.target.value);
      setRangeValue(val);
      onChange(val);
    },
    [onChange]
  );

  const rangeValuePercentage =
    ((rangeValue - minValue) / (maxValue - minValue)) * 100;

  const inputStyle = {
    background:
      trackColor ||
      `linear-gradient(to right, #5acce6 0%, #5acce6 ${rangeValuePercentage -
        10}%, #3a3f99 ${rangeValuePercentage + 10}%, #3a3f99 100%)`,
  };

  const LabelOrEditableNumber = allowNumberEdit ? (
    <InputNumber
      minValue={minValue}
      maxValue={maxValue}
      value={rangeValue}
      onChange={val => {
        setRangeValue(val);
        onChange(val);
      }}
      step={step}
      showUpAndDownArrows={showNumberEditArrows}
    />
  ) : (
    <Label
      value={rangeValue}
      unit={unit}
      className={labelClassName}
      variant={labelVariant}
    />
  );

  return (
    <div
      className={`flex items-center cursor-pointer ${containerClassName ?? ''}`}
    >
      <div className="input-range-wrapper flex items-center w-full">
        {showLabel && labelPosition === 'left' && LabelOrEditableNumber}
        <input
          type="range"
          min={minValue}
          max={maxValue}
          value={rangeValue}
          className={`appearance-none h-[3px] rounded-lg input-range-thumb-design ${inputClassName ??
            ''}`}
          style={inputStyle}
          onChange={handleChange}
          id="myRange"
          step={step}
        />
        <div className="ml-2">
          {showLabel && labelPosition === 'right' && LabelOrEditableNumber}
        </div>
      </div>
    </div>
  );
};

export default InputRange;
