import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

function LabelPageContent() {
  const { Label } = require('../../../../ui-next/src/components/Label');
  const { Switch } = require('../../../../ui-next/src/components/Switch');
  const { Checkbox } = require('../../../../ui-next/src/components/Checkbox');
  const { Input } = require('../../../../ui-next/src/components/Input');
  const ComponentLayout = require('./_layout/ComponentLayout').default;
  const PageHeader = require('./_layout/PageHeader').default;
  const Section = require('./_layout/Section').default;
  const CodeBlock = require('./_layout/CodeBlock').default;
  const ExampleBlock = require('./_layout/ExampleBlock').default;
  const PropsTable = require('./_layout/PropsTable').default;

  const props = [
    { name: 'htmlFor', type: 'string', default: '—', description: 'ID of the associated form control' },
    { name: 'className', type: 'string', default: '—', description: 'Additional CSS classes merged via cn()' },
  ];

  return (
    <ComponentLayout
      title="Label"
      description="Accessible text label for form controls"
    >
      <PageHeader
        title="Label"
        description="Associates descriptive text with a form control for clarity and accessibility."
      />

      <div className="mb-10">
        <div className="text-secondary-foreground space-y-3 text-lg leading-relaxed">
          <p>
            Label renders accessible text linked to a form control via the{' '}
            <strong className="text-foreground">htmlFor</strong> prop. Built on Radix UI's Label
            primitive, it automatically handles click-to-focus and screen reader association.
          </p>
          <p>
            Always pair labels with interactive controls — inputs, switches, checkboxes, and selects.
            Labels improve usability by expanding the clickable area and providing context.
          </p>
        </div>
      </div>

      <Section title="Examples">
        <ExampleBlock title="With Switch">
          <div className="flex items-center gap-3">
            <Switch id="l-sw" defaultChecked />
            <Label htmlFor="l-sw">Preview edits before creating</Label>
          </div>
        </ExampleBlock>

        <ExampleBlock title="With Checkbox">
          <div className="flex items-center gap-3">
            <Checkbox id="l-cb" defaultChecked />
            <Label htmlFor="l-cb">Display inactive segmentations</Label>
          </div>
        </ExampleBlock>

        <ExampleBlock title="With Input">
          <div className="max-w-xs">
            <Label htmlFor="l-in" className="mb-1 block">Patient Weight</Label>
            <Input id="l-in" placeholder="(kg)" />
          </div>
        </ExampleBlock>

        <ExampleBlock title="Disabled state" last>
          <div className="flex items-center gap-3">
            <Switch id="l-dis" disabled />
            <Label htmlFor="l-dis" className="opacity-50">Unavailable setting</Label>
          </div>
        </ExampleBlock>
      </Section>

      <Section title="Usage">
        <CodeBlock
          code={`import { Label } from '@ohif/ui-next';

<Label htmlFor="name">Patient Name</Label>
<Input id="name" placeholder="Enter name..." />`}
        />
      </Section>

      <Section title="Props">
        <PropsTable props={props} />
      </Section>
    </ComponentLayout>
  );
}

export default function LabelPage() {
  return (
    <BrowserOnly fallback={<></>}>{() => <LabelPageContent />}</BrowserOnly>
  );
}
