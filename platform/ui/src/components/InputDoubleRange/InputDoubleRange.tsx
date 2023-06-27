import React, { useState, useCallback, useEffect, useRef } from 'react';
import classNames from 'classnames';
import Typography from '../Typography';
import './InputDoubleRange.css';

/**
 * React Range Input component
 * it has two props, value and onChange
 * value is a number value
 * onChange is a function that will be called when the range input is changed
 *
 *
 */

const InputDoubleRange: React.FC<{
  valueLeft: number;
  valueRight: number;
  onSliderChange;
  minValue: number;
  maxValue: number;
  step: number;
  unit?: string;
  containerClassName?: string;
  inputClassName?: string;
  labelClassName?: string;
  labelVariant?: string;
  showLabel: boolean;
}> = ({
  valueLeft,
  valueRight,
  onSliderChange,
  minValue,
  maxValue,
  step = 1,
  unit = '',
  containerClassName,
  inputClassName,
  labelClassName,
  labelVariant,
  showLabel = true,
}) => {
  const [leftVal, setLeftVal] = useState(valueLeft);
  const [rightVal, setRightVal] = useState(valueRight);
  const rangeRef = useRef(null);

  // Convert to percentage
  const getPercent = useCallback(
    value => Math.round(((value - minValue) / (maxValue - minValue)) * 100),
    [minValue, maxValue]
  );

  function handleSliderChange(newValues) {
    console.log(newValues);
    onSliderChange(newValues);
  }

  // Get min and max values when their state changes
  useEffect(() => {
    handleSliderChange([leftVal, rightVal]);
  }, []);

  // Set width of the range
  useEffect(() => {
    const minPercent = getPercent(leftVal);
    const maxPercent = getPercent(rightVal);

    if (rangeRef.current) {
      rangeRef.current.style.left = `${minPercent}%`;
      rangeRef.current.style.width = `${maxPercent - minPercent}%`;
    }
  }, [leftVal, rightVal, getPercent]);

  const rangeValueLeftPercentage =
    ((leftVal - minValue) / (maxValue - minValue)) * 100;
  const rangeValueRightPercentage =
    ((rightVal - minValue) / (maxValue - minValue)) * 100;

  return (
    <div
      className={`items-center cursor-pointer space-x-1 ${
        containerClassName ? containerClassName : ''
      }`}
    >
      <input
        type="range"
        min={minValue}
        max={maxValue}
        value={leftVal}
        onChange={event => {
          const value = Math.min(Number(event.target.value), rightVal);
          setLeftVal(value);
          // leftValRef.current = value;
          handleSliderChange([value, rightVal]);
        }}
        className="appearance-none h-[3px] rounded-lg thumb thumb--left"
        style={{
          zIndex: leftVal > valueRight - 100 && '5',
          background: `linear-gradient(to right, #5acce6 0%, #5acce6 ${rangeValueLeftPercentage}%, #3a3f99 ${rangeValueLeftPercentage}%, #3a3f99 ${rangeValueLeftPercentage}%, #5acce6 ${rangeValueLeftPercentage}%, #5acce6 100%)`,
        }}
      />
      <input
        type="range"
        min={minValue}
        max={maxValue}
        value={rightVal}
        onChange={event => {
          const value = Math.max(Number(event.target.value), leftVal);
          setRightVal(value);
          // rightValRef.current = value;
          handleSliderChange([leftVal, value]);
        }}
        className="appearance-none h-[3px] rounded-lg thumb thumb--right"
        style={{
          background: `linear-gradient(to right, #5acce6 0%, #5acce6 ${rangeValueRightPercentage}%, #3a3f99 ${rangeValueRightPercentage}%, #3a3f99 ${rangeValueRightPercentage}%, #5acce6 ${rangeValueRightPercentage}%, #5acce6 100%)`,
        }}
      />
      <div className="slider">
        <div className="slider__track" />
        <div ref={rangeRef} className="slider__range" />
        <div
          className={classNames(
            labelClassName ?? 'text-white',
            'slider__left-value'
          )}
        >
          {leftVal}
        </div>
        <div
          className={classNames(
            labelClassName ?? 'text-white',
            'slider__right-value'
          )}
        >
          {rightVal}
        </div>
      </div>
    </div>
  );
};

export default InputDoubleRange;
