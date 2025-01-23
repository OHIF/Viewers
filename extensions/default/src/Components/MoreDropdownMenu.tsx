import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Icons,
  Button,
} from '@ohif/ui-next';

/**
 * The default sub-menu appearance and setup is defined here, but this can be
 * replaced by
 */
const getMenuItemsDefault = ({ commandsManager, items, servicesManager, ...props }) => {
  const { customizationService } = servicesManager.services;

  // This allows replacing the default child item for menus, whereas the entire
  // getMenuItems can also be replaced by providing it to the MoreDropdownMenu
  const menuContent = customizationService.getCustomization('ohif.menuContent');

  return (
    <DropdownMenuContent
      hideWhenDetached
      align="start"
      onClick={e => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      {items?.map((item, index) =>
        React.createElement(menuContent.content, {
          key: item.id || `menu-item-${index}`,
          item,
          commandsManager,
          servicesManager,
          ...props,
        })
      )}
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
  const {
    menuItemsKey,
    getMenuItems = getMenuItemsDefault,
    commandsManager,
    servicesManager,
  } = bindProps;
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
