import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

function TabsPageContent() {
  const { Tabs, TabsList, TabsTrigger, TabsContent } = require('../../../../ui-next/src/components/Tabs');
  const { Separator } = require('../../../../ui-next/src/components/Separator');
  const ComponentLayout = require('./_layout/ComponentLayout').default;
  const PageHeader = require('./_layout/PageHeader').default;
  const Section = require('./_layout/Section').default;
  const CodeBlock = require('./_layout/CodeBlock').default;
  const ExampleBlock = require('./_layout/ExampleBlock').default;
  const PropsTable = require('./_layout/PropsTable').default;

  const props = [
    { name: 'defaultValue', type: 'string', default: '—', description: 'Initial active tab value (uncontrolled)' },
    { name: 'value', type: 'string', default: '—', description: 'Controlled active tab value' },
    { name: 'onValueChange', type: '(value: string) => void', default: '—', description: 'Called when the active tab changes' },
    { name: 'orientation', type: '"horizontal" | "vertical"', default: '"horizontal"', description: 'Layout direction of the tab list' },
  ];

  return (
    <ComponentLayout
      title="Tabs"
      description="Segmented control for switching between views"
    >
      <PageHeader
        title="Tabs"
        description="Organizes content into switchable panels triggered by a tab bar."
      />

      <div className="mb-10">
        <div className="text-secondary-foreground space-y-3 text-lg leading-relaxed">
          <p>
            Tabs is a multi-part component built on Radix UI primitives:{' '}
            <strong className="text-foreground">Tabs</strong> (root),{' '}
            <strong className="text-foreground">TabsList</strong> (tab bar),{' '}
            <strong className="text-foreground">TabsTrigger</strong> (individual tabs),{' '}
            and <strong className="text-foreground">TabsContent</strong> (panels).
          </p>
          <p>
            In the OHIF Viewer, tabs appear as{' '}
            <strong className="text-foreground">segmented controls</strong> for tool settings
            (e.g. brush shape: Circle / Sphere / Square), panel section switchers, and
            configuration option groups.
          </p>
        </div>
      </div>

      <Section title="Examples">
        <ExampleBlock title="Basic tabs with content">
          <Tabs defaultValue="overview" className="w-[320px]">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <p className="text-secondary-foreground text-sm pt-2">Overview panel content goes here.</p>
            </TabsContent>
            <TabsContent value="details">
              <p className="text-secondary-foreground text-sm pt-2">Details panel content goes here.</p>
            </TabsContent>
            <TabsContent value="history">
              <p className="text-secondary-foreground text-sm pt-2">History panel content goes here.</p>
            </TabsContent>
          </Tabs>
        </ExampleBlock>

        <ExampleBlock title="Segmented control with separators">
          <Tabs defaultValue="circle" className="w-[300px]">
            <TabsList>
              <TabsTrigger value="circle">Circle</TabsTrigger>
              <Separator orientation="vertical" />
              <TabsTrigger value="sphere">Sphere</TabsTrigger>
              <Separator orientation="vertical" />
              <TabsTrigger value="square">Square</TabsTrigger>
            </TabsList>
          </Tabs>
        </ExampleBlock>

        <ExampleBlock title="Two tabs" last>
          <Tabs defaultValue="dark" className="w-[200px]">
            <TabsList>
              <TabsTrigger value="dark">Dark</TabsTrigger>
              <TabsTrigger value="light">Light</TabsTrigger>
            </TabsList>
          </Tabs>
        </ExampleBlock>
      </Section>

      <Section title="Usage">
        <CodeBlock
          code={`import { Tabs, TabsList, TabsTrigger, TabsContent } from '@ohif/ui-next';

<Tabs defaultValue="tab1" onValueChange={(v) => console.log(v)}>
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">First panel</TabsContent>
  <TabsContent value="tab2">Second panel</TabsContent>
</Tabs>`}
        />
      </Section>

      <Section title="Props">
        <PropsTable props={props} />
      </Section>
    </ComponentLayout>
  );
}

export default function TabsPage() {
  return (
    <BrowserOnly fallback={<></>}>{() => <TabsPageContent />}</BrowserOnly>
  );
}
