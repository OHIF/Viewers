---
sidebar_position: 9
sidebar_label: Utility
---

# Module: Utility

## Overview

Often, an extension will need to expose some useful functionality to the other
extensions, or modes that consume the extension. For example, the `cornerstone-3d`
extension, uses its `utility` module to expose methods via

```js
getUtilityModule({ servicesManager }) {
    return [
      {
        name: 'common',
        exports: {
          getCornerstoneLibraries: () => {
            return { cornerstone3D, cornerstone3DTools };
          },
          getEnabledElement,
          Cornerstone3DViewportService,
          dicomLoaderService,
        },
      },
      {
        name: 'core',
        exports: {
          Enums: cs3DEnums,
          CONSTANTS,
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
Below, which is a code from `TrackedCornerstoneViewport` use the `getUtilityModule` method to get the internal `Cornerstone3DViewportService` which handles the `Cornerstone3D` viewport.

```js title="extensions/measurement-tracking/src/viewports/TrackedCornerstoneViewport.tsx"
const utilityModule = extensionManager.getModuleEntry(
  '@ohif/extension-cornerstone-3d.utilityModule.common'
);

const { Cornerstone3DViewportService } = utilityModule.exports;
const viewportId = Cornerstone3DViewportService.getViewportId(viewportIndex);
```
