import React, { useState, useCallback } from 'react';
import IconButton from '../IconButton';
import Icon from '../Icon';
import './InputNumber.css';

/**
 * React Number Input component'
 * it has two props, value and onChange
 * value is a number value
 * onChange is a function that will be called when the number input is changed
 * it can get changed by clicking on the up and down buttons
 * or by typing a number in the input
 */

const sizesClasses = {
  sm: 'w-[45px] h-[28px]',
};

const InputNumber: React.FC<{
  value: number;
  onChange: (value) => void;
  minValue?: number;
  maxValue?: number;
  step: number;
  size?: string;
  className?: string;
}> = ({
  value,
  onChange,
  step = 1,
  className,
  size = 'sm',
  minValue = 0,
  maxValue = 100,
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
    <div
      className={`flex items-center bg-black border-2 px-1 overflow-hidden justify-center border-secondary-light rounded-md ${sizesClasses[size]
        } ${className ? className : ''}`}
    >
      <div className="flex">
        <input
          type="text"
          value={numberValue}
          onChange={handleChange}
          className={`bg-black text-white text-[12px] w-full text-center input-number`}
        />

        <div className="up-arrowsize flex flex-col items-center justify-around">
          <IconButton
            id={'down-arrow-icon'}
            variant="text"
            color="inherit"
            size="initial"
            className="text-[#726f7e] transform rotate-180"
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
  );
};

export default InputNumber;
