import React from 'react';
import {
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuItem,
  Icons,
} from '@ohif/ui-next';

export default {
  'ohif.menuContent': function (props) {
    const { item: topLevelItem, commandsManager, servicesManager, ...rest } = props;

    const content = function (subProps) {
      const { item: subItem } = subProps;

      // Regular menu item
      const isDisabled = subItem.selector && !subItem.selector({ servicesManager });

      return (
        <DropdownMenuItem
          disabled={isDisabled}
          onSelect={() => {
            commandsManager.runAsync(subItem.commands, {
              ...subItem.commandOptions,
              ...rest,
            });
          }}
          className="gap-[6px]"
        >
          {subItem.iconName && (
            <Icons.ByName
              name={subItem.iconName}
              className="-ml-1"
            />
          )}
          {subItem.label}
        </DropdownMenuItem>
      );
    };

    // If item has sub-items, render a submenu
    if (topLevelItem.items) {
      return (
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-[6px]">
            {topLevelItem.iconName && (
              <Icons.ByName
                name={topLevelItem.iconName}
                className="-ml-1"
              />
            )}
            {topLevelItem.label}
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {topLevelItem.items.map(subItem => content({ ...props, item: subItem }))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      );
    }

    return content({ ...props, item: topLevelItem });
  },
};
