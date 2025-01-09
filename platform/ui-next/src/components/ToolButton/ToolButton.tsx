import * as React from 'react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../Tooltip';
import { Icons } from '../Icons';
import { Button } from '../Button';
import { cn } from '../../lib/utils';

interface ToolButtonProps {
  id: string;
  /** Icon name from Icons.tsx, e.g. "tool-zoom" */
  icon?: string;
  /** Optional label for tooltip or accessibility */
  label?: string;
  /** If different from label, or if you want more text in the tooltip */
  tooltip?: string;
  /** Whether this button is active (selected) or not */
  isActive?: boolean;
  /** Fired when user clicks the tool button */
  onInteraction?: (details: { id: string }) => void;
  /** Additional classes or styles can be passed here */
  className?: string;
}

/**
 * ToolButton Component
 *
 * Renders a square button (w-10 h-10) with a rounded-lg corner, an icon in center,
 * and uses hover/default/active states to visually indicate selection.
 */
interface ToolButtonProps {
  id: string;
  icon?: string;
  label?: string;
  tooltip?: string;
  isActive?: boolean;
  onInteraction?: (details: {
    itemId: string;
    commands?: any;
    // Could also pass "toolGroupIds", etc. if needed
  }) => void;
  commands?: any;  // <--- Add this
  className?: string;
}

  const IconComponent = Icons[icon] || Icons['MissingIcon'];

  const baseClasses = 'w-10 h-10 rounded-lg inline-flex items-center justify-center';
  const defaultClasses =
    'bg-transparent text-primary-foreground hover:bg-primary-dark hover:text-primary-light';
  const activeClasses = 'bg-primary-light text-primary-dark'; // adjust tokens as needed

  // Merge the correct "active" or "default" classes
  const appliedClasses = isActive
    ? cn(baseClasses, activeClasses, className)
    : cn(baseClasses, defaultClasses, className);

  // When the button is clicked, we inform the parent which tool was selected
  const handleClick = () => {
    onInteraction?.({ id });
  };

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className={appliedClasses}
            onClick={handleClick}
            variant="ghost"
            size="icon"
            aria-pressed={isActive}
            aria-label={label || tooltip || id}
          >
            <IconComponent className="h-7 w-7" />
          </Button>
        </TooltipTrigger>
        {tooltip && <TooltipContent side="right">{tooltip}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );
}

export default ToolButton;
