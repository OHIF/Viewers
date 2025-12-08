import * as React from 'react';
import { useFloating, flip, shift, offset } from '@floating-ui/react-dom';
import { cn } from '../../lib/utils';
import { Icons } from '../Icons';
import type { ContextMenuItem as ContextMenuItemType } from '../../types/ContextMenuItem';

/**
 * Extended menu item type that includes submenu-related properties
 * from the ContextMenuItemsBuilder.
 *
 * Note: This should stay in sync with MenuItem from
 * extensions/default/src/CustomizableContextMenu/types.ts
 */
export interface DialogContextMenuItem extends ContextMenuItemType {
  subMenu?: string;
  actionType?: string;
  delegating?: boolean;
  value?: unknown;
  element?: HTMLElement;
}

/**
 * Menu definition type for submenu lookup.
 *
 * Note: This should stay in sync with Menu from
 * extensions/default/src/CustomizableContextMenu/types.ts
 */
export interface DialogContextMenuDefinition {
  id: string;
  items: Array<{
    label?: string;
    subMenu?: string;
    actionType?: string;
    delegating?: boolean;
    selector?: (props: Record<string, unknown>) => boolean;
    commands?: unknown[];
    action?: (item: unknown, props: unknown) => void;
  }>;
  selector?: (props: Record<string, unknown>) => boolean;
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
  menus?: DialogContextMenuDefinition[];

  /** The triggering event */
  event?: Event;

  /** Current submenu ID */
  subMenu?: string;

  /** Event detail data */
  eventData?: unknown;

  /** Callback to close the menu */
  onClose?: () => void;

  /**
   * LEGACY: Callback to show a submenu by closing current menu and opening a new one.
   * This is only used when `menus` prop is NOT provided, falling back to the old
   * "close and reopen" submenu behavior instead of inline Floating UI submenus.
   *
   * TODO: Review with team - can this be removed if all implementations use `menus` prop?
   */
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
  menuProps: DialogContextMenuProps;
  menus?: DialogContextMenuDefinition[];
  selectorProps?: Record<string, unknown>;
  event?: Event;
}> = ({ item, menuProps, menus, selectorProps, event }) => {
  const [isSubMenuOpen, setIsSubMenuOpen] = React.useState(false);
  const [subMenuItems, setSubMenuItems] = React.useState<DialogContextMenuItem[] | null>(null);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Floating UI for smart submenu positioning
  const { refs, floatingStyles } = useFloating({
    placement: 'right-start',
    middleware: [
      offset(4), // 4px gap between parent and submenu
      flip({
        fallbackPlacements: ['left-start', 'right-end', 'left-end'],
        padding: 8,
      }),
      shift({
        padding: 8,
      }),
    ],
  });

  // Determine if this item should show a nested submenu
  const hasSubMenu =
    !!menus && item.subMenu && item.actionType === 'ShowSubMenu' && !item.delegating;

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
            action:
              subItem.action ||
              ((adaptedItemRef, componentProps) => {
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
    }, 50);
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
      // For submenu items with menus available, toggle submenu on click (mobile-friendly)
      setIsSubMenuOpen(prev => !prev);
      return;
    }
    // For regular items or submenu items without menus (legacy flow), call action
    item.action(item, menuProps);
  }, [hasSubMenu, item, menuProps]);

  return (
    <div
      ref={refs.setReference}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        data-cy="context-menu-item"
        role="menuitem"
        tabIndex={0}
        className={cn(
          'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-base outline-none',
          'hover:bg-accent hover:text-accent-foreground',
          'focus-visible:bg-accent focus-visible:text-accent-foreground',
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
        <span className="ml-1 flex h-3 w-3 shrink-0 items-center justify-center">
          {item.iconRight && (
            <Icons.ByName
              name={item.iconRight}
              className="text-muted-foreground h-3 w-3"
            />
          )}
        </span>
      </div>

      {/* Submenu - positioned by Floating UI for viewport-aware placement */}
      {hasSubMenu && isSubMenuOpen && subMenuItems && subMenuItems.length > 0 && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          className={cn(
            'bg-popover text-popover-foreground z-50 min-w-40 rounded-md border border-input p-1 shadow-lg',
            'animate-in fade-in-0 zoom-in-95'
          )}
          onMouseEnter={handleSubMenuMouseEnter}
          onMouseLeave={handleSubMenuMouseLeave}
        >
          {subMenuItems.map((subItem, subIndex) => (
            <MenuItemRenderer
              key={subIndex}
              item={subItem}
              menuProps={menuProps}
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
 * This component serves as an adapter between the items-array API used by
 * ContextMenuController and the ui-next styling system. It renders menu items
 * with styling consistent with Radix UI context menus while supporting the
 * imperative show/hide pattern used by UIDialogService.
 *
 * Features:
 * - Matches ui-next ContextMenuContent/ContextMenuItem styling
 * - Supports nested submenus via hover with Floating UI for smart positioning
 * - Automatically flips submenu placement when near viewport edges
 * - Maintains data-cy attributes for Cypress testing
 * - Calls item.action(item, props) on click
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

  const menuProps: DialogContextMenuProps = { items, menus, selectorProps, event, ...props };

  return (
    <div
      data-cy="context-menu"
      role="menu"
      className={cn(
        'bg-popover text-popover-foreground z-50 min-w-40 rounded-md border border-input p-1 shadow-md',
        'animate-in fade-in-0 zoom-in-95'
      )}
      onContextMenu={e => e.preventDefault()}
    >
      {items.map((item, index) => (
        <MenuItemRenderer
          key={index}
          item={item}
          menuProps={menuProps}
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
