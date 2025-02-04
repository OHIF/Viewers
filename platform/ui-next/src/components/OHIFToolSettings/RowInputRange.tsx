import React from 'react';
import Numeric from '../Numeric';
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

const RowInputRange: React.FC<RowInputRangeProps> = ({
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
  const handleChange = (newValue: number | [number, number]) => {
    if (typeof newValue === 'number') {
      onChange(newValue);
    } else {
      onChange(newValue[0]);
    }
  };

  const content = (
    <Numeric.Container
      mode="singleRange"
      value={value}
      onChange={handleChange}
      min={minValue}
      max={maxValue}
      step={step}
      className={cn('flex flex-row items-center space-x-2', className)}
    >
      {showLabel && label && labelPosition === 'left' && (
        <Numeric.Label showValue={showNumberInput}>{label}</Numeric.Label>
      )}
      <Numeric.SingleRange showNumberInput={allowNumberEdit && showNumberInput} />
      {showLabel && label && labelPosition === 'right' && (
        <Numeric.Label showValue={showNumberInput}>{label}</Numeric.Label>
      )}
    </Numeric.Container>
  );

  return containerClassName ? <div className={containerClassName}>{content}</div> : content;
};

export default RowInputRange;
