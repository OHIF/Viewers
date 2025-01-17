import React from 'react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../Tooltip';
import { Icons } from '../Icons';
import { cn } from '../../lib/utils';

/**
 * ToolButtonSmall
 * ---------------
 * A smaller variation of ToolButton that mirrors the new design.
 * This can be used one-off or inside a "group" to mimic your old ButtonGroup
 * functionality (tracking the active button, etc.).
 */
interface ToolButtonSmallProps {
  id: string;
  icon?: string;
  label?: string;
  tooltip?: string;
  isActive?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

function ToolButtonSmall(props: ToolButtonSmallProps) {
  const {
    id,
    icon = 'MissingIcon',
    label,
    tooltip,
    isActive = false,
    disabled = false,
    onClick,
    className,
  } = props;

  const IconComponent = Icons[icon] || Icons['MissingIcon'];
  const tooltipText = tooltip || label || id;

  const baseClasses =
    'relative flex items-center justify-center w-10 h-10 rounded-md transition-colors';
  const defaultClasses =
    'bg-primary-dark text-primary-active hover:bg-primary-light hover:text-black';
  const activeClasses = 'bg-highlight text-background';
  const disabledClasses = 'opacity-40 cursor-not-allowed';

  const buttonClasses = cn(
    baseClasses,
    disabled ? disabledClasses : isActive ? activeClasses : defaultClasses,
    className
  );

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <button
            id={id}
            aria-label={tooltipText}
            aria-pressed={isActive}
            disabled={disabled}
            onClick={handleClick}
            className={buttonClasses}
          >
            <IconComponent className="h-5 w-5" />
          </button>
        </TooltipTrigger>
        {tooltipText && <TooltipContent side="bottom">{tooltipText}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );
}

export default ToolButtonSmall;
