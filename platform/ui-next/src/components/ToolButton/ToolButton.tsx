import React from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from '../Tooltip';
import { Icons } from '../Icons';
import { Button } from '../Button';
import { cn } from '../../lib/utils';

const baseClasses = '!rounded-lg inline-flex items-center justify-center';
const defaultClasses = 'bg-transparent text-foreground/80 hover:bg-background hover:text-highlight';
const activeClasses = 'bg-highlight text-background hover:!bg-highlight/80';
const disabledClasses =
  'text-common-bright hover:bg-primary-dark hover:text-primary-light opacity-40 cursor-not-allowed';

const sizeClasses = {
  default: {
    buttonSizeClass: 'w-10 h-10',
    iconSizeClass: 'h-7 w-7',
  },
  small: {
    buttonSizeClass: 'w-8 h-8',
    iconSizeClass: 'h-6 w-6',
  },
};

interface ToolButtonProps {
  id: string;
  icon?: string;
  label?: string;
  tooltip?: string;
  size?: 'default' | 'small';
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
    size = 'default',
    disabled = false,
    isActive = false,
    disabledText,
    commands,
    onInteraction,
    className,
  } = props;

  const { buttonSizeClass, iconSizeClass } = sizeClasses[size];

  const buttonClasses = cn(
    baseClasses,
    buttonSizeClass,
    disabled ? disabledClasses : isActive ? activeClasses : defaultClasses,
    className
  );

  const defaultTooltip = tooltip || label;
  const disabledTooltip = disabled && disabledText ? disabledText : null;
  const hasTooltip = defaultTooltip || disabledTooltip;

  return (
    <Tooltip>
      <TooltipTrigger
        asChild
        className={cn(disabled && 'cursor-not-allowed')}
      >
        {/* TooltipTrigger is a span since a disabled button does not fire events and the tooltip
        will not show. */}
        <span
          data-cy={id}
          data-tool={id}
          data-active={isActive}
        >
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
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {hasTooltip && (
          <>
            <div>{defaultTooltip}</div>
            {disabledTooltip && <div className="text-muted-foreground">{disabledTooltip}</div>}
          </>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

export default ToolButton;
