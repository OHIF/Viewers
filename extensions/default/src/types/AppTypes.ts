/* eslint-disable @typescript-eslint/no-namespace */
import type { ComponentType } from 'react';

declare global {
  namespace AppTypes {
    interface Customizations {
      /**
       * The undo/redo section of the viewer header's right hand menu bar.
       * Rendered by `ViewerHeader` as a component, so a replacement may use
       * hooks. Set it to `null` to render nothing there — the
       * `@ohif/extension-default.customizationModule.hideUndoRedo` module does
       * exactly that.
       */
      'ohif.headerUndoRedo': ComponentType | null;
    }
  }
}
