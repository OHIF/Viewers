import * as React from 'react';
import { Button } from '../../Button';
import { Icons } from '../../Icons';
import { useLayout } from './Layout';

type PreviewToggleButtonProps = React.HTMLAttributes<HTMLButtonElement> & {
  'aria-label'?: string;
  shouldShow: boolean;
  onClick: () => void;
  defaultAriaLabel: string;
};

function PreviewToggleButton({
  className,
  'aria-label': ariaLabel,
  shouldShow,
  onClick,
  defaultAriaLabel,
}: PreviewToggleButtonProps) {
  if (!shouldShow) {
    return null;
  }
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={ariaLabel ?? defaultAriaLabel}
      onClick={onClick}
      className={className}
    >
      <Icons.PanelRight
        aria-hidden="true"
        className="h-4 w-4"
      />
    </Button>
  );
}

export function OpenPreviewButton({
  className,
  'aria-label': ariaLabel = 'Open preview',
}: React.HTMLAttributes<HTMLButtonElement> & { 'aria-label'?: string }) {
  const { isPreviewOpen, openPreview } = useLayout();
  return (
    <PreviewToggleButton
      className={className}
      aria-label={ariaLabel}
      shouldShow={!isPreviewOpen}
      onClick={openPreview}
      defaultAriaLabel="Open preview"
    />
  );
}

export function ClosePreviewButton({
  className,
  'aria-label': ariaLabel = 'Close preview',
}: React.HTMLAttributes<HTMLButtonElement> & { 'aria-label'?: string }) {
  const { isPreviewOpen, closePreview } = useLayout();
  return (
    <PreviewToggleButton
      className={className}
      aria-label={ariaLabel}
      shouldShow={isPreviewOpen}
      onClick={closePreview}
      defaultAriaLabel="Close preview"
    />
  );
}
