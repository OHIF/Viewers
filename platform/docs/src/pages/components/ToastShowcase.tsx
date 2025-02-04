import React from 'react';
import { Button } from '../../../../ui-next/src/components/Button';
import { Toaster, toast } from '../../../../ui-next/src/components/Sonner';
import ShowcaseRow from './ShowcaseRow';

/**
 * ToastShowcase component displays Toast variants and examples
 */
export default function ToastShowcase() {
  // Handlers to trigger different types of toasts
  const triggerSuccess = () => {
    toast.success('This is a success toast!');
  };

  const triggerError = () => {
    toast.error('This is an error toast!');
  };

  const triggerInfo = () => {
    toast.info('This is an info toast!');
  };

  const triggerWarning = () => {
    toast.warning('This is a warning toast!');
  };

  // Handler to trigger a toast.promise example
  const triggerPromiseToast = () => {
    const promise = () =>
      new Promise<{ name: string }>(resolve =>
        setTimeout(() => resolve({ name: 'Segmentation 1' }), 3000)
      );

    toast.promise(promise(), {
      loading: 'Loading Segmentation...',
      success: data => `${data.name} has been added`,
      error: 'Error',
    });
  };

  // Handler to trigger a toast with description
  const triggerDescriptionToast = () => {
    toast.success('Completed', {
      description: 'This is a detailed description of the success message.',
    });
  };

  // Handler to trigger a toast with an action button
  const triggerActionButtonToast = () => {
    toast.info('No active segmentation detected', {
      description: 'Create a segmentation before using the Brush',
    });
  };

  // Handler to trigger a toast with a cancel button
  const triggerCancelButtonToast = () => {
    toast.error('No active segmentation detected', {
      description: 'Create a segmentation before using the Brush',
    });
  };

  // Handler to trigger a toast with both action and cancel buttons
  const triggerCombinedToast = () => {
    toast.warning('Warning!', {
      description: 'This is a warning with both action and cancel buttons.',
      action: (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => console.debug('Retry action clicked')}
        >
          Retry
        </Button>
      ),
      cancel: (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => toast.dismiss()}
        >
          Cancel
        </Button>
      ),
    });
  };

  return (
    <ShowcaseRow
      title="Toast"
      description="A toast notification displays temporary feedback messages to users above the current UI. Notifications stack into one unit after multiple cascading notifications."
      code={`
Example code coming soon.
      `}
    >
      Simple message:
      <div className="mt-2 mb-7 space-x-2">
        <Button
          variant="default"
          onClick={triggerPromiseToast}
        >
          Loading & Success Toast
        </Button>
        <Button
          variant="default"
          onClick={triggerSuccess}
        >
          Success Toast
        </Button>
        <Button
          variant="default"
          onClick={triggerError}
        >
          Error Toast
        </Button>
        <Button
          variant="default"
          onClick={triggerInfo}
        >
          Info Toast
        </Button>
        <Button
          variant="default"
          onClick={triggerWarning}
        >
          Warning Toast
        </Button>
      </div>
      Message with details:
      <div className="mt-2 space-x-2">
        <Button
          variant="default"
          onClick={triggerDescriptionToast}
        >
          Success Toast
        </Button>
        <Button
          variant="default"
          onClick={triggerActionButtonToast}
        >
          Info Toast
        </Button>
        <Button
          variant="default"
          onClick={triggerCancelButtonToast}
        >
          Error Toast
        </Button>
        <Button
          variant="default"
          onClick={triggerCombinedToast}
        >
          Toast with Buttons
        </Button>
      </div>
      <Toaster />
    </ShowcaseRow>
  );
}
