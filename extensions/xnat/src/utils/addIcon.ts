import { addIcon as addIconUI } from '@ohif/ui';
import { Icons } from '@ohif/ui-next';

/** Adds the icon to both ui and ui-next */
export function addIcon(name, icon) {
  addIconUI(name, icon);
  Icons.addIcon(name, icon);
}
