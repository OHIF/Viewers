/* eslint-disable @typescript-eslint/no-namespace */
import type { ComponentType } from 'react';

declare global {
  namespace AppTypes {
    interface Customizations {
      /**
       * The right side of the viewer header's menu bar, ahead of the settings
       * menu. `items` is an ordered list of components — undo/redo and patient
       * info by default — each rendered by `ViewerHeader` in its own separated
       * slot, so reordering the array reorders the header and dropping an entry
       * removes it (the
       * `@ohif/extension-default.customizationModule.hideHeaderUndoRedo` module
       * does exactly that). Items take no props and may use hooks; one that
       * renders `null` collapses its slot.
       */
      'ohif.headerRightSide': { items: ComponentType[] };
    }
  }
}
