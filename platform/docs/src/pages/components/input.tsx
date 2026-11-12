import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

function InputPageContent() {
  const { Input } = require('../../../../ui-next/src/components/Input');
  const { Label } = require('../../../../ui-next/src/components/Label');
  const ComponentLayout = require('./_layout/ComponentLayout').default;
  const PageHeader = require('./_layout/PageHeader').default;
  const Section = require('./_layout/Section').default;
  const InteractivePicker = require('./_layout/InteractivePicker').default;
  const CodeBlock = require('./_layout/CodeBlock').default;
  const ExampleBlock = require('./_layout/ExampleBlock').default;
  const PropsTable = require('./_layout/PropsTable').default;

  const types = [
    { value: 'text', label: 'Text', description: 'Default text input.' },
    { value: 'number', label: 'Number', description: 'Numeric input with stepper controls.' },
    { value: 'password', label: 'Password', description: 'Masked input for sensitive values.' },
    { value: 'search', label: 'Search', description: 'Search input with clear affordance in some browsers.' },
  ];

  const props = [
    { name: 'type', type: 'string', default: '"text"', description: 'HTML input type (text, number, password, search, etc.)' },
    { name: 'placeholder', type: 'string', default: '—', description: 'Placeholder text shown when empty' },
    { name: 'value', type: 'string', default: '—', description: 'Controlled input value' },
    { name: 'onChange', type: '(e: ChangeEvent) => void', default: '—', description: 'Called when the input value changes' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables interaction and reduces opacity' },
    { name: 'className', type: 'string', default: '—', description: 'Additional CSS classes merged via cn()' },
  ];

  return (
    <ComponentLayout
      title="Input"
      description="Text input field for form data"
    >
      <PageHeader
        title="Input"
        description="A single-line text field for entering and editing values."
      />

      <div className="mb-10">
        <div className="text-secondary-foreground space-y-3 text-lg leading-relaxed">
          <p>
            The Input component is a styled text field that supports all standard HTML input types.
            It features a border on focus, hover highlight, and placeholder text styling.
          </p>
          <p>
            In the OHIF Viewer, inputs appear in dialogs for patient weight, window/level values,
            measurement labels, and search fields throughout panels.
          </p>
        </div>
      </div>

      <Section title="Types">
        <InteractivePicker
          options={types}
          defaultValue="text"
          renderPreview={(active) => (
            <div className="w-64">
              <Input
                type={active}
                placeholder={
                  active === 'number' ? '0'
                  : active === 'password' ? 'Enter password'
                  : active === 'search' ? 'Search...'
                  : 'Enter value'
                }
              />
            </div>
          )}
        />
      </Section>

      <Section title="Examples">
        <ExampleBlock title="With label">
          <div className="flex items-center gap-4">
            <Label htmlFor="ex1">Patient Weight</Label>
            <Input id="ex1" placeholder="(kg)" className="w-32" />
          </div>
        </ExampleBlock>

        <ExampleBlock title="Form layout">
          <div className="max-w-xs space-y-3">
            <div>
              <Label htmlFor="f1" className="mb-1 block">Label</Label>
              <Input id="f1" placeholder="Enter label..." />
            </div>
            <div>
              <Label htmlFor="f2" className="mb-1 block">Description</Label>
              <Input id="f2" placeholder="Optional description..." />
            </div>
          </div>
        </ExampleBlock>

        <ExampleBlock title="Disabled" last>
          <Input placeholder="Disabled input" disabled className="w-64" />
        </ExampleBlock>
      </Section>

      <Section title="Usage">
        <CodeBlock
          code={`import { Input } from '@ohif/ui-next';
import { Label } from '@ohif/ui-next';

<Label htmlFor="weight">Patient Weight</Label>
<Input id="weight" placeholder="(kg)" />`}
        />
      </Section>

      <Section title="Props">
        <PropsTable props={props} />
      </Section>
    </ComponentLayout>
  );
}

export default function InputPage() {
  return (
    <BrowserOnly fallback={<></>}>{() => <InputPageContent />}</BrowserOnly>
  );
}
