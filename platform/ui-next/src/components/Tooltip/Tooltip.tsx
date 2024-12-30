import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '../../lib/utils';
import { Button } from '../Button';
import { Icons } from '../Icons';

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

interface TooltipContentProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> {
  className?: string;
  sideOffset?: number;
  copyEnabled?: boolean;
  copyText?: string;
  copySuccessMessage?: string;
  copyErrorMessage?: string;
}

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>((props, ref) => {
  const {
    className,
    sideOffset = 4,
    copyEnabled = false,
    copyText = '',
    copySuccessMessage = 'FeedbackComplete',
    copyErrorMessage = 'Failed to copy',
    children,
    ...rest
  } = props;

  const [copyFeedback, setCopyFeedback] = React.useState('');

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopyFeedback(copySuccessMessage);
    } catch (err) {
      console.error(err);
      setCopyFeedback(copyErrorMessage);
    } finally {
      setTimeout(() => setCopyFeedback(''), 1000);
    }
  }, [copyText, copySuccessMessage, copyErrorMessage]);

  return (
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'bg-primary-dark border-secondary-light text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 flex items-center justify-between gap-2 overflow-hidden rounded border px-2 py-1.5 text-sm',
        className
      )}
      {...rest}
    >
      <div>{children}</div>
      {copyEnabled && (
        <div className="flex items-center">
          {!copyFeedback && (
            <Button
              variant="ghost"
              size="icon"
              onClick={e => {
                e.stopPropagation();
                handleCopy();
              }}
              className="text-white"
              title="Copy"
            >
              <Icons.ByName
                name="Copy"
                className="h-6 w-6"
              />
            </Button>
          )}
          {copyFeedback && copyFeedback === 'FeedbackComplete' && (
            <Icons.ByName
              name="FeedbackComplete"
              className="h-6 w-6 text-white"
            />
          )}
          {copyFeedback && copyFeedback !== 'FeedbackComplete' && (
            <span className="whitespace-nowrap text-xs text-white">{copyFeedback}</span>
          )}
        </div>
      )}
    </TooltipPrimitive.Content>
  );
});

TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
