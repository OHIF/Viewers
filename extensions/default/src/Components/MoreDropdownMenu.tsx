import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  Icons,
  Button,
} from '@ohif/ui-next';
import { useSystem } from '@ohif/core';

/**
 * The default sub-menu appearance and setup is defined here, but this can be
 * replaced by
 */
const getMenuItemsDefault = ({ commandsManager, items, ...props }: withAppTypes) => {
  const { servicesManager } = useSystem();
  const { customizationService } = servicesManager.services;

  // This allows replacing the default child item for menus, whereas the entire
  // getMenuItems can also be replaced by providing it to the MoreDropdownMenu
  const menuContent = customizationService.getCustomization('ohif.menuContent');

  // Default menu item component if none is provided through customization

  const DefaultMenuItem = ({
    item,
  }: {
    item: {
      id: string;
      label: string;
      iconName: string;
      onClick: ({ commandsManager, ...props }: withAppTypes) => () => void;
    };
  }) => (
    <DropdownMenuItem onClick={() => item.onClick({ commandsManager, servicesManager, ...props })}>
      <div className="flex items-center gap-2">
        {item.iconName && <Icons.ByName name={item.iconName} />}
        <span>{item.label}</span>
      </div>
    </DropdownMenuItem>
  );

  const MenuItemComponent = menuContent ?? DefaultMenuItem;

  return (
    <DropdownMenuContent
      hideWhenDetached
      align="start"
      onClick={e => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      {items?.map((item, index) => (
        <MenuItemComponent
          key={item.id || `menu-item-${index}`}
          item={item}
          commandsManager={commandsManager}
          servicesManager={servicesManager}
          {...props}
        />
      ))}
    </DropdownMenuContent>
  );
};

/**
 * The component provides a ... sub-menu for various components which appears
 * on hover over the main component.
 *
 * @param bindProps - properties to define the sub-menu
 * @returns Component bound to the bindProps
 */
export default function MoreDropdownMenu(bindProps) {
  const { menuItemsKey, getMenuItems = getMenuItemsDefault, commandsManager } = bindProps;
  const { servicesManager } = useSystem();
  const { customizationService } = servicesManager.services;

  const items = customizationService.getCustomization(menuItemsKey);

  if (!items?.length) {
    return null;
  }

  function BoundMoreDropdownMenu(props) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="hidden group-hover:inline-flex data-[state=open]:inline-flex"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <Icons.More />
          </Button>
        </DropdownMenuTrigger>
        {getMenuItems({
          ...props,
          commandsManager: commandsManager,
          servicesManager: servicesManager,
          items,
        })}
      </DropdownMenu>
    );
  }
  return BoundMoreDropdownMenu;
}
