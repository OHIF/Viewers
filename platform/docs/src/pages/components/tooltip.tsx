import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

function TooltipPageContent() {
  const {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
  } = require('../../../../ui-next/src/components/Tooltip');
  const { Button } = require('../../../../ui-next/src/components/Button');
  const { Icons } = require('../../../../ui-next/src/components/Icons');
  const ComponentLayout = require('./_layout/ComponentLayout').default;
  const PageHeader = require('./_layout/PageHeader').default;
  const Section = require('./_layout/Section').default;
  const CodeBlock = require('./_layout/CodeBlock').default;
  const ExampleBlock = require('./_layout/ExampleBlock').default;
  const PropsTable = require('./_layout/PropsTable').default;

  const props = [
    { name: 'side', type: '"top" | "right" | "bottom" | "left"', default: '"top"', description: 'Which side of the trigger the tooltip appears on (on TooltipContent)' },
    { name: 'sideOffset', type: 'number', default: '4', description: 'Distance in pixels from the trigger (on TooltipContent)' },
    { name: 'delayDuration', type: 'number', default: '700', description: 'Delay in ms before the tooltip opens (on TooltipProvider)' },
  ];

  return (
    <TooltipProvider>
      <ComponentLayout
        title="Tooltip"
        description="Helper text on hover or focus"
      >
        <PageHeader
          title="Tooltip"
          description="A brief label that appears on hover or keyboard focus to describe an element."
        />

        <div className="mb-10">
          <div className="text-secondary-foreground space-y-3 text-lg leading-relaxed">
            <p>
              Tooltip is a multi-part component built on Radix UI primitives:{' '}
              <strong className="text-foreground">TooltipProvider</strong> (context),{' '}
              <strong className="text-foreground">Tooltip</strong> (root),{' '}
              <strong className="text-foreground">TooltipTrigger</strong>, and{' '}
              <strong className="text-foreground">TooltipContent</strong>.
            </p>
            <p>
              Tooltips are non-interactive — they display text only and dismiss on pointer
              leave. In the OHIF Viewer, tooltips label{' '}
              <strong className="text-foreground">toolbar icon buttons</strong>,{' '}
              <strong className="text-foreground">viewport action icons</strong>, and other
              controls where space is too tight for visible text.
            </p>
          </div>
        </div>

        <Section title="Examples">
          <ExampleBlock title="Basic tooltip">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">?</Button>
              </TooltipTrigger>
              <TooltipContent>Tooltip content</TooltipContent>
            </Tooltip>
          </ExampleBlock>

          <ExampleBlock title="Side positions">
            <div className="flex flex-wrap gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm">Top</Button>
                </TooltipTrigger>
                <TooltipContent side="top">Appears above</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm">Right</Button>
                </TooltipTrigger>
                <TooltipContent side="right">Appears right</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm">Bottom</Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Appears below</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm">Left</Button>
                </TooltipTrigger>
                <TooltipContent side="left">Appears left</TooltipContent>
              </Tooltip>
            </div>
          </ExampleBlock>

          <ExampleBlock title="Icon button with tooltip" last>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Icons.Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Settings</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Icons.More className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>More options</TooltipContent>
              </Tooltip>
            </div>
          </ExampleBlock>
        </Section>

        <Section title="Usage">
          <CodeBlock
            code={`import {
  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider,
} from '@ohif/ui-next';

// Wrap your app (or a subtree) in TooltipProvider once
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon">?</Button>
    </TooltipTrigger>
    <TooltipContent>Helpful description</TooltipContent>
  </Tooltip>
</TooltipProvider>`}
          />
        </Section>

        <Section title="Props">
          <PropsTable props={props} />
        </Section>
      </ComponentLayout>
    </TooltipProvider>
  );
}

export default function TooltipPage() {
  return (
    <BrowserOnly fallback={<></>}>{() => <TooltipPageContent />}</BrowserOnly>
  );
}
