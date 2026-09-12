import React from 'react';
import { Button } from '../Button';
import { Icons } from '../Icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../DropdownMenu';
import { cn } from '../../lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '../Tooltip';

/**
 * ToolButtonList Component
 * Root component that wraps the default and dropdown sections
 * -----------------------------------------------
 */
interface ToolButtonListProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  ref?: React.Ref<HTMLDivElement>;
}

const ToolButtonList = ({ className, children, ref, ...props }: ToolButtonListProps) => {
  return (
    <div
      ref={ref}
      className={cn('flex items-center', className)}
      {...props}
    >
      {children}
    </div>
  );
};
ToolButtonList.displayName = 'ToolButtonList';

/**
 * ToolButtonListDefault Component
 * Container for the default/primary tool button
 * -----------------------------------------------
 */
interface ToolButtonListDefaultProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  tooltip?: string;
  disabledText?: string;
  disabled?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}

const ToolButtonListDefault = ({
  className,
  children,
  tooltip,
  disabledText,
  disabled,
  ref,
  ...props
}: ToolButtonListDefaultProps) => {
  const hasTooltip = tooltip || disabledText;

  const defaultContent = (
    <div
      ref={ref}
      className={cn('flex items-center', className)}
      {...props}
    >
      {children}
    </div>
  );

  if (!hasTooltip) {
    return defaultContent;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>{defaultContent}</span>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {tooltip && <div>{tooltip}</div>}
        {disabledText && disabled && <div className="text-muted-foreground">{disabledText}</div>}
      </TooltipContent>
    </Tooltip>
  );
};
ToolButtonListDefault.displayName = 'ToolButtonListDefault';

/**
 * ToolButtonListDropDown Component
 * Container for the dropdown section with trigger and content
 * -----------------------------------------------
 */
interface ToolButtonListDropDownProps {
  children: React.ReactNode;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

const ToolButtonListDropDown = ({
  children,
  className,
  ref,
  ...props
}: ToolButtonListDropDownProps) => (
  <DropdownMenu {...props}>
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'text-foreground/80 hover:bg-background hover:text-highlight border-primary',
          'inline-flex h-10 w-5 items-center justify-center',
          '!rounded-tr-lg !rounded-br-lg !rounded-tl-none !rounded-bl-none',
          'bg-transparent',
          className
        )}
      >
        <Icons.ByName
          name="chevron-down"
          className="text-primary h-5 w-5"
        />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      ref={ref}
      side="bottom"
      align="start"
      alignOffset={-40}
    >
      {children}
    </DropdownMenuContent>
  </DropdownMenu>
);
ToolButtonListDropDown.displayName = 'ToolButtonListDropDown';

/**
 * ToolButtonListItem Component
 * Individual item in the dropdown menu
 * -----------------------------------------------
 */
/**
 * Deliberately does not extend DropdownMenuItem's props, and the component
 * forwards no rest object. Callers spread a whole toolbar button's
 * componentProps onto this component, and Radix hands anything it does not
 * recognise to a DOM element - so a service field such as evaluate or isActive
 * would land as an attribute on a div. Naming what is forwarded keeps that
 * closed against fields added to the toolbar service later.
 */
interface ToolButtonListItemProps {
  icon?: string;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  disabledText?: string;
  tooltip?: string;
  onSelect?: React.ComponentProps<typeof DropdownMenuItem>['onSelect'];
  ref?: React.ComponentProps<typeof DropdownMenuItem>['ref'];
  'data-cy'?: string;
  'data-tool'?: string;
  'data-active'?: boolean;
}

const ToolButtonListItem = ({
  className,
  children,
  icon,
  disabledText,
  tooltip,
  disabled,
  onSelect,
  ref,
  'data-cy': dataCy,
  'data-tool': dataTool,
  'data-active': dataActive,
}: ToolButtonListItemProps) => {
  const defaultTooltip = tooltip || (typeof children === 'string' ? children : undefined);

  const menuItem = (
    <DropdownMenuItem
      ref={ref}
      className={cn('flex items-center space-x-2', className)}
      disabled={disabled}
      onSelect={onSelect}
      data-cy={dataCy}
      data-tool={dataTool}
      data-active={dataActive}
    >
      {icon && (
        <Icons.ByName
          name={icon || 'MissingIcon'}
          className="h-6 w-6"
        />
      )}
      {children}
    </DropdownMenuItem>
  );

  // Todo: there is a weird issue where i can't control the duration of the delay
  // for the items in this list, causing the tooltip to show up too early in the
  // dropdown menu. So i'm just removing the tooltip for list items unless the disabledText is set.
  if (!disabled) {
    return menuItem;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>{menuItem}</span>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {defaultTooltip && <div>{defaultTooltip}</div>}
        {disabledText && disabled && <div className="text-muted-foreground">{disabledText}</div>}
      </TooltipContent>
    </Tooltip>
  );
};
ToolButtonListItem.displayName = 'ToolButtonListItem';

/**
 * ToolButtonListDivider Component
 * Divider between items in the dropdown menu
 * -----------------------------------------------
 */
const ToolButtonListDivider = ({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) => (
  <div
    ref={ref}
    className={cn('bg-primary h-5 w-px self-center', className)}
    {...props}
  />
);
ToolButtonListDivider.displayName = 'ToolButtonListDivider';

export {
  ToolButtonList,
  ToolButtonListDefault,
  ToolButtonListDropDown,
  ToolButtonListItem,
  ToolButtonListDivider,
};
