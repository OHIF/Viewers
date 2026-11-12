import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

function CheckboxPageContent() {
  const { Checkbox } = require('../../../../ui-next/src/components/Checkbox');
  const { Label } = require('../../../../ui-next/src/components/Label');
  const ComponentLayout = require('./_layout/ComponentLayout').default;
  const PageHeader = require('./_layout/PageHeader').default;
  const Section = require('./_layout/Section').default;
  const InteractivePicker = require('./_layout/InteractivePicker').default;
  const CodeBlock = require('./_layout/CodeBlock').default;
  const ExampleBlock = require('./_layout/ExampleBlock').default;
  const PropsTable = require('./_layout/PropsTable').default;

  const states = [
    { value: 'unchecked', label: 'Unchecked', description: 'Default state. Empty border.' },
    { value: 'checked', label: 'Checked', description: 'Active state. Filled with primary color and check icon.' },
    { value: 'disabled', label: 'Disabled', description: 'Non-interactive. Reduced opacity.' },
  ];

  const props = [
    { name: 'checked', type: 'boolean', default: '—', description: 'Controlled checked state' },
    { name: 'defaultChecked', type: 'boolean', default: 'false', description: 'Initial checked state (uncontrolled)' },
    { name: 'onCheckedChange', type: '(checked: boolean) => void', default: '—', description: 'Called when the checked state changes' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables interaction and reduces opacity' },
    { name: 'className', type: 'string', default: '—', description: 'Additional CSS classes merged via cn()' },
  ];

  return (
    <ComponentLayout
      title="Checkbox"
      description="Boolean toggle for form controls"
    >
      <PageHeader
        title="Checkbox"
        description="A small control for toggling between two states. Prefer Switch when space allows."
      />

      <div className="mb-10">
        <div className="text-secondary-foreground space-y-3 text-lg leading-relaxed">
          <p>
            Checkbox provides a compact boolean toggle built on Radix UI primitives.
            When possible, prefer <strong className="text-foreground">Switch</strong> for
            better visibility and touch targets. Use Checkbox when space is constrained
            or when multiple options appear in a list.
          </p>
          <p>
            In the OHIF Viewer, checkboxes appear in settings panels and segmentation
            controls where multiple independent options need toggling.
          </p>
        </div>
      </div>

      <Section title="States">
        <InteractivePicker
          options={states}
          defaultValue="unchecked"
          renderPreview={(active) => (
            <div className="flex items-center space-x-3">
              <Checkbox
                id="demo"
                checked={active === 'checked'}
                disabled={active === 'disabled'}
              />
              <Label htmlFor="demo" className={active === 'disabled' ? 'opacity-50' : ''}>
                Display inactive segmentations
              </Label>
            </div>
          )}
        />
      </Section>

      <Section title="Examples">
        <ExampleBlock title="With label">
          <div className="flex items-center space-x-3">
            <Checkbox id="ex1" defaultChecked />
            <Label htmlFor="ex1">Display inactive segmentations</Label>
          </div>
        </ExampleBlock>

        <ExampleBlock title="Multiple options">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox id="opt1" defaultChecked />
              <Label htmlFor="opt1">Show annotations</Label>
            </div>
            <div className="flex items-center space-x-3">
              <Checkbox id="opt2" />
              <Label htmlFor="opt2">Show measurements</Label>
            </div>
            <div className="flex items-center space-x-3">
              <Checkbox id="opt3" defaultChecked />
              <Label htmlFor="opt3">Show segmentations</Label>
            </div>
          </div>
        </ExampleBlock>

        <ExampleBlock title="Disabled" last>
          <div className="flex items-center space-x-3">
            <Checkbox id="dis1" disabled />
            <Label htmlFor="dis1" className="opacity-50">Unavailable option</Label>
          </div>
        </ExampleBlock>
      </Section>

      <Section title="Usage">
        <CodeBlock
          code={`import { Checkbox } from '@ohif/ui-next';
import { Label } from '@ohif/ui-next';

<div className="flex items-center space-x-2">
  <Checkbox id="option" />
  <Label htmlFor="option">Enable feature</Label>
</div>`}
        />
      </Section>

      <Section title="Props">
        <PropsTable props={props} />
      </Section>
    </ComponentLayout>
  );
}

export default function CheckboxPage() {
  return (
    <BrowserOnly fallback={<></>}>{() => <CheckboxPageContent />}</BrowserOnly>
  );
}
