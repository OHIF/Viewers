import React, { useState } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

function NumericPageContent() {
  const Numeric = require('../../../../ui-next/src/components/Numeric').default;
  const ComponentLayout = require('./_layout/ComponentLayout').default;
  const PageHeader = require('./_layout/PageHeader').default;
  const Section = require('./_layout/Section').default;
  const InteractivePicker = require('./_layout/InteractivePicker').default;
  const CodeBlock = require('./_layout/CodeBlock').default;
  const ExampleBlock = require('./_layout/ExampleBlock').default;
  const PropsTable = require('./_layout/PropsTable').default;

  const [controlledValue, setControlledValue] = useState(50);
  const [controlledValues, setControlledValues] = useState([30, 70] as [number, number]);
  const [frameNumber, setFrameNumber] = useState(1);

  const modes = [
    { value: 'number', label: 'Number', description: 'Basic number input field with min/max bounds.' },
    { value: 'stepper', label: 'Stepper', description: 'Number input with increment/decrement buttons. Horizontal or vertical layout.' },
    { value: 'singleRange', label: 'Single Range', description: 'Slider for selecting a single value in a range. Optional number input.' },
    { value: 'doubleRange', label: 'Double Range', description: 'Dual-thumb slider for selecting a value range (e.g. window width/level).' },
  ];

  const containerProps = [
    { name: 'mode', type: '"number" | "singleRange" | "doubleRange" | "stepper"', default: '—', description: 'Which input mode to render' },
    { name: 'value', type: 'number', default: '—', description: 'Controlled single value (number, singleRange, stepper modes)' },
    { name: 'defaultValue', type: 'number', default: 'midpoint', description: 'Initial uncontrolled single value' },
    { name: 'values', type: '[number, number]', default: '—', description: 'Controlled range values (doubleRange mode)' },
    { name: 'defaultValues', type: '[number, number]', default: '[30%, 70%]', description: 'Initial uncontrolled range values' },
    { name: 'onChange', type: '(val: number | [number, number]) => void', default: '—', description: 'Called when any value changes' },
    { name: 'min', type: 'number', default: '0', description: 'Minimum allowed value' },
    { name: 'max', type: 'number', default: '100', description: 'Maximum allowed value' },
    { name: 'step', type: 'number', default: '1', description: 'Step increment' },
  ];

  return (
    <ComponentLayout
      title="Numeric"
      description="Compound numeric input with multiple modes"
    >
      <PageHeader
        title="Numeric"
        description="A compound component for numeric input — number fields, steppers, single sliders, and dual-range sliders."
      />

      <div className="mb-10">
        <div className="text-secondary-foreground space-y-3 text-lg leading-relaxed">
          <p>
            Numeric is a compound component with 6 sub-components that share state through
            context: <strong className="text-foreground">Numeric.Container</strong> (root + mode),{' '}
            <strong className="text-foreground">Numeric.Label</strong>,{' '}
            <strong className="text-foreground">Numeric.NumberInput</strong>,{' '}
            <strong className="text-foreground">Numeric.NumberStepper</strong>,{' '}
            <strong className="text-foreground">Numeric.SingleRange</strong>, and{' '}
            <strong className="text-foreground">Numeric.DoubleRange</strong>.
          </p>
          <p>
            In the OHIF Viewer, Numeric controls appear in{' '}
            <strong className="text-foreground">segmentation tool settings</strong> (brush size, threshold),{' '}
            <strong className="text-foreground">window/level adjustment</strong>,{' '}
            <strong className="text-foreground">opacity controls</strong>, and{' '}
            <strong className="text-foreground">cine playback frame rate</strong>. The{' '}
            <strong className="text-foreground">mode</strong> prop on the Container determines which
            input type renders.
          </p>
        </div>
      </div>

      <Section title="Modes">
        <InteractivePicker
          options={modes}
          defaultValue="number"
          renderPreview={(active) => (
            <div className="bg-muted w-[280px] rounded p-4">
              {active === 'number' && (
                <Numeric.Container mode="number" min={0} max={10}>
                  <div className="flex items-center space-x-2">
                    <Numeric.Label>Width</Numeric.Label>
                    <Numeric.NumberInput />
                  </div>
                </Numeric.Container>
              )}
              {active === 'stepper' && (
                <Numeric.Container mode="stepper" min={0} max={100} step={1} defaultValue={50}>
                  <div className="flex items-center space-x-2">
                    <Numeric.Label>Opacity</Numeric.Label>
                    <Numeric.NumberStepper className="w-[58px]" direction="horizontal" />
                  </div>
                </Numeric.Container>
              )}
              {active === 'singleRange' && (
                <Numeric.Container mode="singleRange" min={0} max={100} className="space-y-1">
                  <Numeric.Label>Brightness</Numeric.Label>
                  <Numeric.SingleRange showNumberInput />
                </Numeric.Container>
              )}
              {active === 'doubleRange' && (
                <Numeric.Container mode="doubleRange" min={-1000} max={3000} step={10} className="space-y-1">
                  <Numeric.Label showValue>CT Window</Numeric.Label>
                  <Numeric.DoubleRange />
                </Numeric.Container>
              )}
            </div>
          )}
        />
      </Section>

      <Section title="Examples">
        <ExampleBlock title="Number inputs">
          <div className="bg-muted flex w-[280px] flex-col space-y-4 rounded p-4">
            <Numeric.Container mode="number" min={0} max={10}>
              <div className="flex items-center space-x-2">
                <Numeric.Label>Width</Numeric.Label>
                <Numeric.NumberInput />
              </div>
            </Numeric.Container>

            <Numeric.Container
              mode="number"
              className="space-y-1"
              min={0}
              max={100}
            >
              <Numeric.Label className="text-muted-foreground text-sm font-bold">
                Threshold
              </Numeric.Label>
              <Numeric.NumberInput className="w-12" />
            </Numeric.Container>
          </div>
        </ExampleBlock>

        <ExampleBlock title="Stepper controls">
          <div className="bg-muted flex w-[280px] flex-col space-y-4 rounded p-4">
            <Numeric.Container
              mode="stepper"
              value={frameNumber}
              onChange={val => setFrameNumber(val as number)}
              min={1}
              max={5}
              step={1}
            >
              <div className="flex flex-col items-center">
                <Numeric.NumberStepper className="flex w-[78px]" direction="horizontal">
                  <span className="text-muted-foreground text-xs">FPS</span>
                </Numeric.NumberStepper>
                <Numeric.Label className="mt-1">Frame</Numeric.Label>
              </div>
            </Numeric.Container>

            <Numeric.Container mode="stepper" min={0} max={100} step={1} defaultValue={50}>
              <div className="flex items-center space-x-2">
                <Numeric.Label>Opacity</Numeric.Label>
                <Numeric.NumberStepper className="w-[58px]" direction="horizontal" />
              </div>
            </Numeric.Container>

            <Numeric.Container mode="stepper" min={-10} max={10} step={1} defaultValue={0}>
              <div className="flex items-center space-x-2">
                <Numeric.NumberStepper className="w-[53px]" direction="vertical" />
                <Numeric.Label>Zoom</Numeric.Label>
              </div>
            </Numeric.Container>
          </div>
        </ExampleBlock>

        <ExampleBlock title="Single range sliders">
          <div className="bg-muted flex w-[280px] flex-col space-y-4 rounded p-4">
            <Numeric.Container mode="singleRange" min={0} max={100}>
              <Numeric.Label>Brightness</Numeric.Label>
              <Numeric.SingleRange showNumberInput />
            </Numeric.Container>

            <Numeric.Container
              mode="singleRange"
              min={-50}
              max={50}
              step={1}
              defaultValue={0}
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
              onChange={val => setControlledValue(val as number)}
            >
              <Numeric.Label>Controlled</Numeric.Label>
              <Numeric.SingleRange showNumberInput />
            </Numeric.Container>
          </div>
        </ExampleBlock>

        <ExampleBlock title="Double range sliders">
          <div className="bg-muted flex w-[280px] flex-col space-y-4 rounded p-4">
            <Numeric.Container
              mode="doubleRange"
              min={0}
              max={100}
              step={1}
              className="space-y-1"
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
            >
              <Numeric.Label>With number inputs</Numeric.Label>
              <Numeric.DoubleRange showNumberInputs />
            </Numeric.Container>
          </div>
        </ExampleBlock>

        <ExampleBlock title="Combined panel" last>
          <div className="bg-muted flex w-[280px] flex-col space-y-4 rounded p-4">
            <Numeric.Container mode="number" min={0} max={10} step={0.1} className="space-y-1">
              <Numeric.Label>Zoom Factor</Numeric.Label>
              <Numeric.NumberInput />
            </Numeric.Container>

            <Numeric.Container mode="stepper" min={-5} max={5} step={0.5} defaultValue={0}>
              <div className="flex items-center justify-between">
                <Numeric.Label>Offset</Numeric.Label>
                <Numeric.NumberStepper className="w-[58px]" direction="horizontal" />
              </div>
            </Numeric.Container>

            <Numeric.Container mode="singleRange" min={0} max={360} step={1} className="space-y-1">
              <Numeric.Label showValue>Rotation</Numeric.Label>
              <Numeric.SingleRange showNumberInput />
            </Numeric.Container>

            <Numeric.Container mode="doubleRange" min={-1000} max={3000} step={10} className="space-y-1">
              <Numeric.Label showValue>CT Window</Numeric.Label>
              <Numeric.DoubleRange showNumberInputs />
            </Numeric.Container>
          </div>
        </ExampleBlock>
      </Section>

      <Section title="Usage">
        <CodeBlock
          code={`import { Numeric } from '@ohif/ui-next';

// Number input
<Numeric.Container mode="number" min={0} max={10}>
  <Numeric.Label>Width</Numeric.Label>
  <Numeric.NumberInput />
</Numeric.Container>

// Stepper
<Numeric.Container mode="stepper" min={1} max={30} defaultValue={1}>
  <Numeric.Label>Frame</Numeric.Label>
  <Numeric.NumberStepper direction="horizontal" />
</Numeric.Container>

// Single range slider
<Numeric.Container mode="singleRange" min={0} max={100}>
  <Numeric.Label>Opacity</Numeric.Label>
  <Numeric.SingleRange showNumberInput />
</Numeric.Container>

// Double range slider
<Numeric.Container mode="doubleRange" min={-1000} max={3000} step={10}>
  <Numeric.Label showValue>CT Window</Numeric.Label>
  <Numeric.DoubleRange showNumberInputs />
</Numeric.Container>`}
        />
      </Section>

      <Section title="Props">
        <PropsTable props={containerProps} />
      </Section>
    </ComponentLayout>
  );
}

export default function NumericPage() {
  return (
    <BrowserOnly fallback={<></>}>{() => <NumericPageContent />}</BrowserOnly>
  );
}
