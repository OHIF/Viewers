import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

function HoverCardPageContent() {
  const {
    HoverCard,
    HoverCardTrigger,
    HoverCardContent,
  } = require('../../../../ui-next/src/components/HoverCard/HoverCard');
  const { Button } = require('../../../../ui-next/src/components/Button');
  const ComponentLayout = require('./_layout/ComponentLayout').default;
  const PageHeader = require('./_layout/PageHeader').default;
  const Section = require('./_layout/Section').default;
  const CodeBlock = require('./_layout/CodeBlock').default;
  const ExampleBlock = require('./_layout/ExampleBlock').default;
  const PropsTable = require('./_layout/PropsTable').default;

  const props = [
    { name: 'align', type: '"start" | "center" | "end"', default: '"center"', description: 'Horizontal alignment relative to the trigger (on HoverCardContent)' },
    { name: 'side', type: '"top" | "right" | "bottom" | "left"', default: '"bottom"', description: 'Which side of the trigger the card appears on (on HoverCardContent)' },
    { name: 'sideOffset', type: 'number', default: '4', description: 'Distance in pixels from the trigger (on HoverCardContent)' },
    { name: 'openDelay', type: 'number', default: '700', description: 'Delay in ms before the card opens (on HoverCard root)' },
    { name: 'closeDelay', type: 'number', default: '300', description: 'Delay in ms before the card closes (on HoverCard root)' },
  ];

  return (
    <ComponentLayout
      title="HoverCard"
      description="Rich preview surface on hover"
    >
      <PageHeader
        title="HoverCard"
        description="A non-modal floating card that appears on hover to show richer content than a tooltip."
      />

      <div className="mb-10">
        <div className="text-secondary-foreground space-y-3 text-lg leading-relaxed">
          <p>
            HoverCard is a multi-part component built on Radix UI primitives:{' '}
            <strong className="text-foreground">HoverCard</strong> (root),{' '}
            <strong className="text-foreground">HoverCardTrigger</strong>, and{' '}
            <strong className="text-foreground">HoverCardContent</strong>.
          </p>
          <p>
            Unlike tooltips, hover cards can contain structured content — text, metadata,
            and formatted details. They're useful for previewing information without
            navigating away. In the OHIF Viewer, hover cards can show study metadata,
            measurement details, or segment information on hover.
          </p>
        </div>
      </div>

      <Section title="Examples">
        <ExampleBlock title="Basic hover card">
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="link">Hover me</Button>
            </HoverCardTrigger>
            <HoverCardContent>
              <p className="text-secondary-foreground text-sm">
                A lightweight preview surface that appears on hover.
              </p>
            </HoverCardContent>
          </HoverCard>
        </ExampleBlock>

        <ExampleBlock title="Study metadata preview">
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="link">CT Chest w/ Contrast</Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-72">
              <div className="space-y-2">
                <p className="text-foreground text-sm font-medium">CT Chest w/ Contrast</p>
                <div className="text-secondary-foreground space-y-1 text-xs">
                  <p><span className="text-muted-foreground">Patient:</span> DOE^JOHN</p>
                  <p><span className="text-muted-foreground">MRN:</span> 123456</p>
                  <p><span className="text-muted-foreground">Date:</span> 2024-03-15</p>
                  <p><span className="text-muted-foreground">Series:</span> 4 · <span className="text-muted-foreground">Images:</span> 512</p>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </ExampleBlock>

        <ExampleBlock title="Measurement detail" last>
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="link">Lesion 1 — 24.3 mm</Button>
            </HoverCardTrigger>
            <HoverCardContent align="start" className="w-64">
              <div className="space-y-2">
                <p className="text-foreground text-sm font-medium">Lesion 1</p>
                <div className="text-secondary-foreground space-y-1 text-xs">
                  <p><span className="text-muted-foreground">Tool:</span> Bidirectional</p>
                  <p><span className="text-muted-foreground">Long axis:</span> 24.3 mm</p>
                  <p><span className="text-muted-foreground">Short axis:</span> 18.1 mm</p>
                  <p><span className="text-muted-foreground">Series:</span> CT Axial 2.0mm</p>
                  <p><span className="text-muted-foreground">Slice:</span> 142 / 512</p>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </ExampleBlock>
      </Section>

      <Section title="Usage">
        <CodeBlock
          code={`import { HoverCard, HoverCardTrigger, HoverCardContent } from '@ohif/ui-next';

<HoverCard>
  <HoverCardTrigger asChild>
    <Button variant="link">Hover me</Button>
  </HoverCardTrigger>
  <HoverCardContent>
    <p>Rich preview content here.</p>
  </HoverCardContent>
</HoverCard>`}
        />
      </Section>

      <Section title="Props">
        <PropsTable props={props} />
      </Section>
    </ComponentLayout>
  );
}

export default function HoverCardPage() {
  return (
    <BrowserOnly fallback={<></>}>{() => <HoverCardPageContent />}</BrowserOnly>
  );
}
