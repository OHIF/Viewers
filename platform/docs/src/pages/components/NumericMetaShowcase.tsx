import React from 'react';
import Numeric from '../../../../ui-next/src/components/Numeric';
import Icons from '../../../../ui-next/src/components/Icons';
import ShowcaseRow from './ShowcaseRow';

/**
 * NumericShowcase component displays Numeric variants and examples
 */
export default function NumericShowcase() {
  return (
    <div className="space-y-8">
      {/* Basic Number Input */}
      <ShowcaseRow
        title="Numeric - Number Input"
        description="Basic number input with min, max and a label"
        code={`
<Numeric.Container mode="number" min={0} max={100}>
  <div className="flex flex-row items-center space-x-2">
    <Numeric.Label>Width</Numeric.Label>
    <Numeric.NumberInput />
  </div>
</Numeric.Container>

<Numeric.Container mode="number" min={0} max={100}>
  <Numeric.Label className="text-red-500">Height</Numeric.Label>
  <Numeric.NumberInput className="w-12" />
</Numeric.Container>
        `}
      >
        <div className="bg-popover flex w-[300px] flex-col space-y-6 p-4">
          <Numeric.Container
            mode="number"
            min={0}
            max={10}
          >
            <div className="flex flex-row items-center space-x-2">
              <Numeric.Label>Width</Numeric.Label>
              <Numeric.NumberInput />
            </div>
          </Numeric.Container>

          <Numeric.Container
            mode="number"
            min={0}
            max={100}
          >
            <Numeric.Label className="text-secondary-foreground text-sm font-bold">
              Bolder
            </Numeric.Label>
            <Numeric.NumberInput className="w-12" />
          </Numeric.Container>

          <Numeric.Container
            mode="number"
            className="flex flex-row items-center justify-between"
          >
            <Numeric.Label className="flex flex-row items-center">
              <Icons.Add />
              With Icon
            </Numeric.Label>
            <Numeric.NumberInput className="w-12" />
          </Numeric.Container>
        </div>
      </ShowcaseRow>

      {/* Single Range Slider */}
      <ShowcaseRow
        title="Numeric - Single Range"
        description="Single range slider with optional number input"
        code={`
// Single range slider with number input
<Numeric.Container
  mode="singleRange"
  min={0}
  max={100}
  step={1}
  value={50}
  onChange={(val) => console.debug('Value changed:', val)}
>
  <Numeric.Label showValue>Brightness</Numeric.Label>
  <Numeric.SingleRange showNumberInput />
</Numeric.Container>
        `}
      >
        <div className="bg-popover flex w-[300px] flex-col space-y-4 rounded p-4">
          <Numeric.Container
            mode="singleRange"
            min={0}
            max={100}
            step={1}
            value={50}
          >
            <Numeric.Label showValue>Brightness</Numeric.Label>
            <Numeric.SingleRange showNumberInput />
          </Numeric.Container>

          <Numeric.Container
            mode="singleRange"
            min={-50}
            max={50}
            step={0.1}
            value={0}
          >
            <Numeric.Label showValue>Contrast</Numeric.Label>
            <Numeric.SingleRange />
          </Numeric.Container>
        </div>
      </ShowcaseRow>

      {/* Double Range Slider */}
      <ShowcaseRow
        title="Numeric - Double Range"
        description="Double range slider for selecting a range of values"
        code={`
// Double range slider with number inputs
<Numeric.Container
  mode="doubleRange"
  min={0}
  max={100}
  step={1}
  values={[30, 70]}
  onChange={(vals) => console.debug('Values changed:', vals)}
>
  <Numeric.Label showValue>Window Width/Level</Numeric.Label>
  <Numeric.DoubleRange showNumberInputs />
</Numeric.Container>
        `}
      >
        <div className="bg-popover flex w-[300px] flex-col space-y-4 rounded p-4">
          <Numeric.Container
            mode="doubleRange"
            min={0}
            max={100}
            step={1}
            values={[30, 70]}
          >
            <Numeric.Label showValue>Window Width/Level</Numeric.Label>
            <Numeric.DoubleRange showNumberInputs />
          </Numeric.Container>

          <Numeric.Container
            mode="doubleRange"
            min={-1000}
            max={1000}
            step={10}
            values={[-500, 500]}
          >
            <Numeric.Label showValue>Hounsfield Units</Numeric.Label>
            <Numeric.DoubleRange />
          </Numeric.Container>
        </div>
      </ShowcaseRow>

      {/* Combined Examples */}
      <ShowcaseRow
        title="Numeric - Combined Examples"
        description="Different modes and configurations working together"
        code={`
// Multiple Numeric components with different configurations
<div className="space-y-4">
  <Numeric.Container mode="number" min={0} max={10} step={0.1}>
    <Numeric.Label>Zoom Factor</Numeric.Label>
    <Numeric.NumberInput />
  </Numeric.Container>

  <Numeric.Container mode="singleRange" min={0} max={360} step={1}>
    <Numeric.Label showValue>Rotation</Numeric.Label>
    <Numeric.SingleRange showNumberInput />
  </Numeric.Container>

  <Numeric.Container mode="doubleRange" min={-1000} max={3000} step={10}>
    <Numeric.Label showValue>CT Window</Numeric.Label>
    <Numeric.DoubleRange showNumberInputs />
  </Numeric.Container>
</div>
        `}
      >
        <div className="bg-popover flex w-[300px] flex-col space-y-4 rounded p-4">
          <Numeric.Container
            mode="number"
            min={0}
            max={10}
            step={0.1}
          >
            <Numeric.Label>Zoom Factor</Numeric.Label>
            <Numeric.NumberInput />
          </Numeric.Container>

          <Numeric.Container
            mode="singleRange"
            min={0}
            max={360}
            step={1}
          >
            <Numeric.Label showValue>Rotation</Numeric.Label>
            <Numeric.SingleRange showNumberInput />
          </Numeric.Container>

          <Numeric.Container
            mode="doubleRange"
            min={-1000}
            max={3000}
            step={10}
          >
            <Numeric.Label showValue>CT Window</Numeric.Label>
            <Numeric.DoubleRange showNumberInputs />
          </Numeric.Container>
        </div>
      </ShowcaseRow>
    </div>
  );
}
