import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

function PanelSectionPageContent() {
  const { PanelSection, Button, DataRow, TooltipProvider } = require('../../../../ui-next/src/components');
  const ComponentLayout = require('./_layout/ComponentLayout').default;
  const PageHeader = require('./_layout/PageHeader').default;
  const Section = require('./_layout/Section').default;
  const InteractivePicker = require('./_layout/InteractivePicker').default;
  const CodeBlock = require('./_layout/CodeBlock').default;
  const ExampleBlock = require('./_layout/ExampleBlock').default;
  const PropsTable = require('./_layout/PropsTable').default;

  const noop = (e) => e?.stopPropagation?.();

  const states = [
    { value: 'open', label: 'Open', description: 'Expanded state. Header shows a downward chevron, content is visible.' },
    { value: 'closed', label: 'Closed', description: 'Collapsed state. Header shows a rightward chevron, content is hidden.' },
  ];

  const props = [
    { name: 'defaultOpen', type: 'boolean', default: 'true', description: 'Whether the section is expanded on first render' },
    { name: 'className', type: 'string', default: '—', description: 'Additional classes on the root accordion container' },
  ];

  const headerProps = [
    { name: 'children', type: 'ReactNode', default: '—', description: 'Header text or content displayed in the trigger bar' },
    { name: 'className', type: 'string', default: '—', description: 'Additional classes on the trigger element' },
  ];

  const contentProps = [
    { name: 'children', type: 'ReactNode', default: '—', description: 'Content shown when the section is expanded' },
    { name: 'className', type: 'string', default: '—', description: 'Additional classes on the content wrapper' },
  ];

  return (
    <TooltipProvider>
      <ComponentLayout
        title="PanelSection"
        description="Collapsible panel section"
      >
        <PageHeader
          title="PanelSection"
          description="A collapsible section for grouping controls and metadata inside side panels."
        />

        <div className="mb-10">
          <div className="text-secondary-foreground space-y-3 text-lg leading-relaxed">
            <p>
              PanelSection is a compound component built on Radix Accordion with three
              parts: <strong className="text-foreground">PanelSection</strong> (root),{' '}
              <strong className="text-foreground">PanelSection.Header</strong> (clickable trigger
              with auto-rotating chevron), and{' '}
              <strong className="text-foreground">PanelSection.Content</strong> (collapsible body).
            </p>
            <p>
              In the OHIF Viewer, PanelSection is used throughout{' '}
              <strong className="text-foreground">side panels</strong> to organize{' '}
              <strong className="text-foreground">segmentation lists</strong>,{' '}
              <strong className="text-foreground">measurement groups</strong>,{' '}
              <strong className="text-foreground">series metadata</strong>, and{' '}
              <strong className="text-foreground">tool configuration</strong> into
              collapsible groups. Sections default to open.
            </p>
          </div>
        </div>

        <Section title="States">
          <InteractivePicker
            options={states}
            defaultValue="open"
            renderPreview={(active) => (
              <div className="w-[280px]">
                <PanelSection
                  defaultOpen={active === 'open'}
                  key={active}
                  className="bg-muted"
                >
                  <PanelSection.Header>Series Information</PanelSection.Header>
                  <PanelSection.Content>
                    <div className="text-muted-foreground space-y-1 p-2 pl-4 text-sm">
                      <div>Images: 120</div>
                      <div>Modality: MR</div>
                      <div>Body Part: Brain</div>
                    </div>
                  </PanelSection.Content>
                </PanelSection>
              </div>
            )}
          />
        </Section>

        <Section title="Examples">
          <ExampleBlock title="Series metadata">
            <div className="w-[280px]">
              <PanelSection defaultOpen className="bg-muted">
                <PanelSection.Header>Series Information</PanelSection.Header>
                <PanelSection.Content>
                  <div className="text-muted-foreground space-y-1 p-2 pl-4 text-sm">
                    <div>Images: 120</div>
                    <div>Modality: MR</div>
                    <div>Body Part: Brain</div>
                    <div>Slice Thickness: 2.0mm</div>
                  </div>
                </PanelSection.Content>
              </PanelSection>
            </div>
          </ExampleBlock>

          <ExampleBlock title="Multiple stacked sections">
            <div className="w-[280px] space-y-0.5">
              <PanelSection defaultOpen className="bg-muted">
                <PanelSection.Header>Segmentations</PanelSection.Header>
                <PanelSection.Content>
                  <div className="space-y-px">
                    <DataRow
                      number={1}
                      title="Liver"
                      description=""
                      colorHex="#E2B93B"
                      isSelected={true}
                      isVisible={true}
                      isLocked={false}
                      disableEditing={false}
                      onSelect={noop}
                      onToggleVisibility={noop}
                      onToggleLocked={noop}
                      onRename={noop}
                      onDelete={noop}
                      onColor={noop}
                    />
                    <DataRow
                      number={2}
                      title="Spleen"
                      description=""
                      colorHex="#68B9FF"
                      isSelected={false}
                      isVisible={true}
                      isLocked={false}
                      disableEditing={false}
                      onSelect={noop}
                      onToggleVisibility={noop}
                      onToggleLocked={noop}
                      onRename={noop}
                      onDelete={noop}
                      onColor={noop}
                    />
                  </div>
                </PanelSection.Content>
              </PanelSection>

              <PanelSection defaultOpen={false} className="bg-muted">
                <PanelSection.Header>Measurements</PanelSection.Header>
                <PanelSection.Content>
                  <div className="space-y-px">
                    <DataRow
                      number={1}
                      title="Length"
                      description=""
                      isSelected={false}
                      isVisible={true}
                      isLocked={false}
                      disableEditing={true}
                      onSelect={noop}
                      onToggleVisibility={noop}
                      onToggleLocked={noop}
                      onRename={noop}
                      onDelete={noop}
                      onColor={noop}
                    />
                  </div>
                </PanelSection.Content>
              </PanelSection>

              <PanelSection defaultOpen={false} className="bg-muted">
                <PanelSection.Header>Display Sets</PanelSection.Header>
                <PanelSection.Content>
                  <div className="text-muted-foreground p-2 pl-4 text-sm">
                    CT Axial 2.0mm
                  </div>
                </PanelSection.Content>
              </PanelSection>
            </div>
          </ExampleBlock>

          <ExampleBlock title="With action button in content" last>
            <div className="w-[280px]">
              <PanelSection defaultOpen className="bg-muted">
                <PanelSection.Header>Patient Information</PanelSection.Header>
                <PanelSection.Content>
                  <div className="text-muted-foreground space-y-1 p-2 pl-4 text-sm">
                    <div>Name: DOE^JOHN</div>
                    <div>MRN: 12345678</div>
                    <div>DOB: 1990-01-15</div>
                    <div>Sex: M</div>
                  </div>
                  <div className="px-2 pb-2">
                    <Button variant="ghost" size="sm">
                      Load more information
                    </Button>
                  </div>
                </PanelSection.Content>
              </PanelSection>
            </div>
          </ExampleBlock>
        </Section>

        <Section title="Usage">
          <CodeBlock
            code={`import { PanelSection } from '@ohif/ui-next';

<PanelSection defaultOpen>
  <PanelSection.Header>Series Information</PanelSection.Header>
  <PanelSection.Content>
    <div className="p-2 text-sm text-muted-foreground">
      <div>Images: 120</div>
      <div>Modality: MR</div>
    </div>
  </PanelSection.Content>
</PanelSection>

// Collapsed by default
<PanelSection defaultOpen={false}>
  <PanelSection.Header>Advanced Settings</PanelSection.Header>
  <PanelSection.Content>
    {/* Tool configuration controls */}
  </PanelSection.Content>
</PanelSection>`}
          />
        </Section>

        <Section title="Props">
          <div className="mb-6">
            <h3 className="text-highlight mb-3 text-base font-semibold">PanelSection</h3>
            <PropsTable props={props} />
          </div>
          <div className="mb-6">
            <h3 className="text-highlight mb-3 text-base font-semibold">PanelSection.Header</h3>
            <PropsTable props={headerProps} />
          </div>
          <div>
            <h3 className="text-highlight mb-3 text-base font-semibold">PanelSection.Content</h3>
            <PropsTable props={contentProps} />
          </div>
        </Section>
      </ComponentLayout>
    </TooltipProvider>
  );
}

export default function PanelSectionPage() {
  return (
    <BrowserOnly fallback={<></>}>{() => <PanelSectionPageContent />}</BrowserOnly>
  );
}
