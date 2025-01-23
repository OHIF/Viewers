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

/**
 * ToolButtonList Component
 * Root component that wraps the default and dropdown sections
 * -----------------------------------------------
 */
interface ToolButtonListProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

const ToolButtonList = React.forwardRef<HTMLDivElement, ToolButtonListProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ToolButtonList.displayName = 'ToolButtonList';

/**
 * ToolButtonListDefault Component
 * Container for the default/primary tool button
 * -----------------------------------------------
 */
interface ToolButtonListDefaultProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

const ToolButtonListDefault = React.forwardRef<HTMLDivElement, ToolButtonListDefaultProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ToolButtonListDefault.displayName = 'ToolButtonListDefault';

/**
 * ToolButtonListDropDown Component
 * Container for the dropdown section with trigger and content
 * -----------------------------------------------
 */
interface ToolButtonListDropDownProps {
  children: React.ReactNode;
  className?: string;
}

const ToolButtonListDropDown = React.forwardRef<HTMLDivElement, ToolButtonListDropDownProps>(
  ({ children, className }, ref) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'text-foreground/80 hover:bg-background hover:text-highlight border-primary',
            'inline-flex h-10 w-5 items-center justify-center',
            '!rounded-tr-lg !rounded-br-lg !rounded-tl-none !rounded-bl-none',
            'bg-transparent'
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
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
);
ToolButtonListDropDown.displayName = 'ToolButtonListDropDown';

/**
 * ToolButtonListItem Component
 * Individual item in the dropdown menu
 * -----------------------------------------------
 */
interface ToolButtonListItemProps extends React.ComponentProps<typeof DropdownMenuItem> {
  icon?: string;
  children?: React.ReactNode;
  className?: string;
}

const ToolButtonListItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuItem>,
  ToolButtonListItemProps
>(({ className, children, icon, ...props }, ref) => (
  <DropdownMenuItem
    ref={ref}
    className={cn('flex items-center space-x-2', className)}
    {...props}
  >
    {icon && (
      <Icons.ByName
        name={icon}
        className="h-6 w-6"
      />
    )}
    {children}
  </DropdownMenuItem>
));
ToolButtonListItem.displayName = 'ToolButtonListItem';

export { ToolButtonList, ToolButtonListDefault, ToolButtonListDropDown, ToolButtonListItem };
