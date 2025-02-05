import React from 'react';
import Numeric from '../Numeric';
import { cn } from '../../lib/utils';

interface RowDoubleRangeProps {
  values: [number, number];
  onChange: (values: [number, number]) => void;
  minValue: number;
  maxValue: number;
  step: number;
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const RowDoubleRange: React.FC<RowDoubleRangeProps> = ({
  values,
  onChange,
  minValue,
  maxValue,
  step,
  showLabel = false,
  label = '',
  className,
}) => {
  return (
    <Numeric.Container
      mode="doubleRange"
      values={values}
      onChange={onChange}
      min={minValue}
      max={maxValue}
      step={step}
      className={cn('flex flex-col space-y-2', className)}
    >
      {showLabel && <Numeric.Label showValue>{label}</Numeric.Label>}
      <Numeric.DoubleRange showNumberInputs />
    </Numeric.Container>
  );
};

export default RowDoubleRange;
