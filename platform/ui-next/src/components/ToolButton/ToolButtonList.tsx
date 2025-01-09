import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { Button } from '../Button';
import { Icons } from '../Icons';
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

  // Function to handle clicking on a secondary tool
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

  const primaryIconName = primary?.icon || 'MissingIcon';
  const isActive = !!primary?.isActive; // or however you prefer to handle "active" logic
  const tooltipText = primary?.tooltip || primary?.label || primary?.id;

  return (
    <div className="flex items-center space-x-1">
      {/* Primary Tool Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'inline-flex h-10 w-10 items-center justify-center !rounded-lg',
                isActive
                  ? 'bg-primary-light text-primary-dark'
                  : 'text-primary-foreground hover:bg-primary-dark hover:text-primary-light bg-transparent'
              )}
              onClick={() => {
                // If desired, clicking the primary could re-trigger the tool's commands
                onInteraction?.({
                  groupId,
                  itemId: primary?.id,
                  commands: primary?.commands,
                });
              }}
              aria-pressed={isActive}
              aria-label={tooltipText}
            >
              <Icons.ByName
                name={primaryIconName}
                className="h-7 w-7"
              />
            </Button>
          </TooltipTrigger>
          {tooltipText && <TooltipContent side="bottom">{tooltipText}</TooltipContent>}
        </Tooltip>
      </TooltipProvider>

      {/* Secondary Tools */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-dark hover:text-primary-light border-primary inline-flex h-10 w-5 items-center justify-center !rounded-tr-lg !rounded-br-lg !rounded-tl-none !rounded-bl-none border-l bg-transparent"
            aria-label="Open tool list"
          >
            {/* Example arrow-down icon */}
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
          {items.map(item => {
            const itemIconName = item.icon || 'MissingIcon';
            const itemTooltipText = item.tooltip || item.label || item.id;
            return (
              <DropdownMenuItem
                key={item.id}
                onSelect={() => handleItemClick(item)}
                className="flex items-center space-x-2"
              >
                <Icons.ByName
                  name={itemIconName}
                  className="h-5 w-5"
                />
                <span>{itemTooltipText}</span>
              </DropdownMenuItem>
            );
          })}
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
