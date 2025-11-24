import * as React from 'react';
import { cn } from '../../lib/utils';
import { Icons } from '../Icons';
import type { ContextMenuItem as ContextMenuItemType } from '../../types/ContextMenuItem';

/**
 * Extended menu item type that includes submenu-related properties
 * from the ContextMenuItemsBuilder
 */
export interface DialogContextMenuItem extends ContextMenuItemType {
  subMenu?: string;
  actionType?: string;
  delegating?: boolean;
  value?: unknown;
  element?: HTMLElement;
}

/**
 * Props passed to DialogContextMenu from ContextMenuController via UIDialogService
 */
export interface DialogContextMenuProps {
  /** Array of menu items to display */
  items?: DialogContextMenuItem[];

  /** Props used for menu/item selection */
  selectorProps?: Record<string, unknown>;

  /** Available menus for submenu lookup */
  menus?: Array<{
    id: string;
    items: Array<{
      label?: string;
      subMenu?: string;
      actionType?: string;
      delegating?: boolean;
      selector?: (props: Record<string, unknown>) => boolean;
      commands?: unknown[];
    }>;
    selector?: (props: Record<string, unknown>) => boolean;
  }>;

  /** The triggering event */
  event?: Event;

  /** Current submenu ID */
  subMenu?: string;

  /** Event detail data */
  eventData?: unknown;

  /** Callback to close the menu */
  onClose?: () => void;

  /** Callback to show a submenu (used for legacy submenu handling) */
  onShowSubMenu?: (
    item: DialogContextMenuItem,
    itemRef: DialogContextMenuItem,
    subProps: Record<string, unknown>
  ) => void;

  /** Default action callback */
  onDefault?: (
    item: DialogContextMenuItem,
    itemRef: DialogContextMenuItem,
    subProps: Record<string, unknown>
  ) => void;
}

/**
 * Recursively renders menu items, supporting nested submenus via hover
 */
const MenuItemRenderer: React.FC<{
  item: DialogContextMenuItem;
  index: number;
  props: DialogContextMenuProps;
  menus?: DialogContextMenuProps['menus'];
  selectorProps?: Record<string, unknown>;
  event?: Event;
}> = ({ item, index, props, menus, selectorProps, event }) => {
  const [isSubMenuOpen, setIsSubMenuOpen] = React.useState(false);
  const [subMenuItems, setSubMenuItems] = React.useState<DialogContextMenuItem[] | null>(null);
  const itemRef = React.useRef<HTMLDivElement>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  const hasSubMenu = item.subMenu && item.actionType === 'ShowSubMenu' && !item.delegating;

  const handleMouseEnter = React.useCallback(() => {
    if (!hasSubMenu || !menus) {
      return;
    }

    // Clear any pending close timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Find submenu items
    const subMenu = menus.find(menu => menu.id === item.subMenu);
    if (subMenu?.items) {
      // Adapt submenu items similar to ContextMenuItemsBuilder.adaptItem
      const adaptedItems = subMenu.items
        .filter(subItem => !subItem.selector || subItem.selector(selectorProps || {}))
        .map(subItem => {
          const adapted: DialogContextMenuItem = {
            ...subItem,
            label: subItem.label || '',
            action: subItem.action || ((itemRef, componentProps) => {
              componentProps.onClose?.();
              const actionHandler = componentProps[`on${subItem.actionType || 'Default'}`];
              if (actionHandler) {
                actionHandler.call(componentProps, adapted, subItem, { selectorProps, event });
              }
            }),
          };

          if (subItem.actionType === 'ShowSubMenu' && !adapted.iconRight) {
            adapted.iconRight = 'chevron-right';
          }

          return adapted;
        });

      setSubMenuItems(adaptedItems);
      setIsSubMenuOpen(true);
    }
  }, [hasSubMenu, menus, item.subMenu, selectorProps, event]);

  const handleMouseLeave = React.useCallback(() => {
    // Delay closing to allow moving to submenu
    timeoutRef.current = setTimeout(() => {
      setIsSubMenuOpen(false);
    }, 100);
  }, []);

  const handleSubMenuMouseEnter = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const handleSubMenuMouseLeave = React.useCallback(() => {
    setIsSubMenuOpen(false);
  }, []);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleClick = React.useCallback(() => {
    if (hasSubMenu) {
      // For submenu items, toggle submenu on click (mobile-friendly)
      setIsSubMenuOpen(prev => !prev);
      return;
    }
    item.action(item, props);
  }, [hasSubMenu, item, props]);

  return (
    <div
      ref={itemRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        data-cy="context-menu-item"
        role="menuitem"
        tabIndex={0}
        className={cn(
          'focus:bg-accent focus:text-accent-foreground relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
          'hover:bg-accent hover:text-accent-foreground',
          'data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
        )}
        onClick={handleClick}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <span className="flex-1">{item.label}</span>
        {item.iconRight && (
          <Icons.ByName
            name={item.iconRight}
            className="text-muted-foreground ml-2 h-4 w-4"
          />
        )}
      </div>

      {/* Submenu */}
      {hasSubMenu && isSubMenuOpen && subMenuItems && subMenuItems.length > 0 && (
        <div
          className={cn(
            'bg-popover text-popover-foreground absolute left-full top-0 z-50 ml-1 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-lg',
            'animate-in fade-in-0 zoom-in-95 slide-in-from-left-2'
          )}
          onMouseEnter={handleSubMenuMouseEnter}
          onMouseLeave={handleSubMenuMouseLeave}
        >
          {subMenuItems.map((subItem, subIndex) => (
            <MenuItemRenderer
              key={subIndex}
              item={subItem}
              index={subIndex}
              props={props}
              menus={menus}
              selectorProps={selectorProps}
              event={event}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * DialogContextMenu - A context menu component designed to work with UIDialogService.
 *
 * This component serves as an adapter between the legacy items-array API used by
 * ContextMenuController and the ui-next styling system. It renders menu items
 * with styling consistent with Radix UI context menus while supporting the
 * imperative show/hide pattern used by UIDialogService.
 *
 * Features:
 * - Matches ui-next ContextMenuContent/ContextMenuItem styling
 * - Supports nested submenus via hover
 * - Maintains data-cy attributes for Cypress testing
 * - Calls item.action(item, props) on click (same contract as legacy)
 * - Supports iconRight for submenu indicators
 */
export const DialogContextMenu: React.FC<DialogContextMenuProps> = ({
  items,
  menus,
  selectorProps,
  event,
  ...props
}) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div
      data-cy="context-menu"
      role="menu"
      className={cn(
        'bg-popover text-popover-foreground z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-md',
        'animate-in fade-in-0 zoom-in-95'
      )}
      onContextMenu={e => e.preventDefault()}
    >
      {items.map((item, index) => (
        <MenuItemRenderer
          key={index}
          item={item}
          index={index}
          props={{ items, menus, selectorProps, event, ...props }}
          menus={menus}
          selectorProps={selectorProps}
          event={event}
        />
      ))}
    </div>
  );
};

DialogContextMenu.displayName = 'DialogContextMenu';

export default DialogContextMenu;
