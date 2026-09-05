import HeaderUndoRedo from '../ViewerLayout/HeaderUndoRedo';
import HeaderPatientInfo from '../ViewerLayout/HeaderPatientInfo';

/**
 * The right side of the viewer header's menu bar, ahead of the settings menu.
 * The key is named for the area, not its contents: `items` is an ordered list
 * of components, so reordering the array reorders the header (patient info
 * ahead of undo/redo, say), adding to it adds a slot, and removing an entry
 * removes one — see `hideHeaderUndoRedoCustomization` for that last case.
 *
 * `ViewerHeader` renders each entry as a component, so an item is a normal
 * component that may use hooks (these two use `useSystem()`), and each gets its
 * own separator. An item that renders `null` collapses its slot and separator.
 */
export default {
  'ohif.headerRightSide': {
    items: [HeaderUndoRedo, HeaderPatientInfo],
  },
};
