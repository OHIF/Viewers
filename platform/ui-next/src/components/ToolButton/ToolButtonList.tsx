import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { Button } from '../Button';
import { Icons } from '../Icons';
import ToolButton from './ToolButton';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../DropdownMenu';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '../Tooltip';
import { cn } from '../../lib/utils';

function ToolButtonList({ groupId, primary, items = [], onInteraction, servicesManager }) {
  const { toolbarService } = servicesManager?.services || {};

  const handleItemClick = useCallback(
    item => {
      onInteraction?.({
        groupId,
        itemId: item.id,
        commands: item.commands,
      });
    },
    [groupId, onInteraction]
  );

  const isActive = !!primary?.isActive;

  return (
    <div className="flex items-center">
      <ToolButton
        id={primary?.id}
        icon={primary?.icon}
        label={primary?.label}
        tooltip={primary?.tooltip}
        isActive={isActive}
        commands={primary?.commands}
        onInteraction={({ itemId, commands }) => {
          onInteraction?.({
            groupId,
            itemId,
            commands,
          });
        }}
      />

      <div
        className={cn('self-center', 'w-px', 'h-5', isActive ? 'bg-transparent' : 'bg-primary')}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-foreground/80 hover:bg-background hover:text-highlight border-primary inline-flex h-10 w-5 items-center justify-center !rounded-tr-lg !rounded-br-lg !rounded-tl-none !rounded-bl-none bg-transparent"
            aria-label="Open tool list"
          >
            <Icons.ByName
              name="chevron-down"
              className="text-primary h-5 w-5"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="bottom"
          align="end"
        >
          {items.map(item => (
            <DropdownMenuItem
              key={item.id}
              // Only invoke handleItemClick if not disabled
              onSelect={() => !item.disabled && handleItemClick(item)}
              disabled={item.disabled}
              className={
                item.disabled
                  ? 'flex cursor-not-allowed items-center space-x-2 opacity-50'
                  : 'flex items-center space-x-2'
              }
            >
              <Icons.ByName
                name={item.icon || 'MissingIcon'}
                className="h-6 w-6"
              />
              <span>{item.label || item.tooltip || item.id}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

ToolButtonList.propTypes = {
  groupId: PropTypes.string,
  primary: PropTypes.shape({
    id: PropTypes.string.isRequired,
    icon: PropTypes.string,
    label: PropTypes.string,
    tooltip: PropTypes.string,
    isActive: PropTypes.bool,
    commands: PropTypes.any,
  }),
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      icon: PropTypes.string,
      label: PropTypes.string,
      tooltip: PropTypes.string,
      isActive: PropTypes.bool,
      commands: PropTypes.any,
    })
  ),
  onInteraction: PropTypes.func,
  servicesManager: PropTypes.shape({
    services: PropTypes.shape({
      toolbarService: PropTypes.object,
    }),
  }),
};

export default ToolButtonList;
