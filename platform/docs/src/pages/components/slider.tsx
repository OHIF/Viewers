import React, { useState } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

function SliderPageContent() {
  const { Slider } = require('../../../../ui-next/src/components/Slider');
  const { Label } = require('../../../../ui-next/src/components/Label');
  const ComponentLayout = require('./_layout/ComponentLayout').default;
  const PageHeader = require('./_layout/PageHeader').default;
  const Section = require('./_layout/Section').default;
  const CodeBlock = require('./_layout/CodeBlock').default;
  const ExampleBlock = require('./_layout/ExampleBlock').default;
  const PropsTable = require('./_layout/PropsTable').default;

  const props = [
    { name: 'defaultValue', type: 'number[]', default: '—', description: 'Initial value (uncontrolled). Array with one element for single thumb.' },
    { name: 'value', type: 'number[]', default: '—', description: 'Controlled value' },
    { name: 'onValueChange', type: '(value: number[]) => void', default: '—', description: 'Called on every value change during drag' },
    { name: 'onValueCommit', type: '(value: number[]) => void', default: '—', description: 'Called when the user releases the thumb' },
    { name: 'min', type: 'number', default: '0', description: 'Minimum value' },
    { name: 'max', type: 'number', default: '100', description: 'Maximum value' },
    { name: 'step', type: 'number', default: '1', description: 'Step increment between values' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables interaction and reduces opacity' },
  ];

  function SliderWithValue({ defaultValue = [50], min = 0, max = 100, step = 1, label = '' }) {
    const [val, setVal] = useState(defaultValue);
    return (
      <div className="flex items-center gap-4">
        {label && <Label className="w-28 shrink-0">{label}</Label>}
        <Slider
          className="w-48"
          value={val}
          onValueChange={setVal}
          min={min}
          max={max}
          step={step}
        />
        <span className="text-muted-foreground w-10 text-right font-mono text-sm">{val[0]}</span>
      </div>
    );
  }

  return (
    <ComponentLayout
      title="Slider"
      description="Range control for selecting a numeric value"
    >
      <PageHeader
        title="Slider"
        description="A draggable thumb control for selecting a value within a range."
      />

      <div className="mb-10">
        <div className="text-secondary-foreground space-y-3 text-lg leading-relaxed">
          <p>
            Slider provides a visual way to select a numeric value by dragging a thumb along
            a track. It's built on Radix UI's Slider primitive with custom styling for the
            OHIF dark theme.
          </p>
          <p>
            In the OHIF Viewer, sliders appear in{' '}
            <strong className="text-foreground">window/level adjustments</strong>,{' '}
            <strong className="text-foreground">opacity controls</strong> for overlays
            and segmentations, and <strong className="text-foreground">threshold settings</strong>{' '}
            in segmentation tools.
          </p>
        </div>
      </div>

      <Section title="Examples">
        <ExampleBlock title="Basic slider">
          <div className="w-64 px-2">
            <Slider defaultValue={[50]} max={100} step={1} />
          </div>
        </ExampleBlock>

        <ExampleBlock title="With live value display">
          <SliderWithValue defaultValue={[75]} />
        </ExampleBlock>

        <ExampleBlock title="Labeled controls">
          <div className="space-y-4">
            <SliderWithValue defaultValue={[80]} label="Opacity" />
            <SliderWithValue defaultValue={[40]} min={-1000} max={1000} step={10} label="Window Center" />
            <SliderWithValue defaultValue={[400]} min={1} max={2000} step={10} label="Window Width" />
          </div>
        </ExampleBlock>

        <ExampleBlock title="Disabled" last>
          <div className="w-64 px-2">
            <Slider defaultValue={[30]} max={100} step={1} disabled />
          </div>
        </ExampleBlock>
      </Section>

      <Section title="Usage">
        <CodeBlock
          code={`import { Slider } from '@ohif/ui-next';

<Slider
  defaultValue={[50]}
  min={0}
  max={100}
  step={1}
  onValueChange={(value) => console.log(value[0])}
/>`}
        />
      </Section>

      <Section title="Props">
        <PropsTable props={props} />
      </Section>
    </ComponentLayout>
  );
}

export default function SliderPage() {
  return (
    <BrowserOnly fallback={<></>}>{() => <SliderPageContent />}</BrowserOnly>
  );
}
