---
sidebar_position: 1
sidebar_label: 3.8 -> 3.9-beta
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';


# Migration Guide


## React 18 Migration Guide
As we upgrade to React 18, we're making some exciting changes to improve performance and developer experience. This guide will help you navigate the key updates and ensure your custom extensions and modes are compatible with the new version.
What's Changing?
<Tabs>
  <TabItem value="Before" label="Before" default>

```md
- React 17
- Using `defaultProps`
- `babel-inline-svg` for SVG imports
```

  </TabItem>
  <TabItem value="After" label="After">

```md
- React 18
- Default parameters for props
- `svgr` for SVG imports
```

  </TabItem>
</Tabs>


### Run newer yarn version
You must be running a newer yarn version for react 18.
It isn't clear the exact yarn required.

### Update React version:
In your custom extensions and modes, change the version of react and react-dom to ^18.3.1.

### Replace defaultProps with default parameters:

<Tabs>
  <TabItem value="Before" label="Before" default>

```jsx
const MyComponent = ({ prop1, prop2 }) => {
  return <div>{prop1} {prop2}</div>
}

MyComponent.defaultProps = {
  prop1: 'default value',
  prop2: 'default value'
}
```

  </TabItem>
  <TabItem value="After" label="After">

```jsx
const MyComponent = ({ prop1 = 'default value', prop2 = 'default value' }) => {
  return <div>{prop1} {prop2}</div>
}
```
  </TabItem>
</Tabs>

### Update SVG imports:

<Tabs>
  <TabItem value="Before" label="Before" default>

```javascript
import arrowDown from './../../assets/icons/arrow-down.svg';
```

  </TabItem>
  <TabItem value="After" label="After">

```javascript
import { ReactComponent as arrowDown } from './../../assets/icons/arrow-down.svg';
```

  </TabItem>
</Tabs>


<br/>

---

<br/>

## Renaming

The panel in the default extension is renamed from `measure` to `measurements` to be more consistent with the rest of the extensions.

**Action Needed**

Update any references to the `measure` panel to `measurements` in your code.

Find and replace

<Tabs>
  <TabItem value="Before" label="Before 🕰️" default>
    @ohif/extension-default.panelModule.measure
  </TabItem>
  <TabItem value="After" label="After 🚀" >
    @ohif/extension-default.panelModule.measurements
  </TabItem>
</Tabs>


<br/>

---

<br/>

## RTStructure Set has transitioned from VTK actors to SVG.

We have transitioned from VTK-based rendering to SVG-based rendering for RTStructure Set contours. This change should not require any modifications to your codebase. We anticipate improved stability and speed in our contour rendering.

As a result of this update, viewports rendering RTStructure Sets will no longer convert to volume viewports. Instead, they will remain as stack viewports.


Read more in Pull Requests:
- https://github.com/OHIF/Viewers/pull/4074
- https://github.com/OHIF/Viewers/pull/4157

<br/>

---

<br/>

## Crosshairs

They now have new colors in their associated viewports in the MPR view. However, you can turn this feature off.

To disable it, remove the configuration from the `initToolGroups` in your mode.

```
{
  configuration: {
    viewportIndicators: true,
    viewportIndicatorsConfig: {
      circleRadius: 5,
      xOffset: 0.95,
      yOffset: 0.05,
    },
  }
}
```

<br/>

---

<br/>

## External Libraries
Some libraries are loaded via dynamic import.  You can provide a global function
`browserImport` the allows loading of dynamic imports without affecting the
webpack build.  This import looks like:

```
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

```
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

### Usage of Dynamic Imports


## BulkDataURI Configuration

We've updated the configuration for BulkDataURI to provide more flexibility and control. This guide will help you migrate from the old configuration to the new one.

### What's Changing?

<Tabs>
  <TabItem value="Before" label="Before 🕰️" default>

```javascript
useBulkDataURI: false,
```

  </TabItem>
  <TabItem value="After" label="After 🚀">

```javascript
bulkDataURI: {
  enabled: true,
  // Additional configuration options
},
```

  </TabItem>
</Tabs>


Additional Notes:
- The new configuration allows for more granular control over BulkDataURI behavior.
- You can now add custom URL prefixing logic using the startsWith and prefixWith properties.
- This change enables easier correction of retrieval URLs, especially in scenarios where URLs pass through multiple systems.


<br/>

---

<br/>

## Polyfill.io

We have removed the Polyfill.io script from the Viewer. If you require polyfills, you can add them to your project manually. This change primarily affects Internet Explorer, which Microsoft has already [ended support for](https://learn.microsoft.com/en-us/lifecycle/faq/internet-explorer-microsoft-edge#is-internet-explorer-11-the-last-version-of-internet-explorer-).


<br/>

---

<br/>

## Dynamic Modules

TBD

## Renaming some interfaces
A few interfaces are being renamed to simple types to reflect the fact that
they don't contain methods and are thus more properly simple types.

* IDisplaySet renamed to DisplaySet
  * Adding some field declarations to agree with actual usage


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
