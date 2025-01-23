import React, { useCallback, useState, useEffect } from 'react';
import { Slider } from '../Slider';
import { Input } from '../Input';
import { Label } from '../Label';
import { cn } from '../../lib/utils';

interface RowInputRangeProps {
  value: number;
  onChange: (newValue: number) => void;
  minValue?: number;
  maxValue?: number;
  step?: number;
  label?: string;
  showLabel?: boolean;
  labelPosition?: 'left' | 'right';
  allowNumberEdit?: boolean;
  showNumberInput?: boolean;
  className?: string;
  containerClassName?: string;
}

export const RowInputRange: React.FC<RowInputRangeProps> = ({
  value,
  onChange,
  minValue = 0,
  maxValue = 100,
  step = 1,
  label = '',
  showLabel = false,
  labelPosition = 'right',
  allowNumberEdit = false,
  showNumberInput = true,
  className,
  containerClassName,
}) => {
  const [internalValue, setInternalValue] = useState<number>(value);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleSliderChange = useCallback(
    (newValues: number[]) => {
      if (!newValues || newValues.length < 1) {
        return;
      }
      const [val] = newValues;
      setInternalValue(val);
      onChange?.(val);
    },
    [onChange]
  );

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let typedVal = parseFloat(e.target.value);
    if (isNaN(typedVal)) {
      typedVal = minValue;
    }
    typedVal = Math.max(minValue, Math.min(maxValue, typedVal));
    setInternalValue(typedVal);
    onChange?.(typedVal);
  };

  const renderLabelOrNumberInput = () => {
    if (!showLabel && !showNumberInput) {
      return null;
    }
    if (allowNumberEdit && showNumberInput) {
      return (
        <div className="flex items-center space-x-1">
          {showLabel && label && <Label className="mr-1">{label}</Label>}
          <Input
            type="number"
            value={internalValue}
            onChange={handleNumberChange}
            className="w-[46px]"
          />
        </div>
      );
    }
    if (showLabel && label) {
      return (
        <Label>
          {label}: {internalValue}
        </Label>
      );
    }
    return <span>{internalValue}</span>;
  };

  return (
    <div className={cn('flex items-center space-x-2', containerClassName)}>
      {labelPosition === 'left' && renderLabelOrNumberInput()}
      <Slider
        className={cn('w-full', className)}
        min={minValue}
        max={maxValue}
        step={step}
        value={[internalValue]}
        onValueChange={handleSliderChange}
      />
      {labelPosition === 'right' && renderLabelOrNumberInput()}
    </div>
  );
};

export default RowInputRange;
