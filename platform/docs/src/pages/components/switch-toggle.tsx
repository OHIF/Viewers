import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

function SwitchPageContent() {
  const { Switch } = require('../../../../ui-next/src/components/Switch');
  const { Label } = require('../../../../ui-next/src/components/Label');
  const ComponentLayout = require('./_layout/ComponentLayout').default;
  const PageHeader = require('./_layout/PageHeader').default;
  const Section = require('./_layout/Section').default;
  const InteractivePicker = require('./_layout/InteractivePicker').default;
  const CodeBlock = require('./_layout/CodeBlock').default;
  const ExampleBlock = require('./_layout/ExampleBlock').default;
  const PropsTable = require('./_layout/PropsTable').default;

  const states = [
    { value: 'off', label: 'Off', description: 'Default state. Muted primary background.' },
    { value: 'on', label: 'On', description: 'Active state. Solid primary background with thumb shifted right.' },
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
      title="Switch"
      description="Toggle control for binary settings"
    >
      <PageHeader
        title="Switch"
        description="A toggle for changing between two states. The preferred control for on/off settings."
      />

      <div className="mb-10">
        <div className="text-secondary-foreground space-y-3 text-lg leading-relaxed">
          <p>
            Switch is the preferred toggle control in OHIF. It provides a larger, more visible
            target than Checkbox and communicates its current state more clearly through its
            sliding thumb animation.
          </p>
          <p>
            Use descriptive labels next to switches that are understandable before interacting.
            In the OHIF Viewer, switches control viewport sync, overlay visibility, and
            panel-level settings.
          </p>
        </div>
      </div>

      <Section title="States">
        <InteractivePicker
          options={states}
          defaultValue="off"
          renderPreview={(active) => (
            <div className="flex items-center space-x-3">
              <Switch
                id="demo"
                checked={active === 'on'}
                disabled={active === 'disabled'}
              />
              <Label htmlFor="demo" className={active === 'disabled' ? 'opacity-50' : ''}>
                Sync changes in all viewports
              </Label>
            </div>
          )}
        />
      </Section>

      <Section title="Examples">
        <ExampleBlock title="With label">
          <div className="flex items-center space-x-3">
            <Switch id="ex1" defaultChecked />
            <Label htmlFor="ex1">Sync changes in all viewports</Label>
          </div>
        </ExampleBlock>

        <ExampleBlock title="Settings list">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="s1">Show overlay</Label>
              <Switch id="s1" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="s2">Show annotations</Label>
              <Switch id="s2" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="s3">Invert colors</Label>
              <Switch id="s3" />
            </div>
          </div>
        </ExampleBlock>

        <ExampleBlock title="Disabled" last>
          <div className="flex items-center space-x-3">
            <Switch id="dis1" disabled />
            <Label htmlFor="dis1" className="opacity-50">Unavailable setting</Label>
          </div>
        </ExampleBlock>
      </Section>

      <Section title="Usage">
        <CodeBlock
          code={`import { Switch } from '@ohif/ui-next';
import { Label } from '@ohif/ui-next';

<div className="flex items-center space-x-2">
  <Switch id="sync" defaultChecked />
  <Label htmlFor="sync">Sync viewports</Label>
</div>`}
        />
      </Section>

      <Section title="Props">
        <PropsTable props={props} />
      </Section>
    </ComponentLayout>
  );
}

export default function SwitchPage() {
  return (
    <BrowserOnly fallback={<></>}>{() => <SwitchPageContent />}</BrowserOnly>
  );
}
