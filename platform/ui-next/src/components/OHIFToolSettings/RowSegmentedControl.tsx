import React from 'react';
import { Label } from '../Label';
import { Tabs, TabsList, TabsTrigger } from '../Tabs';
import { cn } from '../../lib/utils';

interface RadioValue {
  value: string;
  label: string;
}

interface RadioOption {
  id: string;
  name: string;
  value: string;
  values: RadioValue[];
  onChange?: (val: string) => void;
}

interface RowSegmentedControlProps {
  option: RadioOption;
  className?: string;
  onChange?: (val: string) => void;
}

export const RowSegmentedControl: React.FC<RowSegmentedControlProps> = ({
  option,
  className,
  onChange,
}) => {
  const handleValueChange = (newVal: string) => {
    if (onChange) {
      onChange(newVal);
    }
  };

  return (
    <div
      className={cn('flex items-center justify-between text-[13px]', className)}
      key={option.id}
    >
      <Label className="mr-2">{option.name}</Label>
      <div className="max-w-1/2">
        <Tabs
          value={option.value}
          onValueChange={handleValueChange}
        >
          <TabsList className="inline-flex space-x-1">
            {option.values.map(({ label, value: itemValue }, index) => (
              <TabsTrigger
                value={itemValue}
                key={`button-${option.id}-${index}`}
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};

export default RowSegmentedControl;
