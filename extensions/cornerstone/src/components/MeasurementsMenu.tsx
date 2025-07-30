import React, { useState } from 'react';
import { useSystem } from '@ohif/core';
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Icons,
} from '@ohif/ui-next';

export function MeasumentsMenu(props) {
  const { group, classNames } = props;
  if (!group.items?.length) {
    console.log('No items to iterate', group.items);
    return null;
  }
  const { items } = group;
  const [item] = items;
  const { isSelected, isVisible } = item;

  const system = useSystem();

  const onAction = (event, command, args?) => {
    const uid = items.map(item => item.uid);
    // Some commands use displayMeasurements and some use items
    system.commandsManager.run(command, {
      ...args,
      uid,
      displayMeasurements: items,
      items,
      event,
    });
  };

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className={`relative ml-2 inline-flex items-center space-x-1 ${classNames}`}>
      {/* Visibility Toggle Icon */}
      <Button
        size="icon"
        variant="ghost"
        className={`h-6 w-6 transition-opacity ${
          isSelected || !isVisible ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'
        }`}
        aria-label={isVisible ? 'Hide' : 'Show'}
        onClick={e => {
          e.stopPropagation();
          onAction(e, ['jumpToMeasurement', 'toggleVisibilityMeasurement']);
        }}
      >
        {isVisible ? <Icons.Hide className="h-6 w-6" /> : <Icons.Show className="h-6 w-6" />}
      </Button>
      {/* Actions Dropdown Menu */}
      <DropdownMenu onOpenChange={open => setIsDropdownOpen(open)}>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className={`h-6 w-6 transition-opacity ${
              isSelected || isDropdownOpen ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'
            }`}
            aria-label="Actions"
            onClick={e => e.stopPropagation()} // Prevent row selection on button click
          >
            <Icons.More className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={e => onAction(e, 'removeMeasurement')}>
            <Icons.Delete className="text-foreground" />
            <span className="pl-2">Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default MeasumentsMenu;
