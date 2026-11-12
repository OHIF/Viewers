---
title: Other Changes
summary: Migration guide for additional changes in OHIF 3.9, covering external library loading with browserImport function, the pluginConfig.json format for dynamic imports, and improvements to viewport navigation using ViewReference methods.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';


## External Libraries
Some libraries are loaded via dynamic import.  You can provide a global function
`browserImport` the allows loading of dynamic imports without affecting the
webpack build.  This import looks like:

```html
<script>
  function browserImportFunction(moduleId) {
    return import(moduleId);
  }
</script>
```

and belongs in the root html file for your application.
You then need to remove `dependencies` on the external import, and add a reference
to the external import in your `pluginConfig.json` file.

### Example plugin config for `dicom-microscopy-viewer`
The example below imports the `dicom-microscopy-viewer` for use as an external
dependency.  The example is part of the default `pluginConfig.json` file.

```json
  "public": [
    {
      "directory": "./platform/public"
    },
    {
      "packageName": "dicom-microscopy-viewer",
      "importPath": "/dicom-microscopy-viewer/dicomMicroscopyViewer.min.js",
      "globalName": "dicomMicroscopyViewer",
      "directory": "./node_modules/dicom-microscopy-viewer/dist/dynamic-import"
    }
  ]
```

This defines two directory modules, whose contents are copied unchanged to the
output build directory.  It then defines the `dicom-microscopy-viewer` using
the `packageName` element as being a module which is imported dynamically.
Then, the import path passed into the browserImportFunction above is
specified, and then how to access the import itself, via the `window.dicomMicroscopyViewer`
global name reference.

### Referencing External Imports
The appConfig either defines or has a default peerImport function which can be
used to load references to the modules defined in the pluginConfig file.  See
the example in `init.tsx` for the cornerstone extension for how this is passed
into CS3D for loading the whole slide imaging library.



---



---


---


## Use of ViewReference for navigation
When navigating to measurements and storing/remembering navigation positions,
the `viewport.getViewReference` is used to get a position, and `viewport.isReferenceViewable`
used to check if a reference can be applied, and finally `viewport.setViewReference` to
navigate to a view.  Note that this changes the behaviour of navigation between
MPR and Stack viewports, and also enables navigation of video and microscopy
viewports in CS3D.  This can cause some unexpected behaviour depending on how the
frame of reference values are configured to allow for navigation.

The isReferenceViewable is used to determine when a view or measurement can be
shown on a given view.  For stack versus volume viewports, this can cause unexpected
behaviour to be seen depending on how the view reference was fetched.

### `getViewReference` with `forFrameOfReference`
When a view reference is fetched with the for frame of reference flag set to true,
a reference will be returned which can be displayed on any viewport containing
the same frame of reference and encompassing the given FOR and able to display the required
orientation.  Without this flag, a view reference is returned which will be
displayed on a stack with the given image id, or a volume containing said image id
or the specified volume.

### `isReferenceViewable` with navigation and/or orientation
The is reference viewable will return false unless the given reference is directly
viewable in the viewport as is.  However, it can be passed various flags to determine
whether the reference could be displayed if the viewport was modified in various ways,
for example, by changing the position or orientation of the viewport.  This allows
checking for degrees of closeness so that the correct viewport can be chosen.

Note that this may result in displaying a measurement from one viewport on a completely
different viewport, for example, showing a Probe tool from the stack viewport on
an MPR view.
