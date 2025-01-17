// File: /Users/danrukas/Documents/Github/Viewers/platform/ui-next/src/components/ToolButton/ToolButton.tsx
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
  /** Add a disabled prop: */
  disabled?: boolean;
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
    disabled = false, // default to false
    commands,
    onInteraction,
    className,
  } = props;

  const IconComponent = Icons[icon] || Icons['MissingIcon'];

  /**
   * We preserve the styling logic that was here before,
   * but also add disabled styling:
   */
  const baseClasses = 'w-10 h-10 !rounded-lg inline-flex items-center justify-center';
  const defaultClasses = 'bg-transparent text-foreground hover:bg-background hover:text-highlight';
  const activeClasses = 'bg-highlight text-background hover:!bg-highlight/80';
  const disabledClasses = 'opacity-40 cursor-not-allowed';

  let buttonClasses = '';
  if (disabled) {
    buttonClasses = cn(baseClasses, disabledClasses, className);
  } else if (isActive) {
    buttonClasses = cn(baseClasses, activeClasses, className);
  } else {
    buttonClasses = cn(baseClasses, defaultClasses, className);
  }

  // Pass disabled to Button so it doesn't trigger clicks
  const handleClick = () => {
    if (!disabled) {
      onInteraction?.({ itemId: id, commands });
    }
  };

  const tooltipText = tooltip || label || id;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Button
            className={buttonClasses}
            onClick={handleClick}
            variant="ghost"
            size="icon"
            aria-pressed={isActive}
            aria-label={tooltipText || id}
            disabled={disabled}
          >
            <IconComponent className="h-7 w-7" />
          </Button>
        </TooltipTrigger>

        {/* Only render if we have text */}
        {tooltipText && <TooltipContent side="bottom">{tooltipText}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );
}

export default ToolButton;
