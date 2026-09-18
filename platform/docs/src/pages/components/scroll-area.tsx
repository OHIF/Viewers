import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

function ScrollAreaPageContent() {
  const { ScrollArea } = require('../../../../ui-next/src/components/ScrollArea');
  const ComponentLayout = require('./_layout/ComponentLayout').default;
  const PageHeader = require('./_layout/PageHeader').default;
  const Section = require('./_layout/Section').default;
  const CodeBlock = require('./_layout/CodeBlock').default;
  const ExampleBlock = require('./_layout/ExampleBlock').default;
  const PropsTable = require('./_layout/PropsTable').default;

  const tags = [
    'CT Axial 2.0mm', 'CT Coronal 2.0mm', 'CT Sagittal 2.0mm',
    'PET Axial', 'PET Coronal', 'PET MIP',
    'Segmentation — Liver', 'Segmentation — Spleen', 'Segmentation — Kidney L',
    'Segmentation — Kidney R', 'Segmentation — Aorta', 'RTSTRUCT',
    'Key Images', 'Prior CT 2023-01-15', 'Prior CT 2022-06-20',
  ];

  const props = [
    { name: 'showArrows', type: 'boolean', default: 'false', description: 'Shows gradient arrow indicators at top/bottom when content is scrollable' },
    { name: 'type', type: '"auto" | "always" | "scroll"', default: '"auto"', description: 'Scrollbar visibility behavior' },
    { name: 'className', type: 'string', default: '—', description: 'Additional CSS classes on the root element' },
  ];

  return (
    <ComponentLayout
      title="ScrollArea"
      description="Custom scrollbar container for overflow content"
    >
      <PageHeader
        title="ScrollArea"
        description="A container with custom-styled scrollbars that replace native browser scrollbars."
      />

      <div className="mb-10">
        <div className="text-secondary-foreground space-y-3 text-lg leading-relaxed">
          <p>
            ScrollArea provides consistent, theme-aware scrollbars across all platforms.
            Built on Radix UI's ScrollArea primitive, it replaces native scrollbars with
            a slim track and thumb styled for the OHIF dark theme.
          </p>
          <p>
            In the OHIF Viewer, scroll areas wrap{' '}
            <strong className="text-foreground">panel content</strong>,{' '}
            <strong className="text-foreground">measurement lists</strong>,{' '}
            <strong className="text-foreground">segmentation lists</strong>, and any
            container where content may exceed the visible area. The optional{' '}
            <strong className="text-foreground">showArrows</strong> prop adds gradient
            indicators at the top and bottom edges.
          </p>
        </div>
      </div>

      <Section title="Examples">
        <ExampleBlock title="Text content">
          <ScrollArea className="border-border bg-muted/30 h-[150px] w-[350px] rounded-md border p-3">
            <p className="text-secondary-foreground text-sm leading-relaxed">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
              nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
              fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
              culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet,
              consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
              magna aliqua.
            </p>
          </ScrollArea>
        </ExampleBlock>

        <ExampleBlock title="List of items">
          <ScrollArea className="border-border h-[200px] w-[280px] rounded-md border">
            <div className="p-2">
              {tags.map((tag) => (
                <div
                  key={tag}
                  className="text-secondary-foreground border-border border-b px-2 py-2 text-sm last:border-0"
                >
                  {tag}
                </div>
              ))}
            </div>
          </ScrollArea>
        </ExampleBlock>

        <ExampleBlock title="With scroll arrows" last>
          <ScrollArea showArrows className="border-border h-[200px] w-[280px] rounded-md border">
            <div className="p-2">
              {tags.map((tag) => (
                <div
                  key={tag}
                  className="text-secondary-foreground border-border border-b px-2 py-2 text-sm last:border-0"
                >
                  {tag}
                </div>
              ))}
            </div>
          </ScrollArea>
        </ExampleBlock>
      </Section>

      <Section title="Usage">
        <CodeBlock
          code={`import { ScrollArea } from '@ohif/ui-next';

<ScrollArea className="h-[300px]">
  {/* Long content here */}
</ScrollArea>

// With scroll arrows
<ScrollArea showArrows className="h-[300px]">
  {/* Long content here */}
</ScrollArea>`}
        />
      </Section>

      <Section title="Props">
        <PropsTable props={props} />
      </Section>
    </ComponentLayout>
  );
}

export default function ScrollAreaPage() {
  return (
    <BrowserOnly fallback={<></>}>{() => <ScrollAreaPageContent />}</BrowserOnly>
  );
}
