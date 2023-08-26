import React, { useState, useCallback, useEffect } from 'react';
import classNames from 'classnames';
import { InputNumber } from '../../components'; // Import InputNumber component
import './InputDoubleRange.css';

type InputRangeProps = {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  // ... (rest of the props)
};

const InputRange: React.FC<InputRangeProps> = ({
  value,
  onChange,
  minValue,
  maxValue,
  step,
  unit,
  containerClassName,
  inputClassName,
  labelClassName,
  labelVariant,
  showLabel,
  labelPosition,
  trackColor,
  allowNumberEdit,
  showAdjustmentArrows,
}) => {
  const [rangeValue, setRangeValue] = useState(value);
  console.debug('🚀 ~ rangeValue:', rangeValue);

  useEffect(() => {
    setRangeValue(value);
  }, [value]);

  const handleChange = useCallback(
    (index, e) => {
      const updatedRangeValue = [...rangeValue];
      updatedRangeValue[index] = Number(e.target.value);
      setRangeValue(updatedRangeValue);
      onChange(updatedRangeValue);
    },
    [rangeValue, onChange]
  );

  const percentageStart =
    ((rangeValue[0] - minValue) / (maxValue - minValue)) * 100;
  const percentageEnd =
    ((rangeValue[1] - minValue) / (maxValue - minValue)) * 100;

  const LabelOrEditableNumber = (val, index) =>
    allowNumberEdit ? (
      <InputNumber
        minValue={minValue}
        maxValue={maxValue}
        value={val}
        onChange={newValue => {
          const updatedRangeValue = [...rangeValue];
          updatedRangeValue[index] = newValue;
          setRangeValue(updatedRangeValue);
          onChange(updatedRangeValue);
        }}
        step={step}
        showAdjustmentArrows={showAdjustmentArrows}
      />
    ) : (
      <span className={classNames(labelClassName ?? 'text-white')}>
        {val}
        {unit}
      </span>
    );

  const [selectedThumb, setSelectedThumb] = useState(null);

  const handleMouseDown = e => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentageClicked = (x / rect.width) * 100;

    if (
      Math.abs(percentageClicked - percentageStart) <
      Math.abs(percentageClicked - percentageEnd)
    ) {
      setSelectedThumb(0);
    } else {
      setSelectedThumb(1);
    }
  };

  const handleMouseMove = e => {
    if (selectedThumb !== null) {
      const rect = e.target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      let newValue = (x / rect.width) * (maxValue - minValue) + minValue;

      // Quantize to the nearest step.
      newValue = Math.round(newValue / step) * step;

      // Make sure newValue is within [minValue, maxValue]
      newValue = Math.min(Math.max(newValue, minValue), maxValue);

      handleChange(selectedThumb, { target: { value: newValue } });
    }
  };

  const handleMouseUp = () => {
    setSelectedThumb(null);
  };

  return (
    <div className={`flex items-center ${containerClassName ?? ''}`}>
      {showLabel &&
        labelPosition === 'left' &&
        LabelOrEditableNumber(rangeValue[0], 0)}
      <div
        className="w-full relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div className="absolute z-2">
          <input
            type="range"
            min={minValue}
            max={maxValue}
            value={rangeValue[0]}
            className={` absolute appearance-none h-[3px] rounded-lg input-range-thumb-design ${inputClassName ??
              ''}`}
            step={step}
            style={{
              background: `linear-gradient(to right, #3a3f99 0%, #3a3f99 ${percentageStart}%, #5acce6 ${percentageStart}%, #5acce6 ${percentageEnd}%, #3a3f99 ${percentageEnd}%, #3a3f99 100%)`,
            }}
          />
        </div>
        <div className="absolute z-2">
          <input
            type="range"
            min={minValue}
            max={maxValue}
            value={rangeValue[1]}
            className={` absolute appearance-none h-[3px] rounded-lg input-range-thumb-design ${inputClassName ??
              ''}`}
            step={step}
            style={{
              background: `linear-gradient(to right, #3a3f99 0%, #3a3f99 ${percentageStart}%, #5acce6 ${percentageStart}%, #5acce6 ${percentageEnd}%, #3a3f99 ${percentageEnd}%, #3a3f99 100%)`,
            }}
          />
        </div>
      </div>
      {showLabel &&
        labelPosition === 'right' &&
        LabelOrEditableNumber(rangeValue[1], 1)}
    </div>
  );
};

export default InputRange;
