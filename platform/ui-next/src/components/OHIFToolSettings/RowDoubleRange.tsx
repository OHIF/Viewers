import React from 'react';
import Numeric from '../Numeric';
import { cn } from '../../lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '../Tooltip';

interface RowDoubleRangeProps {
  values: [number, number];
  onChange: (values: [number, number]) => void;
  minValue: number;
  maxValue: number;
  step: number;
  showLabel?: boolean;
  label?: string;
  tooltip?: string;
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
  tooltip,
  className,
}) => {
  const renderLabel = () => {
    if (!showLabel || !label) {
      return null;
    }

    const labelNode = <Numeric.Label showValue>{label}</Numeric.Label>;

    if (!tooltip) {
      return labelNode;
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>{labelNode}</TooltipTrigger>
        <TooltipContent side="top">{tooltip}</TooltipContent>
      </Tooltip>
    );
  };

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
      {renderLabel()}
      <Numeric.DoubleRange showNumberInputs />
    </Numeric.Container>
  );
};

export default RowDoubleRange;
