import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

function DialogPageContent() {
  const {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
    DialogClose,
    Button,
    Input,
    Label,
  } = require('../../../../ui-next/src/components');
  const ComponentLayout = require('./_layout/ComponentLayout').default;
  const PageHeader = require('./_layout/PageHeader').default;
  const Section = require('./_layout/Section').default;
  const CodeBlock = require('./_layout/CodeBlock').default;
  const ExampleBlock = require('./_layout/ExampleBlock').default;
  const PropsTable = require('./_layout/PropsTable').default;

  const props = [
    { name: 'isDraggable', type: 'boolean', default: 'false', description: 'Enables dragging the dialog by its header' },
    { name: 'shouldCloseOnEsc', type: 'boolean', default: 'true', description: 'Whether pressing Escape closes the dialog' },
    { name: 'shouldCloseOnOverlayClick', type: 'boolean', default: 'true', description: 'Whether clicking the overlay closes the dialog' },
    { name: 'showOverlay', type: 'boolean', default: 'true', description: 'Shows a dimmed backdrop behind the dialog' },
  ];

  return (
    <ComponentLayout
      title="Dialog"
      description="Modal overlay for focused interactions"
    >
      <PageHeader
        title="Dialog"
        description="A modal window that overlays the page for confirmations, forms, and focused tasks."
      />

      <div className="mb-10">
        <div className="text-secondary-foreground space-y-3 text-lg leading-relaxed">
          <p>
            Dialog is a multi-part component built on Radix UI primitives:{' '}
            <strong className="text-foreground">Dialog</strong> (root),{' '}
            <strong className="text-foreground">DialogTrigger</strong>,{' '}
            <strong className="text-foreground">DialogContent</strong>,{' '}
            <strong className="text-foreground">DialogHeader</strong>,{' '}
            <strong className="text-foreground">DialogFooter</strong>,{' '}
            <strong className="text-foreground">DialogTitle</strong>,{' '}
            and <strong className="text-foreground">DialogDescription</strong>.
          </p>
          <p>
            In the OHIF Viewer, dialogs are used for{' '}
            <strong className="text-foreground">confirmation prompts</strong>,{' '}
            <strong className="text-foreground">measurement labels</strong>,{' '}
            <strong className="text-foreground">export options</strong>, and{' '}
            <strong className="text-foreground">settings panels</strong>. The draggable variant
            lets users reposition the dialog to see underlying content.
          </p>
        </div>
      </div>

      <Section title="Examples">
        <ExampleBlock title="Basic confirmation">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="default">Open Dialog</Button>
            </DialogTrigger>
            <DialogContent className="showcase-portal">
              <DialogHeader>
                <DialogTitle>Confirm Action</DialogTitle>
              </DialogHeader>
              <DialogDescription>
                Are you sure you want to proceed? This action cannot be undone.
              </DialogDescription>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant="default">Confirm</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </ExampleBlock>

        <ExampleBlock title="Form dialog">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">Edit Label</Button>
            </DialogTrigger>
            <DialogContent className="showcase-portal">
              <DialogHeader>
                <DialogTitle>Measurement Label</DialogTitle>
                <DialogDescription>
                  Enter a label for this measurement annotation.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="dlg-label" className="mb-1 block">Label</Label>
                    <Input id="dlg-label" placeholder="e.g. Lesion 1" />
                  </div>
                  <div>
                    <Label htmlFor="dlg-desc" className="mb-1 block">Description</Label>
                    <Input id="dlg-desc" placeholder="Optional description..." />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant="default">Save</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </ExampleBlock>

        <ExampleBlock title="Draggable dialog" last>
          <Dialog isDraggable showOverlay={false}>
            <DialogTrigger asChild>
              <Button variant="outline">Open Draggable</Button>
            </DialogTrigger>
            <DialogContent className="showcase-portal">
              <DialogHeader>
                <DialogTitle>Draggable Dialog</DialogTitle>
              </DialogHeader>
              <DialogDescription>
                Drag the header to reposition this dialog over the viewport.
              </DialogDescription>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="default">Done</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </ExampleBlock>
      </Section>

      <Section title="Usage">
        <CodeBlock
          code={`import {
  Dialog, DialogTrigger, DialogContent,
  DialogHeader, DialogFooter,
  DialogTitle, DialogDescription, DialogClose,
} from '@ohif/ui-next';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    <DialogDescription>Description text.</DialogDescription>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="ghost">Cancel</Button>
      </DialogClose>
      <DialogClose asChild>
        <Button>Confirm</Button>
      </DialogClose>
    </DialogFooter>
  </DialogContent>
</Dialog>`}
        />
      </Section>

      <Section title="Props">
        <PropsTable props={props} />
      </Section>
    </ComponentLayout>
  );
}

export default function DialogPage() {
  return (
    <BrowserOnly fallback={<></>}>{() => <DialogPageContent />}</BrowserOnly>
  );
}
