import { Types } from '@ohif/ui-next';
import { Menu, SelectorProps, MenuItem, ContextMenuProps } from './types';

type ContextMenuItem = Types.ContextMenuItem;

/**
 * Finds menu by menu id
 *
 * @returns Menu having the menuId
 */
export function findMenuById(menus: Menu[], menuId?: string): Menu {
  if (!menuId) {
    return;
  }

  return menus.find(menu => menu.id === menuId);
}

/**
 * Default finding menu method.  This method will go through
 * the list of menus until it finds the first one which
 * has no selector, OR has the selector, when applied to the
 * check props, return true.
 * The selectorProps are a set of provided properties which can be
 * passed into the selector function to determine when to display a menu.
 * For example, a selector function of:
 * `({displayset}) => displaySet?.SeriesDescription?.indexOf?.('Left')!==-1
 * would match series descriptions containing 'Left'.
 *
 * @param {Object[]} menus List of menus
 * @param {*} subProps
 * @returns
 */
export function findMenuDefault(menus: Menu[], subProps: Record<string, unknown>): Menu {
  if (!menus) {
    return null;
  }
  return menus.find(menu => !menu.selector || menu.selector(subProps.selectorProps));
}

/**
 * Finds the menu to be used for different scenarios:
 * This will first look for a subMenu with the specified subMenuId
 * Next it will look for the first menu whose selector returns true.
 *
 * @param menus - List of menus
 * @param props - root props
 * @param menuIdFilter - menu id identifier (to be considered on selection)
 *      This is intended to support other types of filtering in the future.
 */
export function findMenu(menus: Menu[], props?: Types.IProps, menuIdFilter?: string) {
  const { subMenu } = props;

  function* findMenuIterator() {
    yield findMenuById(menus, menuIdFilter || subMenu);
    yield findMenuDefault(menus, props);
  }

  const findIt = findMenuIterator();

  let current = findIt.next();
  let menu = current.value;

  while (!current.done) {
    menu = current.value;

    if (menu) {
      findIt.return();
    }
    current = findIt.next();
  }

  return menu;
}

/**
 * Returns the menu from a list of possible menus, based on the actual state of component props and tool data nearby.
 * This uses the findMenu command above to first find the appropriate
 * menu, and then it chooses the actual contents of that menu.
 * A menu item can be optional by implementing the 'selector',
 * which will be called with the selectorProps, and if it does not return true,
 * then the item is excluded.
 *
 * Other menus can be delegated to by setting the delegating value to
 * a string id for another menu.  That menu's content will replace the
 * current menu item (only if the item would be included).
 *
 * This allows single id menus to be chosen by id, but have varying contents
 * based on the delegated menus.
 *
 * Finally, for each item, the adaptItem call is made.  This allows
 * items to modify themselves before being displayed, such as
 * incorporating additional information from translation sources.
 * See the `test-mode` examples for details.
 *
 * @param selectorProps
 * @param {*} event event that originates the context menu
 * @param {*} menus List of menus
 * @param {*} menuIdFilter
 * @returns
 */
export function getMenuItems(
  selectorProps: SelectorProps,
  event: Event,
  menus: Menu[],
  menuIdFilter?: string
): MenuItem[] | void {
  // Include both the check props and the ...check props as one is used
  // by the child menu and the other used by the selector function
  const subProps = { selectorProps, event };

  const menu = findMenu(menus, subProps, menuIdFilter);

  if (!menu) {
    return undefined;
  }

  if (!menu.items) {
    console.warn('Must define items in menu', menu);
    return [];
  }

  let menuItems = [];
  menu.items.forEach(item => {
    const { delegating, selector, subMenu } = item;

    if (!selector || selector(selectorProps)) {
      if (delegating) {
        menuItems = [...menuItems, ...getMenuItems(selectorProps, event, menus, subMenu)];
      } else {
        const toAdd = adaptItem(item, subProps);
        menuItems.push(toAdd);
      }
    }
  });

  return menuItems;
}

/**
 * Returns item adapted to be consumed by ContextMenu component
 * and then goes through the item to add action behaviour for clicking the item,
 * making it compatible with the default ContextMenu display.
 *
 * @param {Object} item
 * @param {Object} subProps
 * @returns a MenuItem that is compatible with the base ContextMenu
 *    This requires having a label and set of actions to be called.
 */
export function adaptItem(item: MenuItem, subProps: ContextMenuProps): ContextMenuItem {
  const newItem: ContextMenuItem = {
    ...item,
    value: subProps.selectorProps?.value,
  };

  if (item.actionType === 'ShowSubMenu' && !newItem.iconRight) {
    newItem.iconRight = 'chevron-down';
  }
  if (!item.action) {
    newItem.action = (itemRef, componentProps) => {
      const { event = {} } = componentProps;
      const { detail = {} } = event;
      newItem.element = detail.element;

      componentProps.onClose();
      const action = componentProps[`on${itemRef.actionType || 'Default'}`];
      if (action) {
        action.call(componentProps, newItem, itemRef, subProps);
      } else {
        console.warn('No action defined for', itemRef);
      }
    };
  }

  return newItem;
}
