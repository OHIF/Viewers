---
id: 0-general
title: General
summary: General migration changes from OHIF 3.8 to 3.9, including removing SharedArrayBuffer requirements, React 18 updates, Polyfill removal, webpack changes, scroll utility relocation, Crosshairs improvements, and toolbar button evaluation enhancements.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# No SharedArrayBuffer anymore!

We have streamlined the process of loading volumes without sacrificing speed by eliminating the need for shared array buffers. This change resolves issues across various frameworks, where previously, specific security headers were required. Now, you can remove any previously set headers, which lowers the barrier for adopting Cornerstone 3D in frameworks that didn't support those headers. Shared array buffers are no longer necessary, and all related headers can be removed.

You can remove `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` from your custom headers if you don't need them in other
aspects of your app.

# React 18 Migration Guide
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


## Update React version:
In your custom extensions and modes, change the version of react and react-dom to ^18.3.1.

## Replace defaultProps with default parameters:

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

## Update SVG imports:

You might need to update your SVG imports to use the `ReactComponent` syntax, if you want to use the old Icon component. However, we have made a significant change to how we handle Icons, read the UI Migration Guide for more information.

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

---

## Polyfill.io

We have removed the Polyfill.io script from the Viewer. If you require polyfills, you can add them to your project manually. This change primarily affects Internet Explorer, which Microsoft has already [ended support for](https://learn.microsoft.com/en-us/lifecycle/faq/internet-explorer-microsoft-edge#is-internet-explorer-11-the-last-version-of-internet-explorer-).


---

## Webpack changes

We previously were copying dicom-image-loader wasm files to the public folder via

```js
// platform/app/.webpack/webpack.pwa.js
{
  from: '../../../node_modules/@cornerstonejs/dicom-image-loader/dist/dynamic-import',
  to: DIST_DIR,
},
```

but now after our upgrade to Cornerstone 3D 2.0, we don't need to do this anymore.


---
## Scroll utility


The `jumpToSlice` utility has been relocated from `@cornerstonejs/tools` utilities to `@cornerstonejs/core/utilities`.

migration

```js
import { jumpToSlice } from '@cornerstonejs/core/utilities';
```


---

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

---


## useAuthorizationCodeFlow

`useAuthorizationCodeFlow` config is deprecated

now internally we detect the authorizationCodeFlow if the response_type is equal to `code`

you can remove the config from the appConfig

---

## StackScrollMouseWheel -> StackScroll Tool + Mouse bindings

If you previously used:

```js
{ toolName: toolNames.StackScrollMouseWheel, bindings: [] }
```

in your `initToolGroups`, you should now use:

```js
{
  toolName: toolNames.StackScroll,
  bindings: [{ mouseButton: Enums.MouseBindings.Wheel }],
}
```

This change allows for more flexible mouse bindings and keyboard combinations.

## VolumeRotateMouseWheel -> VolumeRotate Tool + Mouse bindings

Before:

```js
{
  toolName: toolNames.VolumeRotateMouseWheel,
  configuration: {
    rotateIncrementDegrees: 5,
  },
},
```

Now:

```js
{
  toolName: toolNames.VolumeRotate,
  bindings: [{ mouseButton: Enums.MouseBindings.Wheel }],
  configuration: {
    rotateIncrementDegrees: 5,
  },
},
```

---

## CustomizationService

The `CustomizationService` uses `contentF` instead of `content`.

So make sure your customizations are updated accordingly.

---

## SidePanel auto switch if open

In `basic viewer` mode, when the side panel is open and the segmentation panel is active, adding a measurement will automatically switch to the measurement panel. This switch won't happen if the side panel is closed. To enable or disable this feature, adjust your mode configuration accordingly.

To prevent this behavior, remove the following code from your mode:

```js
panelService.addActivatePanelTriggers('your.panel.id', [
{
  sourcePubSubService: segmentationService,
  sourceEvents: [segmentationService.EVENTS.SEGMENTATION_ADDED],
},
])

panelService.addActivatePanelTriggers('your.panel.id', [
  {
    sourcePubSubService: measurementService,
    sourceEvents: [
      measurementService.EVENTS.MEASUREMENT_ADDED,
      measurementService.EVENTS.RAW_MEASUREMENT_ADDED,
    ],
  },
])
```

---

## DicomUpload

The DICOM upload functionality in OHIF has been refactored to use the standard customization service pattern. Now you don't need to put

`customizationService: { dicomUploadComponent: '@ohif/extension-cornerstone.customizationModule.cornerstoneDicomUploadComponent', },`

in your config, we will automatically add that if you have `dicomUploadEnabled`

---

## Viewport and Modality Support for Toolbar Buttons

Previously, toolbar buttons had limited support for disabling themselves based on the active viewport type (e.g., `volume3d`, `video`, `sr`) or the modality of the displayed data (e.g., `US`, `SM`). This led to inconsistencies and sometimes enabled tools in contexts where they weren't applicable.

The new implementation introduces more robust and flexible evaluators to control the enabled/disabled state of toolbar buttons based on viewport types and modalities.

**Key Changes**

1. **New Evaluators:** New evaluators have been added to the `getToolbarModule`:
    - `evaluate.viewport.supported`: Disables a button if the active viewport's type is listed in the `unsupportedViewportTypes` property.
    - `evaluate.modality.supported`: Disables a button based on the modalities of the displayed data. It checks for both `unsupportedModalities` (exclusion) and `supportedModalities` (inclusion).
2. **Removal of Legacy Evaluators:**
    - Evaluators such as `evaluate.not.sm`, `evaluate.action.not.video`, `evaluate.not3D`, and `evaluate.isUS` have been removed. Migrate your toolbar button definitions to use the new evaluators mentioned above.


**Replace Legacy Evaluators:**
 - Replace `evaluate.not.sm` with:

     ```json
     {
       name: 'evaluate.viewport.supported',
       unsupportedViewportTypes: ['sm'],
     }
     ```

 - Replace `evaluate.action.not.video` with:

     ```json
     {
       name: 'evaluate.viewport.supported',
       unsupportedViewportTypes: ['video'],
     }
     ```

 - Replace `evaluate.not3D` with:

     ```json
     {
       name: 'evaluate.viewport.supported',
       unsupportedViewportTypes: ['volume3d'],
     }
     ```

 - Replace `evaluate.isUS` with:

     ```json
     {
       name: 'evaluate.modality.supported',
       supportedModalities: ['US'],
     }
     ```

<details>
<summary>Example Migration</summary>

Before:

```json
evaluate: ['evaluate.cine', 'evaluate.not3D'],
```

After

```json
evaluate: [
  'evaluate.cine',
  {
    name: 'evaluate.viewport.supported',
    unsupportedViewportTypes: ['volume3d'],
  },
],
```
</details>
