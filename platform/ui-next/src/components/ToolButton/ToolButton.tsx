import React from 'react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../Tooltip';
import { Icons } from '../Icons';
import { Button } from '../Button';
import { cn } from '../../lib/utils';

interface ToolButtonProps {
  id: string;
  icon?: string;
  label?: string;
  tooltip?: string;
  isActive?: boolean;
  commands?: any;
  onInteraction?: (details: { itemId: string; commands?: any }) => void;
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

  const IconComponent = Icons[icon] || Icons['MissingIcon'];

  const baseClasses = 'w-10 h-10 !rounded-lg inline-flex items-center justify-center';
  const defaultClasses =
    'bg-transparent text-primary-foreground hover:bg-primary-dark hover:text-primary-light';
  const activeClasses = 'bg-primary-light text-primary-dark';
  const appliedClasses = isActive
    ? cn(baseClasses, activeClasses, className)
    : cn(baseClasses, defaultClasses, className);

  // Click: pass along to parent
  const handleClick = () => {
    onInteraction?.({ itemId: id, commands });
  };

  // Decide what text to show in the tooltip; prefer `tooltip` if available. If not, use `label`.
  const tooltipText = tooltip || label;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Button
            className={appliedClasses}
            onClick={handleClick}
            variant="ghost"
            size="icon"
            aria-pressed={isActive}
            aria-label={tooltipText || id}
          >
            <IconComponent className="h-7 w-7" />
          </Button>
        </TooltipTrigger>

        {/* Only render tooltip if we have text to display */}
        {tooltipText && <TooltipContent side="bottom">{tooltipText}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );
}

export default ToolButton;
