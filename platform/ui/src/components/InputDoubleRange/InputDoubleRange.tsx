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
  // Set initial thumb positions as percentages
  const initialPercentageStart = Math.round(
    ((value[0] - minValue) / (maxValue - minValue)) * 100
  );
  const initialPercentageEnd = Math.round(
    ((value[1] - minValue) / (maxValue - minValue)) * 100
  );
  const [percentageStart, setPercentageStart] = useState(
    initialPercentageStart
  );
  const [percentageEnd, setPercentageEnd] = useState(initialPercentageEnd);

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
    const rect = e.currentTarget.getBoundingClientRect(); // Use currentTarget instead of target
    const x = e.clientX - rect.left;
    const percentageClicked = (x / rect.width) * 100;

    // Calculate the distances from the clicked point to both thumbs' positions
    const distanceToStartThumb = Math.abs(percentageClicked - percentageStart);
    const distanceToEndThumb = Math.abs(percentageClicked - percentageEnd);

    // Check if the clicked point is within a threshold distance to either thumb
    if (distanceToStartThumb < 10) {
      setSelectedThumb(0);
    } else if (distanceToEndThumb < 10) {
      setSelectedThumb(1);
    }
  };

  const handleMouseMove = e => {
    if (selectedThumb !== null) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const newValue =
        Math.round(
          ((x / rect.width) * (maxValue - minValue) + minValue) / step
        ) * step;

      // Make sure newValue is within [minValue, maxValue]
      const clampedValue = Math.min(Math.max(newValue, minValue), maxValue);

      // Ensure that left and right thumbs don't switch positions
      if (selectedThumb === 0 && clampedValue >= rangeValue[1]) {
        return;
      }
      if (selectedThumb === 1 && clampedValue <= rangeValue[0]) {
        return;
      }

      // Update the correct value in the rangeValue array
      const updatedRangeValue = [...rangeValue];
      updatedRangeValue[selectedThumb] = clampedValue;
      setRangeValue(updatedRangeValue);

      // No need to call onChange here, since we're updating local state

      // Update the thumb position
      const percentage = Math.round(
        ((clampedValue - minValue) / (maxValue - minValue)) * 100
      );
      if (selectedThumb === 0) {
        setPercentageStart(percentage);
      } else {
        setPercentageEnd(percentage);
      }
    }
  };

  const handleMouseUp = () => {
    setSelectedThumb(null);
  };

  // Calculate the range value percentages for gradient background
  const rangeValuePercentageStart =
    ((rangeValue[0] - minValue) / (maxValue - minValue)) * 100;
  const rangeValuePercentageEnd =
    ((rangeValue[1] - minValue) / (maxValue - minValue)) * 100;

  return (
    <div className={`flex items-center ${containerClassName ?? ''}`}>
      {showLabel &&
        labelPosition === 'left' &&
        LabelOrEditableNumber(rangeValue[0], 0)}
      <div
        className="flex w-full relative items-center"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div
          className="w-full h-[3px] rounded-lg"
          style={{
            background: `linear-gradient(to right, #3a3f99 0%, #3a3f99 ${rangeValuePercentageStart}%, #5acce6 ${rangeValuePercentageStart}%, #5acce6 ${rangeValuePercentageEnd}%, #3a3f99 ${rangeValuePercentageEnd}%, #3a3f99 100%)`,
          }}
        ></div>
        <div
          className="absolute h-2 w-2 cursor-pointer input-range-thumb-design"
          style={{
            left: `calc(${percentageStart}% - 3px)`,
          }}
        ></div>
        <div
          className="absolute h-2 w-2 rounded-full input-range-thumb-design"
          style={{ left: `calc(${percentageEnd}% - 3px)` }}
        ></div>
      </div>
      {showLabel &&
        labelPosition === 'right' &&
        LabelOrEditableNumber(rangeValue[1], 1)}
    </div>
  );
};

export default InputRange;
