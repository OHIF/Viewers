---
sidebar_position: 9
sidebar_label: Utility
---

# Module: Utility

## Overview

Often, an extension will need to expose some useful functionality to the other
extensions, or modes that consume the extension. For example, the `cornerstone`
extension, uses its `utility` module to expose methods via

```js
getUtilityModule({ servicesManager }) {
    return [
      {
        name: 'common',
        exports: {
          getCornerstoneLibraries: () => {
            return { cornerstone, cornerstoneTools };
          },
          getEnabledElement,
          CornerstoneViewportService,
          dicomLoaderService,
        },
      },
      {
        name: 'core',
        exports: {
          Enums: cs3DEnums,
        },
      },
      {
        name: 'tools',
        exports: {
          toolNames,
          Enums: cs3DToolsEnums,
        },
      },
    ];
  },
};
```

Then a consuming extension can use `getModuleEntry` to access the methods
Below, which is a code from `TrackedCornerstoneViewport` use the `getUtilityModule` method to get the internal `CornerstoneViewportService` which handles the `Cornerstone` viewport.

```js title="extensions/measurement-tracking/src/viewports/TrackedCornerstoneViewport.tsx"
const utilityModule = extensionManager.getModuleEntry(
  '@ohif/extension-cornerstone.utilityModule.common'
);

const { CornerstoneViewportService } = utilityModule.exports;
```
