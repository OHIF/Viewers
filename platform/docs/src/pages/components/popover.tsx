import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

function PopoverPageContent() {
  const {
    Popover,
    PopoverTrigger,
    PopoverContent,
  } = require('../../../../ui-next/src/components/Popover/Popover');
  const { Button } = require('../../../../ui-next/src/components/Button');
  const { Input } = require('../../../../ui-next/src/components/Input');
  const { Label } = require('../../../../ui-next/src/components/Label');
  const ComponentLayout = require('./_layout/ComponentLayout').default;
  const PageHeader = require('./_layout/PageHeader').default;
  const Section = require('./_layout/Section').default;
  const CodeBlock = require('./_layout/CodeBlock').default;
  const ExampleBlock = require('./_layout/ExampleBlock').default;
  const PropsTable = require('./_layout/PropsTable').default;

  const props = [
    { name: 'align', type: '"start" | "center" | "end"', default: '"center"', description: 'Horizontal alignment relative to the trigger (on PopoverContent)' },
    { name: 'side', type: '"top" | "right" | "bottom" | "left"', default: '"bottom"', description: 'Which side of the trigger the popover opens on (on PopoverContent)' },
    { name: 'sideOffset', type: 'number', default: '4', description: 'Distance in pixels from the trigger (on PopoverContent)' },
  ];

  return (
    <ComponentLayout
      title="Popover"
      description="Floating panel for forms and extra details"
    >
      <PageHeader
        title="Popover"
        description="A floating panel that appears on click for small forms, actions, or additional details."
      />

      <div className="mb-10">
        <div className="text-secondary-foreground space-y-3 text-lg leading-relaxed">
          <p>
            Popover is a multi-part component built on Radix UI primitives:{' '}
            <strong className="text-foreground">Popover</strong> (root),{' '}
            <strong className="text-foreground">PopoverTrigger</strong>, and{' '}
            <strong className="text-foreground">PopoverContent</strong>. It also exports{' '}
            <strong className="text-foreground">PopoverAnchor</strong> for custom positioning.
          </p>
          <p>
            Unlike tooltips which show on hover, popovers require a click and can contain
            interactive content like inputs and buttons. In the OHIF Viewer, popovers are
            used for inline settings, color pickers, and compact option panels.
          </p>
        </div>
      </div>

      <Section title="Examples">
        <ExampleBlock title="Basic popover">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Open Popover</Button>
            </PopoverTrigger>
            <PopoverContent className="w-60">
              <p className="text-secondary-foreground text-sm">
                Click outside or press Escape to close.
              </p>
            </PopoverContent>
          </Popover>
        </ExampleBlock>

        <ExampleBlock title="With form content">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="secondary">Edit Window</Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="pop-wc" className="mb-1 block text-sm">Window Center</Label>
                  <Input id="pop-wc" type="number" placeholder="40" />
                </div>
                <div>
                  <Label htmlFor="pop-ww" className="mb-1 block text-sm">Window Width</Label>
                  <Input id="pop-ww" type="number" placeholder="400" />
                </div>
                <Button variant="default" size="sm" className="w-full">Apply</Button>
              </div>
            </PopoverContent>
          </Popover>
        </ExampleBlock>

        <ExampleBlock title="Alignment" last>
          <div className="flex flex-wrap gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">Align Start</Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-48">
                <p className="text-secondary-foreground text-sm">Aligned to start</p>
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">Side Right</Button>
              </PopoverTrigger>
              <PopoverContent side="right" className="w-48">
                <p className="text-secondary-foreground text-sm">Opens to the right</p>
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">Side Top</Button>
              </PopoverTrigger>
              <PopoverContent side="top" className="w-48">
                <p className="text-secondary-foreground text-sm">Opens above</p>
              </PopoverContent>
            </Popover>
          </div>
        </ExampleBlock>
      </Section>

      <Section title="Usage">
        <CodeBlock
          code={`import { Popover, PopoverTrigger, PopoverContent } from '@ohif/ui-next';

<Popover>
  <PopoverTrigger asChild>
    <Button>Open</Button>
  </PopoverTrigger>
  <PopoverContent>
    <p>Popover content here.</p>
  </PopoverContent>
</Popover>`}
        />
      </Section>

      <Section title="Props">
        <PropsTable props={props} />
      </Section>
    </ComponentLayout>
  );
}

export default function PopoverPage() {
  return (
    <BrowserOnly fallback={<></>}>{() => <PopoverPageContent />}</BrowserOnly>
  );
}
