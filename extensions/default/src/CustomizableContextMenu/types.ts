import { Types } from '@ohif/core';

/**
 * SelectorProps are properties used to decide whether to select a menu or
 * menu item for display.
 * An instance of SelectorProps is provided to the selector functions, which
 * return true to include the item or false to exclude it.
 * The point of this is to allow more specific context menus which hide
 * non-relevant menu options, optimizing the speed of selection of menus
 */
export interface SelectorProps {
  // If the context menu is invoked in the context of a measurement, then it
  // will contain the nearby tool data.
  nearbyToolData?: Record<string, unknown>;

  // The tool name for the nearby tool
  toolName?: string;

  // An annotation UID - this will be present if nearbyToolData is present.
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
 * A MenuItem is a single line item within a menu, and specifies a selectable
 * value for the menu.
 */
export interface MenuItem {
  id?: string;
  /**
   * The customization type is used to apply preset values to this item
   * when registered with the customization service.
   */
  inheritsFrom?: string;

  // The label is the value to show in the menu for this item
  label?: string;

  // Delegating items are used to include other sub-menus inline within
  // this menu.  That allows sharing part of the menu structure, but also,
  // more importantly to use a single selector function to include/exclude
  // and entire section of sub-menu.
  // See the `siteSelectionSubMenu` within the example `findingsMenu`
  // for an example
  delegating?: boolean;

  // A sub-menu is shown when this item is selected or is delegating.
  //  This item gives the name of the sub-menu.
  subMenu?: string;

  // The selector is used to determine if this menu entry will be shown
  // or more importantly, if the delegating subMenu will be included.
  selector?: (props: SelectorProps) => boolean;

  /** Adapts the item by filling in additional properties as required */
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
  inheritsFrom?: string;

  // Choose whether this menu applies.
  selector?: Types.Predicate;

  items: MenuItem[];
}

export type Point = {
  x: number;
  y: number;
};

/**
 * ContextMenuProps is the top level argument used to invoke the context menu
 * itself.  It contains the menus available for display, as well as the event
 * and selector props used to decide the menu.
 */
export type ContextMenuProps = {
  event?: EventTarget;
  menuCustomizationId?: string;
  menuId: string;
  element?: HTMLElement;

  /** A set of menus to choose from for this context menu */
  menus: Menu[];

  /** The properties used to decide the menu type */
  selectorProps: SelectorProps;

  defaultPointsPosition?: [number, number] | [];
};
