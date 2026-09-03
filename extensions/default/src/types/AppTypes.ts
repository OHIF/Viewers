/* eslint-disable @typescript-eslint/no-namespace */
import type { ComponentType } from 'react';

declare global {
  namespace AppTypes {
    interface Customizations {
      /**
       * The right side of the viewer header's menu bar, ahead of the patient
       * info and settings menu. `ViewerHeader` renders it as a component, so a
       * replacement may use hooks. Set it to `null` to render nothing there —
       * the `@ohif/extension-default.customizationModule.hideHeaderRightSide`
       * module does exactly that. The shipped default is the undo/redo buttons.
       */
      'ohif.headerRightSide': ComponentType | null;
    }
  }
}
