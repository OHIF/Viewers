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
  /** Commands object - typically { commandName, commandOptions } */
  commands?: any;
  /**
   * Fired when user clicks the tool button;
   * returns { itemId, commands }
   */
  onInteraction?: (details: { itemId: string; commands?: any }) => void;
  /** Additional classes or styles can be passed here */
  className?: string;
}

function ToolButton(props: ToolButtonProps) {
  const {
    id,
    icon = 'MissingIcon',
    label,
    tooltip,
    isActive = false,
    commands,
    onInteraction,
    className,
  } = props;

  // Determine icon component
  const IconComponent = Icons[icon] || Icons['MissingIcon'];

  // Base sizing classes
  const baseClasses = 'w-10 h-10 rounded-lg inline-flex items-center justify-center';
  // Default vs. Active styles
  const defaultClasses =
    'bg-transparent text-primary-foreground hover:bg-primary-dark hover:text-primary-light';
  const activeClasses = 'bg-primary-light text-primary-dark';

  // Merge the correct "active" or "default" classes
  const appliedClasses = isActive
    ? cn(baseClasses, activeClasses, className)
    : cn(baseClasses, defaultClasses, className);

  // Handle click: trigger parent's onInteraction
  const handleClick = () => {
    onInteraction?.({
      itemId: id,
      commands,
    });
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
        {/* Show tooltip if 'label' or 'tooltip' is provided */}
        {tooltip && <TooltipContent side="right">{tooltip}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );
}

export default ToolButton;
