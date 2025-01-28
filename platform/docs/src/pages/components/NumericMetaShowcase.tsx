import React from 'react';
import NumericMeta from '../../../../ui-next/src/components/Numeric';
import ShowcaseRow from './ShowcaseRow';

/**
 * NumericMetaShowcase component displays NumericMeta variants and examples
 */
export default function NumericMetaShowcase() {
  return (
    <div className="space-y-8">
      {/* Basic Number Input */}
      <ShowcaseRow
        title="NumericMeta - Number Input"
        description="Basic number input with min, max, and step controls"
        code={`
// Basic number input
<NumericMeta.Container mode="number" min={0} max={100} step={1}>
  <NumericMeta.Label showValue>Volume</NumericMeta.Label>
  <NumericMeta.NumberInput />
</NumericMeta.Container>
        `}
      >
        <div className="bg-popover flex flex-row p-4">
          <NumericMeta.Container
            mode="number"
            min={0}
            max={100}
          >
            <div className="flex flex-row items-center space-x-2">
              <NumericMeta.Label>Width</NumericMeta.Label>
              <NumericMeta.NumberInput />
            </div>
          </NumericMeta.Container>
        </div>

        <div className="bg-popover flex flex-row p-4">
          <NumericMeta.Container
            mode="number"
            min={0}
            max={100}
            step={1}
          >
            <NumericMeta.Label className="text-red-50">Height</NumericMeta.Label>
            <NumericMeta.NumberInput className="w-12" />
          </NumericMeta.Container>
        </div>
      </ShowcaseRow>

      {/* Single Range Slider */}
      <ShowcaseRow
        title="NumericMeta - Single Range"
        description="Single range slider with optional number input"
        code={`
// Single range slider with number input
<NumericMeta.Container
  mode="singleRange"
  min={0}
  max={100}
  step={1}
  value={50}
  onChange={(val) => console.debug('Value changed:', val)}
>
  <NumericMeta.Label showValue>Brightness</NumericMeta.Label>
  <NumericMeta.SingleRange showNumberInput />
</NumericMeta.Container>
        `}
      >
        <div className="bg-popover flex w-[300px] flex-col space-y-4 rounded p-4">
          <NumericMeta.Container
            mode="singleRange"
            min={0}
            max={100}
            step={1}
            value={50}
          >
            <NumericMeta.Label showValue>Brightness</NumericMeta.Label>
            <NumericMeta.SingleRange showNumberInput />
          </NumericMeta.Container>

          <NumericMeta.Container
            mode="singleRange"
            min={-50}
            max={50}
            step={0.1}
            value={0}
          >
            <NumericMeta.Label showValue>Contrast</NumericMeta.Label>
            <NumericMeta.SingleRange />
          </NumericMeta.Container>
        </div>
      </ShowcaseRow>

      {/* Double Range Slider */}
      <ShowcaseRow
        title="NumericMeta - Double Range"
        description="Double range slider for selecting a range of values"
        code={`
// Double range slider with number inputs
<NumericMeta.Container
  mode="doubleRange"
  min={0}
  max={100}
  step={1}
  values={[30, 70]}
  onChange={(vals) => console.debug('Values changed:', vals)}
>
  <NumericMeta.Label showValue>Window Width/Level</NumericMeta.Label>
  <NumericMeta.DoubleRange showNumberInputs />
</NumericMeta.Container>
        `}
      >
        <div className="bg-popover flex w-[300px] flex-col space-y-4 rounded p-4">
          <NumericMeta.Container
            mode="doubleRange"
            min={0}
            max={100}
            step={1}
            values={[30, 70]}
          >
            <NumericMeta.Label showValue>Window Width/Level</NumericMeta.Label>
            <NumericMeta.DoubleRange showNumberInputs />
          </NumericMeta.Container>

          <NumericMeta.Container
            mode="doubleRange"
            min={-1000}
            max={1000}
            step={10}
            values={[-500, 500]}
          >
            <NumericMeta.Label showValue>Hounsfield Units</NumericMeta.Label>
            <NumericMeta.DoubleRange />
          </NumericMeta.Container>
        </div>
      </ShowcaseRow>

      {/* Combined Examples */}
      <ShowcaseRow
        title="NumericMeta - Combined Examples"
        description="Different modes and configurations working together"
        code={`
// Multiple NumericMeta components with different configurations
<div className="space-y-4">
  <NumericMeta.Container mode="number" min={0} max={10} step={0.1}>
    <NumericMeta.Label>Zoom Factor</NumericMeta.Label>
    <NumericMeta.NumberInput />
  </NumericMeta.Container>

  <NumericMeta.Container mode="singleRange" min={0} max={360} step={1}>
    <NumericMeta.Label showValue>Rotation</NumericMeta.Label>
    <NumericMeta.SingleRange showNumberInput />
  </NumericMeta.Container>

  <NumericMeta.Container mode="doubleRange" min={-1000} max={3000} step={10}>
    <NumericMeta.Label showValue>CT Window</NumericMeta.Label>
    <NumericMeta.DoubleRange showNumberInputs />
  </NumericMeta.Container>
</div>
        `}
      >
        <div className="bg-popover flex w-[300px] flex-col space-y-4 rounded p-4">
          <NumericMeta.Container
            mode="number"
            min={0}
            max={10}
            step={0.1}
          >
            <NumericMeta.Label>Zoom Factor</NumericMeta.Label>
            <NumericMeta.NumberInput />
          </NumericMeta.Container>

          <NumericMeta.Container
            mode="singleRange"
            min={0}
            max={360}
            step={1}
          >
            <NumericMeta.Label showValue>Rotation</NumericMeta.Label>
            <NumericMeta.SingleRange showNumberInput />
          </NumericMeta.Container>

          <NumericMeta.Container
            mode="doubleRange"
            min={-1000}
            max={3000}
            step={10}
          >
            <NumericMeta.Label showValue>CT Window</NumericMeta.Label>
            <NumericMeta.DoubleRange showNumberInputs />
          </NumericMeta.Container>
        </div>
      </ShowcaseRow>
    </div>
  );
}
