import { Types } from '@ohif/core';

/**
 * The check props are used to check if a given menu is applicable in any
 * given situation.  The actual contents of the check props is defined
 * by the type of context menu.  For example, Cornerstone context menus
 * include items such as the display set information, the nearest/active
 * measurement and related information.  This allows context menus to
 * be much more context sensitive, and show up in various situations such
 * as only for certain body parts.  This reduces the amount of effort required
 * for a user to figure out where to go in the context menu.
 */
export interface CheckProps {
  // If the context menu is invoked in the context of a measurement, then it
  // will contain the nearby tool data.
  nearbyToolData?: Record<string, unknown>;

  // If the context menu is invoked on an active viewport, then it will contain
  // the first display set.
  displaySet?: Record<string, unknown>;

  // Any other properties
  [propertyName: string]: unknown;
}

/**
 * The type of item actually required for the ContextMenu UI display
 */
export type UIMenuItem = {
  label: string;
  // Called when the item is selected
  action?: (itemRef, componentProps) => void;
};

/**
 * A MenuEntry is a single line item within a menu, and specifies a selectable
 * value for the menu.
 */
export interface MenuItem {
  id?: string;
  /** The customization type is used to apply preset values to this item
   * when registered with the customization service.
   */
  customizationType?: string;

  // The label is the value to show in the menu for this item
  label?: string;

  // Delegating items are used to include other sub-menus inline within
  // this menu.  That allows sharing part of the menu structure.
  delegating?: boolean;

  // A sub-menu is shown when this item is selected or is delegating.
  //  This item gives the name of the sub-menu.
  subMenu?: string;

  // The checkFunction is used to determine if this menu entry will be shown
  // or more importantly, if the delegating subMenu will be included.
  checkFunction?: (props: CheckProps) => boolean;

  /** Adapts the item by filling in additional properties as requried */
  adaptItem?: (item: MenuItem, props: ContextMenuProps) => UIMenuItem;

  /** List of commands to run when this item's action is taken. */
  commands?: Types.Command[];
}

/**
 * A menu is a list of menu items, plus a selector.
 * The selector is used to determine whether the menu should be displayed
 * in a given context.  The parameters passed to the selector come from
 * the 'checkProps' value in the options, and are intended to be context
 * specific values containing things like the selected object, the currently
 * displayed study etc so that the context menu can dynamically choose which
 * view to show.
 */
export interface Menu {
  id: string;

  /** The customization type is used to apply preset values to this item
   * when registered with the customization service.
   */
  customizationType?: string;

  // Choose whether this menu applies.
  selector?: Types.Predicate;

  items: MenuItem[];
}

export type Point = {
  x: number;
  y: number;
};

export type ContextMenuProps = {
  event?: EventTarget;
  subMenu?: string;
  menuId: string;

  /** A set of menus to choose from for this context menu */
  menus: Menu[];

  /** The properties used to decide the menu type */
  checkProps: CheckProps;
};
