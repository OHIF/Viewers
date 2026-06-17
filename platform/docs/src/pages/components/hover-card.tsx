import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

function HoverCardPageContent() {
  const {
    HoverCard,
    HoverCardTrigger,
    HoverCardContent,
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
    Button,
    Icons,
    DataRow,
    TooltipProvider,
  } = require('../../../../ui-next/src/components');

  const ComponentLayout = require('./_layout/ComponentLayout').default;
  const PageHeader = require('./_layout/PageHeader').default;
  const Section = require('./_layout/Section').default;
  const CodeBlock = require('./_layout/CodeBlock').default;
  const ExampleBlock = require('./_layout/ExampleBlock').default;
  const PropsTable = require('./_layout/PropsTable').default;

  const segments = [
    { title: 'Liver', color: '#E2B93B', stats: { mean: '72.4', std: '18.2', min: '31.0', max: '128.5', volume: '1,847' } },
    { title: 'Spleen', color: '#68B9FF', stats: { mean: '54.1', std: '12.8', min: '22.0', max: '91.3', volume: '423' } },
    { title: 'Left Kidney', color: '#FF6B6B', stats: { mean: '38.7', std: '9.4', min: '15.2', max: '72.1', volume: '312' } },
    { title: 'Right Kidney', color: '#4ECDC4', stats: { mean: '41.2', std: '10.1', min: '18.0', max: '76.8', volume: '298' } },
    { title: 'Aorta', color: '#C084FC', stats: { mean: '62.9', std: '15.6', min: '28.4', max: '105.2', volume: '186' } },
  ];

  const hoverCardProps = [
    { name: 'openDelay', type: 'number', default: '700', description: 'Delay in ms before the card opens' },
    { name: 'closeDelay', type: 'number', default: '300', description: 'Delay in ms before the card closes' },
    { name: 'children', type: 'ReactNode', default: '—', description: 'Must contain HoverCardTrigger and HoverCardContent' },
  ];

  const contentProps = [
    { name: 'side', type: '"top" | "right" | "bottom" | "left"', default: '"bottom"', description: 'Which side of the trigger the card appears on' },
    { name: 'align', type: '"start" | "center" | "end"', default: '"center"', description: 'Alignment relative to the trigger along the side axis' },
    { name: 'sideOffset', type: 'number', default: '4', description: 'Distance in pixels from the trigger' },
    { name: 'className', type: 'string', default: '—', description: 'Additional CSS classes on the content container' },
  ];

  const triggerProps = [
    { name: 'asChild', type: 'boolean', default: 'false', description: 'Merge props onto the child element instead of rendering a span' },
  ];

  return (
    <ComponentLayout
      title="HoverCard"
      description="Rich preview surface on hover"
    >
      <PageHeader
        title="HoverCard"
        description="A non-modal floating card that appears on hover to show rich, structured content."
      />

      <div className="mb-10">
        <div className="text-secondary-foreground space-y-3 text-lg leading-relaxed">
          <p>
            HoverCard is built on Radix UI primitives with three parts:{' '}
            <strong className="text-foreground">HoverCard</strong> (root with open/close delay),{' '}
            <strong className="text-foreground">HoverCardTrigger</strong> (the hover target), and{' '}
            <strong className="text-foreground">HoverCardContent</strong> (the floating surface).
          </p>
          <p>
            Unlike tooltips, hover cards can contain structured layouts — metadata grids,
            statistics, and interactive elements. In the OHIF Viewer, hover cards are used for{' '}
            <strong className="text-foreground">data source configuration</strong> previews,{' '}
            <strong className="text-foreground">segment statistics</strong> in the segmentation panel,
            and <strong className="text-foreground">study/measurement metadata</strong>.
          </p>
        </div>
      </div>

      <Section title="Examples">
        <ExampleBlock title="Data source configuration">
          <div className="flex flex-col items-center gap-3">
            <span className="text-muted-foreground text-sm">
              Hover the Source button to see the configuration card
            </span>
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-sm"
                >
                  <Icons.CloudSettings className="h-5 w-5" />
                  Source
                </Button>
              </HoverCardTrigger>
              <HoverCardContent
                align="center"
                className="w-72 p-0"
              >
                <Card className="border-0 shadow-none">
                  <CardHeader className="p-3 pb-1">
                    <CardDescription className="text-sm">
                      <span className="text-foreground font-semibold">Data Source:</span>{' '}
                      Configure the server connection and storage settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 p-3 pt-0 text-sm">
                    <div className="bg-input col-span-2 my-2 h-px" />
                    <span className="text-muted-foreground">Project</span>
                    <span>ohif-cloud-healthcare</span>
                    <span className="text-muted-foreground">Location</span>
                    <span>us-east1</span>
                    <span className="text-muted-foreground">Data set</span>
                    <span>radiology-primary</span>
                    <span className="text-muted-foreground">DICOM store</span>
                    <span>dicom-store-prod</span>
                  </CardContent>
                </Card>
              </HoverCardContent>
            </HoverCard>
          </div>
        </ExampleBlock>

        <ExampleBlock title="Segment statistics (segmentation list pattern)">
          <div className="flex flex-col items-center gap-3">
            <span className="text-muted-foreground text-sm">
              Hover a segment to see its statistics card
            </span>
            <TooltipProvider>
              <div className="bg-muted w-[280px] rounded-md">
                {segments.map((seg, i) => (
                  <HoverCard key={seg.title} openDelay={300} closeDelay={200}>
                    <HoverCardTrigger asChild>
                      <div>
                        <DataRow
                          number={i + 1}
                          title={seg.title}
                          description=""
                          colorHex={seg.color}
                          isSelected={i === 0}
                          isVisible={true}
                          isLocked={false}
                          disableEditing={false}
                          onSelect={() => {}}
                          onToggleVisibility={() => {}}
                          onToggleLocked={() => {}}
                          onRename={() => {}}
                          onDelete={() => {}}
                          onColor={() => {}}
                        />
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent
                      side="left"
                      align="start"
                      className="w-64 p-0"
                    >
                      <Card className="border-0 shadow-none">
                        <CardHeader className="p-3 pb-1">
                          <div className="flex items-center space-x-2">
                            <div
                              className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                              style={{ backgroundColor: seg.color }}
                            />
                            <CardTitle className="text-muted-foreground text-base">{seg.title}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-1 p-3 pt-0 text-sm">
                          <div className="bg-input my-2 h-px" />
                          {[
                            ['Mean', seg.stats.mean],
                            ['Std Dev', seg.stats.std],
                            ['Min', seg.stats.min],
                            ['Max', seg.stats.max],
                            ['Volume', seg.stats.volume],
                          ].map(([label, value]) => (
                            <div key={label} className="flex justify-between">
                              <span className="text-muted-foreground">{label}</span>
                              <span>
                                <span className="text-foreground">{value}</span>{' '}
                                {label === 'Volume' ? 'mm³' : 'HU'}
                              </span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </HoverCardContent>
                  </HoverCard>
                ))}
              </div>
            </TooltipProvider>
          </div>
        </ExampleBlock>

        <ExampleBlock title="Study metadata preview" last>
          <div className="flex justify-center">
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
          </div>
        </ExampleBlock>
      </Section>

      <Section title="Usage">
        <CodeBlock
          code={`import {
  HoverCard, HoverCardTrigger, HoverCardContent,
  Card, CardHeader, CardTitle, CardContent,
} from '@ohif/ui-next';

// Basic hover card
<HoverCard>
  <HoverCardTrigger asChild>
    <Button variant="link">Hover me</Button>
  </HoverCardTrigger>
  <HoverCardContent>
    <p>Rich preview content here.</p>
  </HoverCardContent>
</HoverCard>

// With Card inside (data source pattern)
<HoverCard>
  <HoverCardTrigger asChild>
    <Button variant="ghost" size="sm">
      <Icons.CloudSettings className="h-5 w-5" />
      Source
    </Button>
  </HoverCardTrigger>
  <HoverCardContent align="center" className="w-72 p-0">
    <Card className="border-0 shadow-none">
      <CardHeader className="p-3 pb-1">
        <CardDescription>Server configuration details</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 p-3 pt-0 text-sm">
        <span className="text-muted-foreground">Project</span>
        <span>my-project</span>
      </CardContent>
    </Card>
  </HoverCardContent>
</HoverCard>

// Side positioning (segmentation list pattern)
<HoverCard openDelay={300} closeDelay={200}>
  <HoverCardTrigger asChild>
    <div>{/* DataRow or other trigger */}</div>
  </HoverCardTrigger>
  <HoverCardContent side="left" align="start" className="w-64 p-0">
    {/* Statistics card */}
  </HoverCardContent>
</HoverCard>`}
        />
      </Section>

      <Section title="Props">
        <div className="space-y-8">
          <div>
            <h3 className="text-highlight mb-3 text-base font-semibold">HoverCard</h3>
            <p className="text-muted-foreground mb-3 text-sm">
              Root component. Controls open/close timing.
            </p>
            <PropsTable props={hoverCardProps} />
          </div>

          <div>
            <h3 className="text-highlight mb-3 text-base font-semibold">HoverCardTrigger</h3>
            <p className="text-muted-foreground mb-3 text-sm">
              The element that activates the hover card. Use asChild to merge onto your own element.
            </p>
            <PropsTable props={triggerProps} />
          </div>

          <div>
            <h3 className="text-highlight mb-3 text-base font-semibold">HoverCardContent</h3>
            <p className="text-muted-foreground mb-3 text-sm">
              The floating surface. Positioned relative to the trigger via side, align, and sideOffset.
            </p>
            <PropsTable props={contentProps} />
          </div>
        </div>
      </Section>
    </ComponentLayout>
  );
}

export default function HoverCardPage() {
  return (
    <BrowserOnly fallback={<></>}>{() => <HoverCardPageContent />}</BrowserOnly>
  );
}
