import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

function ButtonPageContent() {
  const { Button } = require('../../../../ui-next/src/components/Button');
  const { Icons } = require('../../../../ui-next/src/components/Icons');
  const ComponentLayout = require('./_layout/ComponentLayout').default;
  const PageHeader = require('./_layout/PageHeader').default;
  const Section = require('./_layout/Section').default;
  const InteractivePicker = require('./_layout/InteractivePicker').default;
  const CodeBlock = require('./_layout/CodeBlock').default;
  const ExampleBlock = require('./_layout/ExampleBlock').default;
  const PropsTable = require('./_layout/PropsTable').default;

  const variants = [
    { value: 'default', label: 'Default', description: 'Primary action. Solid blue background.' },
    { value: 'secondary', label: 'Secondary', description: 'Secondary action. Muted blue background.' },
    { value: 'ghost', label: 'Ghost', description: 'Minimal emphasis. Transparent until hovered. Used in toolbars and panels.' },
    { value: 'outline', label: 'Outline', description: 'Border-only with transparent fill. Presence without weight.' },
    { value: 'link', label: 'Link', description: 'Inline text with underline on hover. For navigation-style actions.' },
    { value: 'destructive', label: 'Destructive', description: 'Red background for dangerous or irreversible actions.' },
  ];

  const sizes = [
    { value: 'sm', label: 'Small', description: 'Compact. Height: 24px (h-6).' },
    { value: 'default', label: 'Default', description: 'Standard. Height: 28px (h-7).' },
    { value: 'lg', label: 'Large', description: 'Height: 36px (h-9). For prominent dialog actions.' },
    { value: 'icon', label: 'Icon', description: 'Square icon button. 24×24px (h-6 w-6).' },
  ];

  const props = [
    { name: 'variant', type: '"default" | "secondary" | "ghost" | "outline" | "link" | "destructive"', default: '"default"', description: 'Visual style variant' },
    { name: 'size', type: '"default" | "sm" | "lg" | "icon"', default: '"default"', description: 'Button size' },
    { name: 'asChild', type: 'boolean', default: 'false', description: 'Merge props onto child element instead of rendering a button' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables interaction and reduces opacity' },
    { name: 'className', type: 'string', default: '—', description: 'Additional CSS classes merged via cn()' },
  ];

  return (
    <ComponentLayout
      title="Button"
      description="Primary action component with multiple variants and sizes"
    >
      <PageHeader
        title="Button"
        description="Triggers an action or event. Use variants to communicate hierarchy and intent."
      />

      {/* Description */}
      <div className="mb-10">
        <div className="text-secondary-foreground space-y-3 text-lg leading-relaxed">
          <p>
            The Button component is the primary interactive element for triggering actions.
            It supports six variants to express different levels of emphasis and intent.
          </p>
          <p>
            In the OHIF Viewer, <strong className="text-foreground">default</strong> (primary)
            buttons appear in dialogs and confirmation screens where a single action is required.{' '}
            <strong className="text-foreground">Ghost</strong> buttons are used throughout panels
            and toolbars where many actions compete for attention.{' '}
            <strong className="text-foreground">Secondary</strong> buttons pair with primary buttons
            when a less prominent alternative is needed.
          </p>
        </div>
      </div>

      <Section title="Variants">
        <InteractivePicker
          options={variants}
          defaultValue="default"
          renderPreview={(active) => (
            <Button variant={active as any}>
              {active === 'destructive' ? 'Delete' : `${variants.find(v => v.value === active)?.label} Button`}
            </Button>
          )}
        />
      </Section>

      <Section title="Sizes">
        <InteractivePicker
          options={sizes}
          defaultValue="default"
          renderPreview={(active) =>
            active === 'icon' ? (
              <Button variant="ghost" size="icon">
                <Icons.More />
              </Button>
            ) : (
              <Button variant="default" size={active as any}>
                {sizes.find(s => s.value === active)?.label} Button
              </Button>
            )
          }
        />
      </Section>

      <Section title="Examples">
        <ExampleBlock title="Dialog footer">
          <div className="flex justify-end gap-2">
            <Button variant="ghost">Cancel</Button>
            <Button variant="default">Confirm</Button>
          </div>
        </ExampleBlock>

        <ExampleBlock title="Button with icon">
          <div className="flex gap-3">
            <Button variant="default">
              <Icons.Add className="mr-1.5 h-4 w-4" />
              Add Segment
            </Button>
            <Button variant="ghost">
              <Icons.Settings className="mr-1.5 h-4 w-4" />
              Settings
            </Button>
          </div>
        </ExampleBlock>

        <ExampleBlock title="Disabled state" last>
          <div className="flex gap-3">
            <Button variant="default" disabled>Disabled</Button>
            <Button variant="ghost" disabled>Disabled Ghost</Button>
          </div>
        </ExampleBlock>
      </Section>

      <Section title="Usage">
        <CodeBlock
          code={`import { Button } from '@ohif/ui-next';

<Button variant="default">Click me</Button>
<Button variant="ghost" size="sm">Settings</Button>
<Button variant="destructive">Delete</Button>`}
        />
      </Section>

      <Section title="Props">
        <PropsTable props={props} />
      </Section>
    </ComponentLayout>
  );
}

export default function ButtonPage() {
  return (
    <BrowserOnly fallback={<></>}>{() => <ButtonPageContent />}</BrowserOnly>
  );
}
