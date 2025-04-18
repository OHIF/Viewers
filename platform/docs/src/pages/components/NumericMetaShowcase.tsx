import React, { useState } from 'react';
import Numeric from '../../../../ui-next/src/components/Numeric';
import Icons from '../../../../ui-next/src/components/Icons';
import ShowcaseRow from './ShowcaseRow';

/**
 * NumericShowcase component displays Numeric variants and examples
 */
export default function NumericShowcase() {
  const [controlledValue, setControlledValue] = useState(0);
  const [controlledValues, setControlledValues] = useState([0, 100] as [number, number]);
  const [dimensionGroupNumber, setDimensionGroupNumber] = useState(1);

  return (
    <div className="space-y-8">
      {/* Basic Number Input */}
      <ShowcaseRow
        title="Numeric - Number Input"
        description="Basic number input with min, max and a label"
        code={`
<Numeric.Container mode="number" min={0} max={10} onChange={val => console.debug('Value changed:', val)}>
  <div className="flex flex-row items-center space-x-2">
    <Numeric.Label>Width</Numeric.Label>
    <Numeric.NumberInput />
  </div>
</Numeric.Container>

<Numeric.Container mode="number" className="space-y-1" min={0} max={100} onChange={val => console.debug('Value changed:', val)}>
  <Numeric.Label className="text-muted-foreground text-sm font-bold">Bolder</Numeric.Label>
  <Numeric.NumberInput className="w-12" />
</Numeric.Container>

<Numeric.Container
  mode="number"
  className="flex flex-row items-center justify-between"
  onChange={val => console.debug('Value changed:', val)}
  min={0}
  value={123465789}
  max={10000000000000}
>
  <Numeric.Label className="flex flex-row items-center">
    <Icons.Add />
    With Icon
  </Numeric.Label>
  <Numeric.NumberInput className="w-32 text-center" />
</Numeric.Container>`}
      >
        <div className="bg-muted flex w-[300px] flex-col space-y-4 rounded p-4">
          <Numeric.Container
            mode="number"
            min={0}
            max={10}
            onChange={val => console.debug('Value changed:', val)}
          >
            <div className="flex flex-row items-center space-x-2">
              <Numeric.Label>Width</Numeric.Label>
              <Numeric.NumberInput />
            </div>
          </Numeric.Container>

          <Numeric.Container
            mode="number"
            className="space-y-1"
            min={0}
            max={100}
            onChange={val => console.debug('Value changed:', val)}
          >
            <Numeric.Label className="text-muted-foreground text-sm font-bold">
              Bolder
            </Numeric.Label>
            <Numeric.NumberInput className="w-12" />
          </Numeric.Container>

          <Numeric.Container
            mode="number"
            className="flex flex-row items-center justify-between"
            onChange={val => console.debug('Value changed:', val)}
            min={0}
            value={123465789}
            max={10000000000000}
          >
            <Numeric.Label className="flex flex-row items-center">
              <Icons.Add />
              With Icon
            </Numeric.Label>
            <Numeric.NumberInput className="w-32 text-center" />
          </Numeric.Container>
        </div>
      </ShowcaseRow>

      {/* Stepper Controls */}
      <ShowcaseRow
        title="Numeric - Stepper Controls"
        description="Number input with increment/decrement controls in horizontal or vertical layout"
        code={`
// For controlled component
const [dimensionGroupNumber, setDimensionGroupNumber] = useState(1);

<Numeric.Container
  mode="stepper"
  value={dimensionGroupNumber}
  onChange={val => setDimensionGroupNumber(val as number)}
  min={1}
  max={5}
  step={1}
>
  <div className="flex flex-col items-center">
    <Numeric.NumberStepper className="w-[58px]" direction="horizontal"/>
    <Numeric.Label className="mt-1">Frame</Numeric.Label>
  </div>
</Numeric.Container>

<Numeric.Container
  mode="stepper"
  min={0}
  max={100}
  step={1}
  defaultValue={50}
>
  <div className="flex items-center space-x-2">
    <Numeric.Label>Opacity</Numeric.Label>
    <Numeric.NumberStepper className="w-[58px]" direction="horizontal"/>
  </div>
</Numeric.Container>

<Numeric.Container
  mode="stepper"
  min={-10}
  max={10}
  step={0.1}
  defaultValue={0}
>
  <div className="flex items-center space-x-2">
    <Numeric.Label>Zoom:</Numeric.Label>
    <Numeric.NumberStepper className="w-[65px]" direction="vertical"/>
  </div>
</Numeric.Container>`}
      >
        <div className="bg-muted flex w-[300px] flex-col space-y-4 rounded p-4">
          <Numeric.Container
            mode="stepper"
            value={dimensionGroupNumber}
            onChange={val => setDimensionGroupNumber(val as number)}
            min={1}
            max={5}
            step={1}
          >
            <div className="flex flex-col items-center">
              <Numeric.NumberStepper
                className="flex w-[78px]"
                direction="horizontal"
              >
                <span className="text-muted-foreground text-xs">FPS</span>
              </Numeric.NumberStepper>
              <Numeric.Label className="mt-1">Frame</Numeric.Label>
            </div>
          </Numeric.Container>

          <Numeric.Container
            mode="stepper"
            min={0}
            max={100}
            step={1}
            defaultValue={50}
          >
            <div className="flex items-center space-x-2">
              <Numeric.Label>Opacity</Numeric.Label>
              <Numeric.NumberStepper
                className="w-[58px]"
                direction="horizontal"
              />
            </div>
          </Numeric.Container>

          <Numeric.Container
            mode="stepper"
            min={-10}
            max={10}
            step={1}
            defaultValue={0}
          >
            <div className="flex items-center space-x-2">
              <Numeric.NumberStepper
                className="w-[53px]"
                direction="vertical"
              />
              <Numeric.Label>Zoom</Numeric.Label>
            </div>
          </Numeric.Container>
        </div>
      </ShowcaseRow>

      {/* Single Range Slider */}
      <ShowcaseRow
        title="Numeric - Single Range"
        description="Single range slider with optional number input"
        code={`
// For controlled component
const [controlledValue, setControlledValue] = useState(0);

<Numeric.Container mode="singleRange" min={0} max={100} onChange={val => console.debug('Value changed:', val)}>
  <Numeric.Label>Brightness</Numeric.Label>
  <Numeric.SingleRange showNumberInput />
</Numeric.Container>

<Numeric.Container
  mode="singleRange"
  min={-50}
  max={50}
  step={1}
  defaultValue={0}
  className="flex flex-row items-center"
  onChange={val => console.debug('Value changed:', val)}
>
  <Numeric.Label showValue>Contrast</Numeric.Label>
  <Numeric.SingleRange />
</Numeric.Container>

<Numeric.Container
  mode="singleRange"
  min={0}
  max={100}
  step={1}
  value={controlledValue}
  className="flex flex-row items-center space-x-2"
  onChange={val => setControlledValue(val as number)}
>
  <Numeric.Label>Controlled State (Parent) </Numeric.Label>
  <Numeric.SingleRange showNumberInput />
</Numeric.Container>`}
      >
        <div className="bg-muted flex w-[300px] flex-col space-y-4 rounded p-4">
          <Numeric.Container
            mode="singleRange"
            min={0}
            max={100}
            onChange={val => console.debug('Value changed:', val)}
          >
            <Numeric.Label>Brightness</Numeric.Label>
            <Numeric.SingleRange showNumberInput />
          </Numeric.Container>

          <Numeric.Container
            mode="singleRange"
            min={-50}
            max={50}
            step={1}
            defaultValue={0}
            className="flex flex-row items-center"
            onChange={val => console.debug('Value changed:', val)}
          >
            <Numeric.Label showValue>Contrast</Numeric.Label>
            <Numeric.SingleRange />
          </Numeric.Container>

          <Numeric.Container
            mode="singleRange"
            min={0}
            max={100}
            step={1}
            value={controlledValue}
            className="flex flex-row items-center space-x-2"
            onChange={val => setControlledValue(val as number)}
          >
            <Numeric.Label>Controlled State (Parent) </Numeric.Label>
            <Numeric.SingleRange showNumberInput />
          </Numeric.Container>
        </div>
      </ShowcaseRow>

      {/* Double Range Slider */}
      <ShowcaseRow
        title="Numeric - Double Range"
        description="Double range slider for selecting a range of values"
        code={`
// For controlled component
const [controlledValues, setControlledValues] = useState<[number, number]>([0, 100]);

<Numeric.Container
  mode="doubleRange"
  min={0}
  max={100}
  step={1}
  className="space-y-1"
  onChange={vals => console.debug('Values changed:', vals)}
>
  <Numeric.Label showValue>Window Width/Level</Numeric.Label>
  <Numeric.DoubleRange />
</Numeric.Container>

<Numeric.Container
  mode="doubleRange"
  min={0}
  max={100}
  step={1}
  defaultValues={[30, 70]}
  className="space-y-1"
  onChange={vals => console.debug('Values changed:', vals)}
>
  <Numeric.Label>Window Width/Level</Numeric.Label>
  <Numeric.DoubleRange showNumberInputs />
</Numeric.Container>

<Numeric.Container
  mode="doubleRange"
  min={0}
  max={100}
  step={1}
  values={controlledValues}
  className="flex flex-row items-center space-x-2"
  onChange={vals => setControlledValues(vals as [number, number])}
>
  <Numeric.Label>Controlled State (Parent) </Numeric.Label>
  <Numeric.DoubleRange />
</Numeric.Container>`}
      >
        <div className="bg-muted flex w-[300px] flex-col space-y-4 rounded p-4">
          <Numeric.Container
            mode="doubleRange"
            min={0}
            max={100}
            step={1}
            className="space-y-1"
            onChange={vals => console.debug('Values changed:', vals)}
          >
            <Numeric.Label showValue>Window Width/Level</Numeric.Label>
            <Numeric.DoubleRange />
          </Numeric.Container>

          <Numeric.Container
            mode="doubleRange"
            min={0}
            max={100}
            step={1}
            defaultValues={[30, 70]}
            className="space-y-1"
            onChange={vals => console.debug('Values changed:', vals)}
          >
            <Numeric.Label>Window Width/Level</Numeric.Label>
            <Numeric.DoubleRange showNumberInputs />
          </Numeric.Container>

          <Numeric.Container
            mode="doubleRange"
            min={0}
            max={100}
            step={1}
            values={controlledValues}
            className="flex flex-row items-center space-x-2"
            onChange={vals => setControlledValues(vals as [number, number])}
          >
            <Numeric.Label>Controlled State (Parent) </Numeric.Label>
            <Numeric.DoubleRange />
          </Numeric.Container>
        </div>
      </ShowcaseRow>

      {/* Combined Examples */}
      <ShowcaseRow
        title="Numeric - Combined Examples"
        description="Different modes and configurations working together"
        code={`
<Numeric.Container
  mode="number"
  min={0}
  max={10}
  step={0.1}
  className="space-y-1"
>
  <Numeric.Label>Zoom Factor</Numeric.Label>
  <Numeric.NumberInput />
</Numeric.Container>

<Numeric.Container
  mode="stepper"
  min={-5}
  max={5}
  step={0.5}
  defaultValue={0}
>
  <div className="flex items-center justify-between">
    <Numeric.Label>Offset</Numeric.Label>
    <Numeric.NumberStepper className="w-[58px]">
    </Numeric.NumberStepper>
  </div>
</Numeric.Container>

<Numeric.Container
  mode="singleRange"
  min={0}
  max={360}
  step={1}
  className="space-y-1"
>
  <Numeric.Label showValue>Rotation</Numeric.Label>
  <Numeric.SingleRange showNumberInput />
</Numeric.Container>

<Numeric.Container
  mode="doubleRange"
  min={-1000}
  max={3000}
  step={10}
  className="space-y-1"
>
  <Numeric.Label showValue>CT Window</Numeric.Label>
  <Numeric.DoubleRange showNumberInputs />
</Numeric.Container>`}
      >
        <div className="bg-muted flex w-[300px] flex-col space-y-4 rounded p-4">
          <Numeric.Container
            mode="number"
            min={0}
            max={10}
            step={0.1}
            className="space-y-1"
          >
            <Numeric.Label>Zoom Factor</Numeric.Label>
            <Numeric.NumberInput />
          </Numeric.Container>

          <Numeric.Container
            mode="stepper"
            min={-5}
            max={5}
            step={0.5}
            defaultValue={0}
          >
            <div className="flex items-center justify-between">
              <Numeric.Label>Offset</Numeric.Label>
              <Numeric.NumberStepper
                className="w-[58px]"
                direction="horizontal"
              />
            </div>
          </Numeric.Container>

          <Numeric.Container
            mode="singleRange"
            min={0}
            max={360}
            step={1}
            className="space-y-1"
          >
            <Numeric.Label showValue>Rotation</Numeric.Label>
            <Numeric.SingleRange showNumberInput />
          </Numeric.Container>

          <Numeric.Container
            mode="doubleRange"
            min={-1000}
            max={3000}
            step={10}
            className="space-y-1"
          >
            <Numeric.Label showValue>CT Window</Numeric.Label>
            <Numeric.DoubleRange showNumberInputs />
          </Numeric.Container>
        </div>
      </ShowcaseRow>
    </div>
  );
}
