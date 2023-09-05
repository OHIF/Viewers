import React, { useState, useCallback, useEffect } from 'react';
import IconButton from '../IconButton';
import Icon from '../Icon';
import './InputNumber.css';
import Label from '../Label';

/**
 *  React Number Input component'
 * it has two props, value and onChange
 * value is a number value
 * onChange is a function that will be called when the number input is changed
 * it can get changed by clicking on the up and down buttons
 * or by typing a number in the input
 */

const sizesClasses = {
  sm: 'w-[45px] h-[28px]',
  lg: 'w-[206px] h-[35px]',
};

const getMaxDigits = (maxValue: number, step: number) => {
  const integerDigits = maxValue.toString().length;
  const decimalDigits =
    step % 1 === 0 ? 0 : step.toString().split('.')[1].length;
  return integerDigits + (decimalDigits ? decimalDigits + 1 : 0);
};

const InputNumber: React.FC<{
  value: number;
  onChange: (value: number) => void;
  minValue?: number;
  maxValue?: number;
  step?: number;
  size?: 'sm' | 'lg';
  className?: string;
  labelClassName?: string;
  label?: string;
  showAdjustmentArrows?: boolean;
}> = ({
  value,
  onChange,
  step = 1,
  className,
  size = 'sm',
  minValue = 0,
  maxValue = 100,
  labelClassName,
  label,
  showAdjustmentArrows = true,
}) => {
  const [numberValue, setNumberValue] = useState(value);

  const maxDigits = getMaxDigits(maxValue, step);
  const inputWidth = Math.max(maxDigits * 10, showAdjustmentArrows ? 20 : 28);
  const arrowWidth = showAdjustmentArrows ? 20 : 0;
  const containerWidth = `${inputWidth + arrowWidth}px`;

  useEffect(() => {
    setNumberValue(value);
  }, [value]);

  const handleMinMax = useCallback(
    (val: number) => Math.min(Math.max(val, minValue), maxValue),
    [maxValue, minValue]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Allow negative sign or empty string for user flexibility
    if (inputValue === '-' || inputValue === '') {
      setNumberValue(inputValue);
      return;
    }

    const number = Number(inputValue);

    // Filter out invalid inputs like 'NaN'
    if (!isNaN(number)) {
      updateValue(number);
    }
  };

  const updateValue = (val: number) => {
    const newValue = handleMinMax(val);
    setNumberValue(newValue);
    onChange(newValue);
  };

  const increment = () => updateValue(numberValue + step);
  const decrement = () => updateValue(numberValue - step);

  return (
    <div className="flex flex-col flex-1">
      {label && <Label className={labelClassName} text={label} />}
      <div
        className={`border-secondary-light flex items-center justify-center overflow-hidden rounded-md border-2 bg-black px-1 ${
          sizesClasses[size]
        } ${className || ''}`}
        style={{ width: containerWidth }}
      >
        <div className="flex">
          <input
            type="text"
            value={numberValue}
            onChange={handleChange}
            className={
              'bg-black text-white text-[12px] w-full text-center input-number'
            }
            style={{ width: inputWidth }}
          />
          {showAdjustmentArrows && (
            <div className="up-arrowsize flex flex-col items-center justify-around">
              <ArrowButton onClick={increment} rotate />
              <ArrowButton onClick={decrement} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ArrowButton = ({
  onClick,
  rotate = false,
}: {
  onClick: () => void;
  rotate?: boolean;
}) => (
  <IconButton
    id="arrow-icon"
    variant="text"
    color="inherit"
    size="initial"
    className={`text-[#726f7e] ${rotate ? 'transform rotate-180' : ''}`}
    onClick={onClick}
  >
    <Icon name="ui-arrow-down" />
  </IconButton>
);

export default InputNumber;
