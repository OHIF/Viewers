import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

function DropdownMenuPageContent() {
  const {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
    DropdownMenuCheckboxItem,
    DropdownMenuShortcut,
  } = require('../../../../ui-next/src/components/DropdownMenu');
  const { Button } = require('../../../../ui-next/src/components/Button');
  const ComponentLayout = require('./_layout/ComponentLayout').default;
  const PageHeader = require('./_layout/PageHeader').default;
  const Section = require('./_layout/Section').default;
  const CodeBlock = require('./_layout/CodeBlock').default;
  const ExampleBlock = require('./_layout/ExampleBlock').default;
  const PropsTable = require('./_layout/PropsTable').default;

  const [showMeasurements, setShowMeasurements] = React.useState(true);
  const [showSegmentations, setShowSegmentations] = React.useState(false);

  const props = [
    { name: 'align', type: '"start" | "center" | "end"', default: '"center"', description: 'Horizontal alignment of the menu relative to the trigger (on DropdownMenuContent)' },
    { name: 'side', type: '"top" | "right" | "bottom" | "left"', default: '"bottom"', description: 'Which side of the trigger the menu opens on (on DropdownMenuContent)' },
    { name: 'sideOffset', type: 'number', default: '4', description: 'Distance in pixels between the trigger and the menu (on DropdownMenuContent)' },
    { name: 'onSelect', type: '() => void', default: '—', description: 'Called when a menu item is selected (on DropdownMenuItem)' },
  ];

  return (
    <ComponentLayout
      title="DropdownMenu"
      description="Context menu triggered from a button"
    >
      <PageHeader
        title="DropdownMenu"
        description="A menu of actions or options that opens from a trigger button."
      />

      <div className="mb-10">
        <div className="text-secondary-foreground space-y-3 text-lg leading-relaxed">
          <p>
            DropdownMenu is a multi-part component built on Radix UI primitives:{' '}
            <strong className="text-foreground">DropdownMenu</strong> (root),{' '}
            <strong className="text-foreground">DropdownMenuTrigger</strong>,{' '}
            <strong className="text-foreground">DropdownMenuContent</strong>,{' '}
            and <strong className="text-foreground">DropdownMenuItem</strong>. It also supports{' '}
            <strong className="text-foreground">labels</strong>,{' '}
            <strong className="text-foreground">separators</strong>,{' '}
            <strong className="text-foreground">checkbox items</strong>, and{' '}
            <strong className="text-foreground">keyboard shortcuts</strong>.
          </p>
          <p>
            In the OHIF Viewer, dropdown menus appear in toolbar overflow menus, viewport
            action corners, layout selectors, and context menus for measurements and segments.
          </p>
        </div>
      </div>

      <Section title="Examples">
        <ExampleBlock title="Alignment">
          <div className="flex flex-wrap gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Default</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Item 1</DropdownMenuItem>
                <DropdownMenuItem>Item 2</DropdownMenuItem>
                <DropdownMenuItem>Long name Item 3</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Align Start</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem>Item 1</DropdownMenuItem>
                <DropdownMenuItem>Item 2</DropdownMenuItem>
                <DropdownMenuItem>Long name Item 3</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Align End</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Item 1</DropdownMenuItem>
                <DropdownMenuItem>Item 2</DropdownMenuItem>
                <DropdownMenuItem>Long name Item 3</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Side Top</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start">
                <DropdownMenuItem>Item 1</DropdownMenuItem>
                <DropdownMenuItem>Item 2</DropdownMenuItem>
                <DropdownMenuItem>Long name Item 3</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </ExampleBlock>

        <ExampleBlock title="With labels and shortcuts">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Layout</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Viewport Layout</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                1×1
                <DropdownMenuShortcut>⌘1</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                1×2
                <DropdownMenuShortcut>⌘2</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                2×2
                <DropdownMenuShortcut>⌘3</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Custom...</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ExampleBlock>

        <ExampleBlock title="Checkbox items" last>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Overlays</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuLabel>Visible Overlays</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={showMeasurements}
                onCheckedChange={setShowMeasurements}
              >
                Measurements
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showSegmentations}
                onCheckedChange={setShowSegmentations}
              >
                Segmentations
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ExampleBlock>
      </Section>

      <Section title="Usage">
        <CodeBlock
          code={`import {
  DropdownMenu, DropdownMenuTrigger,
  DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator,
} from '@ohif/ui-next';

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button>Actions</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onSelect={() => handleExport()}>
      Export
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`}
        />
      </Section>

      <Section title="Props">
        <PropsTable props={props} />
      </Section>
    </ComponentLayout>
  );
}

export default function DropdownMenuPage() {
  return (
    <BrowserOnly fallback={<></>}>{() => <DropdownMenuPageContent />}</BrowserOnly>
  );
}
