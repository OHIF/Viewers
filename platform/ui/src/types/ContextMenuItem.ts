export type ContextMenuItem = {
  // A label to show for the item.
  label: string;
  // An icon to show the on right of the text - typically used for submenus
  iconRight?: string;
  // item is the menu item (eg the instance of this that is clicked on)
  // props is the remaining properties passed to the context menu
  action: (item, props) => void;
};
