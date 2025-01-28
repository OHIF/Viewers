import React from 'react';
import NumericMeta from '../../../../ui-next/src/components/NumericMeta';
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
  <NumericMeta.Label text="Volume" showValue />
  <NumericMeta.NumberOnlyInput />
</NumericMeta.Container>
        `}
      >
        <div className="bg-popover flex w-[300px] rounded p-4">
          <NumericMeta.Container
            mode="number"
            min={0}
            max={100}
            step={1}
            // onChange={v => {
            //   console.debug('Value changed:', v);
            // }}
          >
            <div className="flex items-center justify-between space-x-2">
              <NumericMeta.Label
                text="Volume"
                showValue
              />
              <NumericMeta.NumberOnlyInput />
            </div>
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
  <NumericMeta.Label text="Brightness" showValue />
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
            <NumericMeta.Label
              text="Brightness"
              showValue
            />
            <NumericMeta.SingleRange showNumberInput />
          </NumericMeta.Container>

          <NumericMeta.Container
            mode="singleRange"
            min={-50}
            max={50}
            step={0.1}
            value={0}
          >
            <NumericMeta.Label
              text="Contrast"
              showValue
            />
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
  <NumericMeta.Label text="Window Width/Level" showValue />
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
            <NumericMeta.Label
              text="Window Width/Level"
              showValue
            />
            <NumericMeta.DoubleRange showNumberInputs />
          </NumericMeta.Container>

          <NumericMeta.Container
            mode="doubleRange"
            min={-1000}
            max={1000}
            step={10}
            values={[-500, 500]}
          >
            <NumericMeta.Label
              text="Hounsfield Units"
              showValue
            />
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
    <NumericMeta.Label text="Zoom Factor" />
    <NumericMeta.NumberOnlyInput />
  </NumericMeta.Container>

  <NumericMeta.Container mode="singleRange" min={0} max={360} step={1}>
    <NumericMeta.Label text="Rotation" showValue />
    <NumericMeta.SingleRange showNumberInput />
  </NumericMeta.Container>

  <NumericMeta.Container mode="doubleRange" min={-1000} max={3000} step={10}>
    <NumericMeta.Label text="CT Window" showValue />
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
            <NumericMeta.Label text="Zoom Factor" />
            <NumericMeta.NumberOnlyInput />
          </NumericMeta.Container>

          <NumericMeta.Container
            mode="singleRange"
            min={0}
            max={360}
            step={1}
          >
            <NumericMeta.Label
              text="Rotation"
              showValue
            />
            <NumericMeta.SingleRange showNumberInput />
          </NumericMeta.Container>

          <NumericMeta.Container
            mode="doubleRange"
            min={-1000}
            max={3000}
            step={10}
          >
            <NumericMeta.Label
              text="CT Window"
              showValue
            />
            <NumericMeta.DoubleRange showNumberInputs />
          </NumericMeta.Container>
        </div>
      </ShowcaseRow>
    </div>
  );
}
