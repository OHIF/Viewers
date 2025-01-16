/***************************************************************
 * File: platform/ui-next/src/components/ToolSettings/RowSegmentedControl.tsx
 *
 * Purpose:
 *   - Replaces the legacy radio group logic found in renderRadioSetting.
 *   - Uses the Radix-based Tabs from `ui-next` to create a horizontal
 *     “segmented” control (each "TabTrigger" representing one choice).
 *   - The user clicks a segment, it updates the active value, and calls
 *     the provided commands function (option.commands).
 ***************************************************************/

import React from 'react';
import { Label } from '../Label'; // from ui-next
import { Tabs, TabsList, TabsTrigger } from '../Tabs'; // your Radix-based Tabs
import { cn } from '../../lib/utils'; // if you have a utility for merging class names

/***************************************************************
 * Type Definitions
 ***************************************************************/
interface RadioValue {
  value: string;
  label: string;
}

interface RadioOption {
  id: string;
  name: string; // e.g. "Mode" or "Shape"
  value: string; // current selected value
  values: RadioValue[]; // array of possible { value, label }
  commands?: (val: string) => void; // function called on selection
}

interface RowSegmentedControlProps {
  /** The "option" object from your old radio-based tool definition */
  option: RadioOption;
  /** Additional className for styling, if needed */
  className?: string;
}

/***************************************************************
 * RowSegmentedControl
 *  - Creates a row with a left label, and a right "segmented"
 *    control for multiple radio-like choices.
 ***************************************************************/
export const RowSegmentedControl: React.FC<RowSegmentedControlProps> = ({ option, className }) => {
  /**
   * We'll rely on Radix Tabs to handle the "which item is active" logic.
   * The `value` prop on <Tabs> is the currently selected item.
   * `onValueChange` is called whenever the user clicks a different tab.
   */
  const handleValueChange = (newVal: string) => {
    // Just call your old commands function with the newVal
    if (option.commands) {
      option.commands(newVal);
    }
  };

  return (
    <div
      /**
       * The container:
       *   - flex items-center => place items in a single row
       *   - justify-between => label on the left, segmented control on the right
       *   - text-[13px] => same font size used in old code
       */
      className={cn('flex items-center justify-between text-[13px]', className)}
      key={option.id}
    >
      {/** The left side label: e.g. "Mode" */}
      <Label className="mr-2">{option.name}</Label>

      {/** The right side segmented control (Tabs) */}
      <div className="max-w-1/2">
        <Tabs
          /**
           * "value" is the currently selected item,
           * matching the old code's "option.value" for the selected key
           */
          value={option.value}
          onValueChange={handleValueChange}
        >
          {/**
           * "TabsList" is the horizontal container for the tab "triggers"
           * you may style it further (e.g. flex, spacing, etc.)
           */}
          <TabsList className="inline-flex space-x-1">
            {option.values.map(({ label, value: itemValue }, index) => (
              <TabsTrigger
                /**
                 * "value" on the trigger means if the user clicks it,
                 * the parent <Tabs> goes to that value
                 */
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
