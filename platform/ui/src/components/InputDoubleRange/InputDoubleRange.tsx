import React, { useState, useCallback, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { InputNumber } from '../../components'; // Import InputNumber component
import './InputDoubleRange.css';

type InputDoubleRangeProps = {
  values: [number, number];
  onChange: (values: [number, number]) => void;
  minValue?: number;
  maxValue?: number;
  step?: number;
  unit?: string;
  containerClassName?: string;
  inputClassName?: string;
  labelClassName?: string;
  labelVariant?: string;
  showLabel?: boolean;
  labelPosition?: 'left' | 'right';
  trackColor?: string;
  allowNumberEdit?: boolean;
  showAdjustmentArrows?: boolean;
};

const InputDoubleRange: React.FC<InputDoubleRangeProps> = ({
  values,
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
  const initialPercentageStart = Math.round(((values[0] - minValue) / (maxValue - minValue)) * 100);
  const initialPercentageEnd = Math.round(((values[1] - minValue) / (maxValue - minValue)) * 100);

  const [percentageStart, setPercentageStart] = useState(initialPercentageStart);
  const [percentageEnd, setPercentageEnd] = useState(initialPercentageEnd);

  const [rangeValue, setRangeValue] = useState(values);
  const selectedThumbRef = useRef(null);
  const sliderRef = useRef(null);

  const updateRangeValues = (newValues, index = null) => {
    const updatedRangeValue = Array.isArray(newValues) ? [...newValues] : [...rangeValue];
    if (index !== null) {
      updatedRangeValue[index] = newValues;
    }

    const calculatePercentage = value => ((value - minValue) / (maxValue - minValue)) * 100;

    const newPercentageStart = calculatePercentage(updatedRangeValue[0]);
    const newPercentageEnd = calculatePercentage(updatedRangeValue[1]);

    setRangeValue(updatedRangeValue);
    onChange(updatedRangeValue);

    setPercentageStart(newPercentageStart);
    setPercentageEnd(newPercentageEnd);
  };

  useEffect(() => {
    updateRangeValues(values);
  }, [values, minValue, maxValue]);

  const LabelOrEditableNumber = (val, index) => {
    return allowNumberEdit ? (
      <InputNumber
        minValue={minValue}
        maxValue={maxValue}
        value={val}
        onChange={newValue => {
          updateRangeValues(newValue, index);
        }}
        step={step}
        labelClassName="text-white"
        showAdjustmentArrows={showAdjustmentArrows}
      />
    ) : (
      <span className={classNames(labelClassName ?? 'text-white')}>
        {val}
        {unit}
      </span>
    );
  };

  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  const handleGlobalMouseUp = () => {
    // Remove global mouse event listeners
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleGlobalMouseUp);
    selectedThumbRef.current = null;
  };

  const handleMouseDown = e => {
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentageClicked = (x / rect.width) * 100;

    // Calculate the distances from the clicked point to both thumbs' positions
    const distanceToStartThumb = Math.abs(percentageClicked - percentageStart);
    const distanceToEndThumb = Math.abs(percentageClicked - percentageEnd);

    // Check if the clicked point is within a threshold distance to either thumb
    if (distanceToStartThumb < 10) {
      selectedThumbRef.current = 0;
    } else if (distanceToEndThumb < 10) {
      selectedThumbRef.current = 1;
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
  };

  const handleMouseMove = e => {
    const selectedThumbValue = selectedThumbRef.current;

    if (selectedThumbValue === null) {
      return;
    }

    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newValue =
      Math.round(((x / rect.width) * (maxValue - minValue) + minValue) / step) * step;

    // Make sure newValue is within [minValue, maxValue]
    const clampedValue = Math.min(Math.max(newValue, minValue), maxValue);

    // Ensure that left and right thumbs don't switch positions
    if (selectedThumbValue === 0 && clampedValue >= rangeValue[1]) {
      return;
    }
    if (selectedThumbValue === 1 && clampedValue <= rangeValue[0]) {
      return;
    }

    // Update the correct values in the rangeValue array
    const updatedRangeValue = [...rangeValue];
    updatedRangeValue[selectedThumbValue] = clampedValue;
    setRangeValue(updatedRangeValue);

    onChange(updatedRangeValue);

    // Update the thumb position
    const percentage = Math.round(((clampedValue - minValue) / (maxValue - minValue)) * 100);
    if (selectedThumbValue === 0) {
      setPercentageStart(percentage);
    } else {
      setPercentageEnd(percentage);
    }
  };

  // Calculate the range values percentages for gradient background
  const rangeValuePercentageStart = ((rangeValue[0] - minValue) / (maxValue - minValue)) * 100;
  const rangeValuePercentageEnd = ((rangeValue[1] - minValue) / (maxValue - minValue)) * 100;

  return (
    <div className={`flex select-none items-center space-x-2 ${containerClassName ?? ''}`}>
      {showLabel && LabelOrEditableNumber(rangeValue[0], 0)}
      <div
        className="relative flex h-10 w-full items-center"
        onMouseDown={handleMouseDown}
        ref={sliderRef}
      >
        <div
          className="h-[3px] w-full rounded-lg"
          style={{
            background: `linear-gradient(to right, #3a3f99 0%, #3a3f99 ${rangeValuePercentageStart}%, #5acce6 ${rangeValuePercentageStart}%, #5acce6 ${rangeValuePercentageEnd}%, #3a3f99 ${rangeValuePercentageEnd}%, #3a3f99 100%)`,
          }}
        ></div>
        <div
          className="input-range-thumb-design absolute h-3 w-3 cursor-pointer"
          style={{
            left: `calc(${percentageStart}% - 3px)`,
          }}
        ></div>
        <div
          className="input-range-thumb-design absolute h-3  w-3 cursor-pointer rounded-full"
          style={{ left: `calc(${percentageEnd}% - 3px)` }}
        ></div>
      </div>
      {showLabel && LabelOrEditableNumber(rangeValue[1], 1)}
    </div>
  );
};

InputDoubleRange.defaultProps = {
  minValue: 0,
  maxValue: 100,
  step: 1,
  unit: '',
  containerClassName: '',
  inputClassName: '',
  labelClassName: '',
  labelVariant: 'body1',
  showLabel: false,
  labelPosition: 'left',
  trackColor: 'primary',
  allowNumberEdit: false,
  showAdjustmentArrows: false,
};

export default InputDoubleRange;
