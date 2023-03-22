export type ContextMenuItem = {
  // A label to show for the item.
  label: string;
  // An icon to show the on right of the text - typically used for submenus
  iconRight?: string;
  action: (item, component) => void;
};
