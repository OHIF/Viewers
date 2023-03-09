import { Types } from '@ohif/core';

/**
 * The selector props are provided to the various selector functions
 * used to enable or disable menus and menu items.
 * This enabled more context specific menus to be shown.
 * For example, the selector for Cornerstone context menus
 * includes items such as the display set information, the nearest/active
 * measurement and related information, and that, in turn allows for
 * simpler menus that are easier to navigate.  (See Bill Wallace's masters thesis
 * for measurements on complexity of user menus).
 */
export interface SelectorProps {
  // If the context menu is invoked in the context of a measurement, then it
  // will contain the nearby tool data.
  nearbyToolData?: Record<string, unknown>;

  // The tool name for the nearby tool
  toolName?: string;

  // An annotation UID - this will be present if nearyToolData is present.
  uid?: string;

  // If the context menu is invoked on an active viewport, then it will contain
  // the first display set.
  displaySet?: Record<string, unknown>;

  // The triggering event - can be used to determine key modifiers
  event?: Event;

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
  // this menu.  That allows sharing part of the menu structure, but also,
  // more importantly to use a single selector function to include/exclude
  // and entire section of sub-menu.
  delegating?: boolean;

  // A sub-menu is shown when this item is selected or is delegating.
  //  This item gives the name of the sub-menu.
  subMenu?: string;

  // The selector is used to determine if this menu entry will be shown
  // or more importantly, if the delegating subMenu will be included.
  selector?: (props: SelectorProps) => boolean;

  /** Adapts the item by filling in additional properties as requried */
  adaptItem?: (item: MenuItem, props: ContextMenuProps) => UIMenuItem;

  /** List of commands to run when this item's action is taken. */
  commands?: Types.Command[];
}

/**
 * A menu is a list of menu items, plus a selector.
 * The selector is used to determine whether the menu should be displayed
 * in a given context.  The parameters passed to the selector come from
 * the 'selectorProps' value in the options, and are intended to be context
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
  selectorProps: SelectorProps;
};
