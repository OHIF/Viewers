import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

function ToastPageContent() {
  const { Toaster, toast } = require('../../../../ui-next/src/components/Sonner');
  const { Button } = require('../../../../ui-next/src/components/Button');
  const ComponentLayout = require('./_layout/ComponentLayout').default;
  const PageHeader = require('./_layout/PageHeader').default;
  const Section = require('./_layout/Section').default;
  const CodeBlock = require('./_layout/CodeBlock').default;
  const ExampleBlock = require('./_layout/ExampleBlock').default;
  const PropsTable = require('./_layout/PropsTable').default;

  const toastOptions = [
    { name: 'message', type: 'string', default: '—', description: 'The toast message text (first positional argument)' },
    { name: 'description', type: 'string', default: '—', description: 'Secondary text below the message' },
    { name: 'duration', type: 'number', default: '4000', description: 'Time in ms before auto-dismiss' },
    { name: 'action', type: 'ReactNode', default: '—', description: 'Action button rendered inside the toast' },
    { name: 'cancel', type: 'ReactNode', default: '—', description: 'Cancel button rendered inside the toast' },
  ];

  const toasterProps = [
    { name: 'position', type: 'string', default: '"bottom-right"', description: 'Where toasts appear on screen' },
    { name: 'expand', type: 'boolean', default: 'false', description: 'Expand toasts by default instead of stacking' },
    { name: 'richColors', type: 'boolean', default: 'false', description: 'Use Sonner built-in colored backgrounds per type' },
    { name: 'duration', type: 'number', default: '4000', description: 'Default auto-dismiss duration for all toasts' },
  ];

  return (
    <ComponentLayout
      title="Toast"
      description="Temporary notification messages"
    >
      <PageHeader
        title="Toast"
        description="Brief, non-blocking notifications that appear temporarily and stack when multiple fire."
      />

      <div className="mb-10">
        <div className="text-secondary-foreground space-y-3 text-lg leading-relaxed">
          <p>
            Toasts are powered by <strong className="text-foreground">Sonner</strong> with
            custom OHIF icons for each type. Call <strong className="text-foreground">toast()</strong>,{' '}
            <strong className="text-foreground">toast.success()</strong>,{' '}
            <strong className="text-foreground">toast.error()</strong>,{' '}
            <strong className="text-foreground">toast.warning()</strong>,{' '}
            <strong className="text-foreground">toast.info()</strong>, or{' '}
            <strong className="text-foreground">toast.promise()</strong> to trigger a notification.
          </p>
          <p>
            In the OHIF Viewer, toasts report{' '}
            <strong className="text-foreground">segmentation loading progress</strong>,{' '}
            <strong className="text-foreground">export results</strong>,{' '}
            <strong className="text-foreground">error states</strong>, and other transient
            feedback. Multiple toasts stack into a single unit.
          </p>
        </div>
      </div>

      <Section title="Examples">
        <ExampleBlock title="Simple messages">
          <div className="flex flex-wrap gap-2">
            <Button variant="default" onClick={() => toast.success('Segmentation saved')}>
              Success
            </Button>
            <Button variant="default" onClick={() => toast.error('Failed to load series')}>
              Error
            </Button>
            <Button variant="default" onClick={() => toast.info('3 measurements exported')}>
              Info
            </Button>
            <Button variant="default" onClick={() => toast.warning('Unsaved changes')}>
              Warning
            </Button>
          </div>
        </ExampleBlock>

        <ExampleBlock title="With description">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() =>
                toast.success('Export complete', {
                  description: 'DICOM SR saved to local storage.',
                })
              }
            >
              Success + Description
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                toast.error('Load failed', {
                  description: 'The DICOM file could not be parsed.',
                })
              }
            >
              Error + Description
            </Button>
          </div>
        </ExampleBlock>

        <ExampleBlock title="Promise toast">
          <Button
            variant="secondary"
            onClick={() => {
              const promise = new Promise((resolve) => setTimeout(resolve, 3000));
              toast.promise(promise, {
                loading: 'Loading segmentation...',
                success: 'Segmentation loaded',
                error: 'Failed to load segmentation',
              });
            }}
          >
            Loading → Success (3s)
          </Button>
        </ExampleBlock>

        <ExampleBlock title="With action buttons" last>
          <Button
            variant="secondary"
            onClick={() =>
              toast.warning('Unsaved changes', {
                description: 'You have unsaved measurement labels.',
                action: (
                  <Button size="sm" variant="ghost" onClick={() => toast.dismiss()}>
                    Save
                  </Button>
                ),
                cancel: (
                  <Button size="sm" variant="ghost" onClick={() => toast.dismiss()}>
                    Discard
                  </Button>
                ),
              })
            }
          >
            Warning + Buttons
          </Button>
        </ExampleBlock>
      </Section>

      <Section title="Usage">
        <CodeBlock
          code={`import { Toaster, toast } from '@ohif/ui-next';

// Add <Toaster /> once at your app root
<Toaster />

// Trigger toasts anywhere
toast.success('Saved');
toast.error('Failed to load');
toast.info('3 items exported');
toast.warning('Unsaved changes', {
  description: 'Details here.',
});

// Async promise toast
toast.promise(fetchData(), {
  loading: 'Loading...',
  success: 'Done',
  error: 'Failed',
});`}
        />
      </Section>

      <Section title="toast() Options">
        <PropsTable props={toastOptions} />
      </Section>

      <Section title="Toaster Props">
        <PropsTable props={toasterProps} />
      </Section>

      <Toaster />
    </ComponentLayout>
  );
}

export default function ToastPage() {
  return (
    <BrowserOnly fallback={<></>}>{() => <ToastPageContent />}</BrowserOnly>
  );
}
