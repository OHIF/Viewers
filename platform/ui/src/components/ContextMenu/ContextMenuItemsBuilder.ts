import { Types } from '@ohif/ui';
import { Menu, CheckProps, MenuItem, ContextMenuProps } from './types';

/**
 * Context menu items builder is a collection of classes to help determine
 * which context menu to show, based on a set of properties.
 */
// menus category to be skipped when doing a depth search.
const menuCategoryBlacklist = ['history'];

/**
 * Finds menu by menu id
 *
 * @returns Menu having the menuId
 */
export function findMenuByMenuId(menus, menuId): Menu {
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
 * The checkProps are a set of provided properties which can be
 * passed into the selector function to determine when to display a menu.
 * For example, a selector function of:
 * `({displayset}) => displaySet?.SeriesDescription?.indexOf?.('Left')!==-1
 * would match series descriptions containing 'Left'.
 *
 * @param {Object[]} menus List of menus
 * @param {*} subProps
 * @returns
 */
export function findMenuDefault(menus: Menu[], subProps: Types.IProps): Menu {
  if (!menus) {
    return null;
  }
  return menus.find(
    menu => !menu.selector || menu.selector(subProps.checkProps)
  );
}

/**
 * Finds the menu to be used for different scenarios:
 * This will first look for a subMenu with the specified subMenuId
 * Next it will look for the first menu whose selector returns true.
 *
 * @param {Object[]} menus List of menus
 * @param {Object} props root props
 * @param {Object} props sub
 * @param {string} [menuIdFilter] menu id identifier (to be considered on selection)
 * @returns
 */
export function findMenu(
  menus: Menu[],
  props?: Types.IProps,
  menuIdFilter?: string
) {
  const { subMenu } = props;

  function* findMenuIterator() {
    yield findMenuByMenuId(menus, menuIdFilter || subMenu);
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

  console.log('Menu chosen', menu?.id || 'NONE');

  return menu;
}

/**
 * Returns the menu from a list of possible menus, based on the actual state of component props and tool data nearby.
 * This uses the findMenu command above to first find the appropriate
 * menu, and then it chooses the actual contents of that menu.
 * A menu item can be optional by implementing the 'checkFunction',
 * which will be called with the checkProps, and if it does not return true,
 * then the item is excluded.
 *
 * Other menus can be delegated to by setting the delegating value to
 * a string id for another menu.  That menu's content will replace the
 * current menu item (only if the item would be included).
 *
 * This allows single id menus to be chosen by id, but have varying contents
 * based on the delegated menus.
 *
 * Finally, for each item, the adaptItems call is made.  This allows
 * items to modify themselves before being displayed, such as
 * incorporating additional information from translation sources.
 * See the `test-mode` examples for details.
 *
 * @param checkProps
 * @param {*} event event that originates the context menu
 * @param {*} menus List of menus
 * @param {*} menuIdFilter
 * @returns
 */
export function getMenuItems(
  checkProps: Types.IProps,
  event: Event,
  menus: Menu[],
  menuIdFilter?: string
): MenuItem[] | void {
  // Include both the check props and the ...check props as one is used
  // by the child menu and the other used by the selector function
  const subProps = { checkProps, event };

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
    const { delegating, checkFunction, subMenu } = item;

    if (!checkFunction || checkFunction(checkProps)) {
      if (delegating) {
        menuItems = [
          ...menuItems,
          ...getMenuItems(checkProps, event, menus, subMenu),
        ];
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
 * This calls the item.adaptItem value if present, and then
 * goes through and adds action behaviour for clicking the item.
 * to make it compatible with the default ContextMenu display.
 *
 * @param {Object} item
 * @param {Object} subProps
 * @returns a MenuItem that is compatible with the base ContextMenu
 *    This requires having a label and set of actions to be called.
 */
export function adaptItem(
  item: MenuItem,
  subProps: ContextMenuProps
): UIMenuItem {
  const newItem = item.adaptItem?.(item, subProps) || {
    ...item,
    value: subProps.checkProps?.value,
  };

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
