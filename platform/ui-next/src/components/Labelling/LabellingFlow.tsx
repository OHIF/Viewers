import React, { useState, useEffect } from 'react';
import { CheckIcon } from '@radix-ui/react-icons';
import cloneDeep from 'lodash.clonedeep';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../Command/Command'; // Assuming Command is in ../Command relative path
import { cn } from '../../lib/utils'; // Assuming cn utility is here
import { ScrollArea } from '../ScrollArea/ScrollArea'; // Import ScrollArea

interface PropType {
  labellingDoneCallback: (label: string) => void;
  measurementData: any; // Keep any for now as per instructions
  labelData: LabelInfo[]; // Use LabelInfo[] for better type safety
  exclusive: boolean;
  hide: () => void; // Add hide prop explicitly
  placeholder?: string; // Optional placeholder for input
  emptyMessage?: string; // Optional message for empty results
  initialLabel?: string; // Optional initial selected label
}

export interface LabelInfo {
  label: string;
  value: string;
}

// Convert to Functional Component
const LabellingFlow: React.FC<PropType> = ({
  labellingDoneCallback,
  measurementData,
  labelData,
  exclusive,
  hide,
  placeholder = 'Type label or search...',
  emptyMessage = 'No labels found.',
  initialLabel,
}) => {
  // State for the selected value
  const [value, setValue] = useState<string | undefined>(initialLabel);
  const [currentItems, setCurrentItems] = useState<LabelInfo[]>([]);

  // Update items when labelData changes
  useEffect(() => {
    if (labelData) {
      setCurrentItems(cloneDeep(labelData));
    }
  }, [labelData]);

  // Original component used measurementData?.label in constructor,
  // let's try to initialize based on that if initialLabel is not provided.
  useEffect(() => {
    if (!initialLabel && measurementData?.label) {
      setValue(measurementData.label);
    }
  }, [initialLabel, measurementData]);

  return (
    <Command className="border-input border">
      <CommandInput placeholder={placeholder} />
      <CommandList>
        <CommandEmpty>{emptyMessage}</CommandEmpty>
        <ScrollArea className="h-[300px]">
          <CommandGroup>
            {currentItems.map(item => (
              <CommandItem
                key={item.value}
                value={item.value}
                onSelect={currentValue => {
                  const newValue = currentValue === value ? '' : currentValue;
                  setValue(newValue);
                  labellingDoneCallback(newValue);
                  hide();
                }}
              >
                <CheckIcon
                  className={cn('mr-2 h-4 w-4', value === item.value ? 'opacity-100' : 'opacity-0')}
                />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </ScrollArea>
      </CommandList>
    </Command>
  );
};

export default LabellingFlow;