import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

function SelectPageContent() {
  const {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
    SelectGroup,
    SelectLabel,
    SelectSeparator,
  } = require('../../../../ui-next/src/components/Select');
  const { Label } = require('../../../../ui-next/src/components/Label');
  const ComponentLayout = require('./_layout/ComponentLayout').default;
  const PageHeader = require('./_layout/PageHeader').default;
  const Section = require('./_layout/Section').default;
  const CodeBlock = require('./_layout/CodeBlock').default;
  const ExampleBlock = require('./_layout/ExampleBlock').default;
  const PropsTable = require('./_layout/PropsTable').default;

  const props = [
    { name: 'value', type: 'string', default: '—', description: 'Controlled selected value' },
    { name: 'defaultValue', type: 'string', default: '—', description: 'Initial value (uncontrolled)' },
    { name: 'onValueChange', type: '(value: string) => void', default: '—', description: 'Called when selection changes' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the entire select' },
    { name: 'placeholder', type: 'string', default: '—', description: 'Text shown when no value is selected (on SelectValue)' },
  ];

  return (
    <ComponentLayout
      title="Select"
      description="Dropdown for choosing from a list of options"
    >
      <PageHeader
        title="Select"
        description="A dropdown control for selecting a single value from a predefined list."
      />

      <div className="mb-10">
        <div className="text-secondary-foreground space-y-3 text-lg leading-relaxed">
          <p>
            Select is a multi-part component built on Radix UI primitives:{' '}
            <strong className="text-foreground">Select</strong> (root),{' '}
            <strong className="text-foreground">SelectTrigger</strong> (button),{' '}
            <strong className="text-foreground">SelectContent</strong> (dropdown),{' '}
            and <strong className="text-foreground">SelectItem</strong> (options).
          </p>
          <p>
            In the OHIF Viewer, selects appear in segmentation panels for choosing the active
            segmentation, in settings for display presets, and throughout dialogs for configuration options.
          </p>
        </div>
      </div>

      <Section title="Examples">
        <ExampleBlock title="Basic">
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </ExampleBlock>

        <ExampleBlock title="With label">
          <div className="flex items-center gap-4">
            <Label>Display Set</Label>
            <Select defaultValue="ct">
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ct">CT Axial</SelectItem>
                <SelectItem value="pet">PET Coronal</SelectItem>
                <SelectItem value="seg">Segmentation</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </ExampleBlock>

        <ExampleBlock title="With groups and separator">
          <Select>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select modality" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Common</SelectLabel>
                <SelectItem value="ct">CT</SelectItem>
                <SelectItem value="mr">MR</SelectItem>
                <SelectItem value="us">US</SelectItem>
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Nuclear</SelectLabel>
                <SelectItem value="pt">PT</SelectItem>
                <SelectItem value="nm">NM</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </ExampleBlock>

        <ExampleBlock title="Disabled" last>
          <Select disabled>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Disabled" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a">Option A</SelectItem>
            </SelectContent>
          </Select>
        </ExampleBlock>
      </Section>

      <Section title="Usage">
        <CodeBlock
          code={`import {
  Select, SelectTrigger, SelectContent,
  SelectItem, SelectValue,
} from '@ohif/ui-next';

<Select>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Theme" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="light">Light</SelectItem>
    <SelectItem value="dark">Dark</SelectItem>
    <SelectItem value="system">System</SelectItem>
  </SelectContent>
</Select>`}
        />
      </Section>

      <Section title="Props">
        <PropsTable props={props} />
      </Section>
    </ComponentLayout>
  );
}

export default function SelectPage() {
  return (
    <BrowserOnly fallback={<></>}>{() => <SelectPageContent />}</BrowserOnly>
  );
}
