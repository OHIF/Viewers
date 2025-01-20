import React, { useState, useCallback, useEffect } from 'react';
import IconButton from '../IconButton';
import Icon from '../Icon';
import './InputNumber.css';
import Label from '../Label';
import getMaxDigits from '../../utils/getMaxDigits';

const arrowHorizontalClassName =
  'cursor-pointer text-primary-active active:text-primary-light hover:opacity-70 w-4 flex items-center justify-center';

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
  md: 'w-[58px] h-[28px]',
  lg: 'w-[206px] h-[35px]',
};

const InputNumber: React.FC<{
  value: number;
  onChange: (value: number) => void;
  minValue?: number;
  maxValue?: number;
  step?: number;
  size?: 'sm' | 'lg' | 'md';
  className?: string;
  labelClassName?: string;
  label?: string;
  showAdjustmentArrows?: boolean;
  arrowsDirection: 'vertical' | 'horizontal';
  labelPosition?: 'left' | 'bottom' | 'right' | 'top';
  inputClassName?: string;
  sizeClassName?: string;
  inputContainerClassName?: string;
}> = ({
  value,
  onChange,
  step = 1,
  className,
  size = 'sm',
  minValue = 0,
  maxValue = 100,
  labelClassName = 'text-aqua-pale text-[11px] mx-auto',
  label,
  showAdjustmentArrows = true,
  arrowsDirection = 'vertical',
  labelPosition = 'left',
  inputClassName = 'text-white bg-primary-dark text-[14px]',
  sizeClassName,
  inputContainerClassName = 'bg-primary-dark border-secondary-light border rounded-[4px]',
}) => {
  const [numberValue, setNumberValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  const maxDigits = getMaxDigits(maxValue, step);
  const inputWidth = Math.max(maxDigits * 10, showAdjustmentArrows ? 20 : 28);
  const decimalPlaces = Number.isInteger(step) ? 0 : step.toString().split('.')[1].length;

  const sizeToUse = sizeClassName ? sizeClassName : sizesClasses[size];

  useEffect(() => {
    setNumberValue(value);
  }, [value]);

  const handleMinMax = useCallback(
    (val: number) => Math.min(Math.max(val, minValue), maxValue),
    [maxValue, minValue]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Allow negative sign, empty string, or single decimal point for user flexibility
    if (inputValue === '-' || inputValue === '' || inputValue === '.') {
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

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setNumberValue(parseFloat(numberValue).toFixed(decimalPlaces));
  };

  const increment = () => updateValue(parseFloat(numberValue) + step);
  const decrement = () => updateValue(parseFloat(numberValue) - step);

  const labelElement = label && (
    <Label
      className={labelClassName}
      text={label}
    />
  );

  return (
    <div
      className={`flex overflow-hidden ${className} ${labelPosition === 'top' || labelPosition === 'bottom' ? 'flex-col' : 'flex-row'}`}
    >
      {label && labelPosition === 'left' && labelElement}
      {label && labelPosition === 'top' && labelElement}
      <div
        className={`flex flex-grow items-center overflow-hidden ${sizeToUse} ${inputContainerClassName}`}
      >
        <div className="flex w-full">
          {showAdjustmentArrows && arrowsDirection === 'horizontal' && (
            <div
              className={arrowHorizontalClassName}
              onClick={() => decrement()}
            >
              <Icon name="arrow-left-small" />
            </div>
          )}
          <input
            type="number"
            value={isFocused ? numberValue : parseFloat(numberValue).toFixed(decimalPlaces)}
            step={step}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            className={`input-number ${inputClassName} w-full flex-grow text-center`}
            style={{ width: inputWidth }}
          />
          {showAdjustmentArrows && arrowsDirection === 'horizontal' && (
            <div
              className={arrowHorizontalClassName}
              onClick={() => increment()}
            >
              <Icon name="arrow-right-small" />
            </div>
          )}
          {showAdjustmentArrows && arrowsDirection === 'vertical' && (
            <div className="up-arrowsize ml-auto flex flex-shrink-0 flex-col items-center justify-around pr-1">
              <ArrowButton
                onClick={increment}
                rotate
              />
              <ArrowButton onClick={decrement} />
            </div>
          )}
        </div>
      </div>
      {label && labelPosition === 'right' && labelElement}
      {label && labelPosition === 'bottom' && labelElement}
    </div>
  );
};

const ArrowButton = ({ onClick, rotate = false }: { onClick: () => void; rotate?: boolean }) => (
  <IconButton
    id="arrow-icon"
    variant="text"
    color="inherit"
    size="initial"
    className={`text-[#726f7e] ${rotate ? 'rotate-180 transform' : ''}`}
    onClick={onClick}
  >
    <Icon name="ui-arrow-down" />
  </IconButton>
);

export default InputNumber;
