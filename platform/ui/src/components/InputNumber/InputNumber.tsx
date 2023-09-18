import React, { useState, useCallback } from 'react';
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

const InputNumber: React.FC<{
  value: number;
  onChange: (value) => void;
  minValue?: number;
  maxValue?: number;
  step: number;
  size?: string;
  className?: string;
  labelClassName?: string;
  label?: string;
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
}) => {
  const [numberValue, setNumberValue] = useState(value);

  const handleMinMax = useCallback(
    (value: number) => {
      if (value > maxValue) {
        return maxValue;
      } else if (value < minValue) {
        return minValue;
      } else {
        return value;
      }
    },
    [maxValue, minValue]
  );

  const handleChange = useCallback(
    e => {
      const numberValue = handleMinMax(Number(e.target.value));
      setNumberValue(numberValue);
      onChange(numberValue);
    },
    [onChange, setNumberValue, handleMinMax]
  );

  const handleIncrement = useCallback(
    e => {
      const newNum = handleMinMax(Number(numberValue) + step);
      setNumberValue(newNum);
      onChange(newNum);
    },
    [onChange, setNumberValue, step, numberValue, handleMinMax]
  );

  const handleDecrement = useCallback(
    e => {
      const newNum = handleMinMax(Number(numberValue) - step);
      setNumberValue(newNum);
      onChange(newNum);
    },
    [onChange, setNumberValue, step, numberValue, handleMinMax]
  );

  return (
    <div className={'flex flex-1 flex-col'}>
      {label && (
        <Label
          className={labelClassName}
          text={label}
        ></Label>
      )}
      <div
        className={`border-secondary-light flex items-center justify-center overflow-hidden rounded-md border-2 bg-black px-1 ${
          sizesClasses[size]
        } ${className ? className : ''}`}
      >
        <div className="flex">
          <input
            type="text"
            value={numberValue}
            onChange={handleChange}
            className={`input-number w-full bg-black text-center text-[12px] text-white`}
          />

          <div className="up-arrowsize flex flex-col items-center justify-around">
            <IconButton
              id={'down-arrow-icon'}
              variant="text"
              color="inherit"
              size="initial"
              className="rotate-180 transform text-[#726f7e]"
              onClick={handleIncrement}
            >
              <Icon name="ui-arrow-down" />
            </IconButton>
            <IconButton
              id={'down-arrow-icon'}
              variant="text"
              color="inherit"
              size="initial"
              className="text-[#726f7e]"
              onClick={handleDecrement}
            >
              <Icon name="ui-arrow-down" />
            </IconButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputNumber;
