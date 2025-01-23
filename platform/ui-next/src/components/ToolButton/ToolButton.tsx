import React from 'react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../Tooltip';
import { Icons } from '../Icons';
import { Button } from '../Button';
import { cn } from '../../lib/utils';

const baseClasses = '!rounded-lg inline-flex items-center justify-center';
const defaultClasses =
  'bg-transparent text-foreground/80 hover:!bg-highlight/80 hover:text-highlight';

interface ToolButtonProps {
  id: string;
  icon?: string;
  label?: string;
  tooltip?: string;
  buttonSizeClass?: string;
  iconSizeClass?: string;
  isActive?: boolean;
  disabled?: boolean;
  disabledText?: string;
  commands?: Record<string, unknown>;
  onInteraction?: (details: { itemId: string; commands?: Record<string, unknown> }) => void;
  className?: string;
}

function ToolButton(props: ToolButtonProps) {
  const {
    id,
    icon = 'MissingIcon',
    label,
    tooltip,
    buttonSizeClass = 'w-10 h-10',
    iconSizeClass = 'h-7 w-7',
    disabled = false,
    disabledText,
    commands,
    onInteraction,
    className,
  } = props;

  const buttonClasses = cn(baseClasses, defaultClasses, buttonSizeClass, className);

  const defaultTooltip = tooltip || label;
  const disabledTooltip = disabled && disabledText ? disabledText : null;
  const hasTooltip = defaultTooltip || disabledTooltip;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Button
            className={buttonClasses}
            onClick={() => {
              if (!disabled) {
                onInteraction?.({ itemId: id, commands });
              }
            }}
            variant="ghost"
            size="icon"
            aria-label={hasTooltip ? defaultTooltip : undefined}
            disabled={disabled}
          >
            <Icons.ByName
              name={icon}
              className={iconSizeClass}
            />
          </Button>
        </TooltipTrigger>
        {hasTooltip && (
          <TooltipContent side="bottom">
            <div>{defaultTooltip}</div>
            {disabledTooltip && <div className="text-muted-foreground">{disabledTooltip}</div>}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

export default ToolButton;
