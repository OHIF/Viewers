import React from 'react';
import { RowInputRange } from '../../../../ui-next/src/components/OHIFToolSettings/RowInputRange';
import ShowcaseRow from './ShowcaseRow';

/**
 * RowInputRangeShowcase component displays RowInputRange variants and examples using the compound component pattern
 */
export default function RowInputRangeShowcase() {
  return (
    <ShowcaseRow
      title="Row Input Range"
      description="A compound component that combines a slider with optional label and number input"
      code={`
// Basic usage with number input on right
<RowInputRange.Container value={50} onChange={newValue => console.debug('Value changed:', newValue)}>
  <RowInputRange.Slider />
  <RowInputRange.NumberInput />
</RowInputRange.Container>

// With label and number input
<RowInputRange.Container
  value={25}
  onChange={newValue => console.debug('Value changed:', newValue)}
  min={0}
  max={100}
  step={1}
>
  <RowInputRange.Label text="Thickness" />
  <RowInputRange.Slider />
  <RowInputRange.NumberInput />
</RowInputRange.Container>

// With label showing current value
<RowInputRange.Container
  value={75}
  onChange={newValue => console.debug('Value changed:', newValue)}
  min={50}
  max={200}
  step={5}
>
  <RowInputRange.Label text="Zoom" showValue />
  <RowInputRange.Slider />
</RowInputRange.Container>
      `}
    >
      <div className="bg-popover flex w-[450px] flex-col space-y-12 rounded p-4">
        {/* Basic usage without label just slider + number */}
        <div className="flex w-40 flex-col space-y-2">
          <span className="text-sm font-medium">No Label:</span>
          <RowInputRange.Container
            value={0}
            onChange={v => {
              console.log('Value changed:', v);
            }}
          >
            <RowInputRange.Slider />
            <RowInputRange.NumberInput />
          </RowInputRange.Container>
        </div>

        {/* With label and number input */}
        <RowInputRange.Container
          value={0}
          onChange={() => {}}
          min={0}
          max={100}
          step={1}
        >
          <RowInputRange.Label text="Thickness" />
          <RowInputRange.Slider />
          <RowInputRange.NumberInput />
        </RowInputRange.Container>

        {/* With label showing value */}
        <RowInputRange.Container
          value={0}
          onChange={() => {}}
          min={50}
          max={200}
          step={5}
        >
          <RowInputRange.Label
            text="Zoom"
            showValue
          />
          <RowInputRange.Slider />
        </RowInputRange.Container>
      </div>
    </ShowcaseRow>
  );
}
