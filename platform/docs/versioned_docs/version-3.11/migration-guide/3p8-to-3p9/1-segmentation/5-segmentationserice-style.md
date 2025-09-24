---
id: seg-style
title: SegmentationService Style
summary: Migration guide for segmentation styling API changes in OHIF 3.9, covering the transition to viewport-specific visibility controls, new style specification system using the specifier pattern, and updated methods for setting colors and toggling visibility.
---


## Style


###  setSegmentVisibility

since visibility is viewport concern and representation is what is being toggled ->

**Before (OHIF 3.8)**

```js
setSegmentVisibility(
  segmentationId: string,
  segmentIndex: number,
  isVisible: boolean,
  toolGroupId?: string
): void
```

**After (OHIF 3.9)**

```js
setSegmentVisibility(
  viewportId: string,
  segmentationId: string,
  segmentIndex: number,
  isVisible: boolean,
  type?: SegmentationRepresentations
): void
```

<details>
<summary>Migration Example</summary>

```js
// Before
segmentationService.setSegmentVisibility(
  'segmentation1',
  1,
  true,
  'toolGroup1'
);
// After
segmentationService.setSegmentVisibility(
  'viewport1',
  'segmentation1',
  1,
  true
);
```

**Getting Viewport IDs**

When you need to update visibility across multiple viewports:

```js
// Before
const toolGroupIds = ['toolGroup1', 'toolGroup2'];
toolGroupIds.forEach(toolGroupId => {
  segmentationService.setSegmentVisibility(
    'segmentation1',
    1,
    true,
    toolGroupId
  );
});
// After
const viewportIds = segmentationService.getViewportIdsWithSegmentation('segmentation1');
viewportIds.forEach(viewportId => {
  segmentationService.setSegmentVisibility(
    viewportId,
    'segmentation1',
    1,
    true
  );
});
```


</details>


### get/set Configuration -> get/setStyle

The segmentation configuration system has been completely redesigned:

- Moved from global/toolGroup configuration to viewport-specific styles
- Split rendering of inactive segmentations into separate API
- More granular control over styles at different levels (global, segmentation, viewport, segment)


**Before (OHIF 3.8)**

```js
interface SegmentationConfig {
  brushSize: number;
  brushThresholdGate: number;
  fillAlpha: number;
  fillAlphaInactive: number;
  outlineWidthActive: number;
  renderFill: boolean;
  renderInactiveSegmentations: boolean;
  renderOutline: boolean;
  outlineOpacity: number;
  outlineOpacityInactive: number;
}
```

**After (OHIF 3.9)**

```js
// Style Types
interface StyleSpecifier {
  viewportId?: string;
  segmentationId?: string;
  type: SegmentationRepresentations;
  segmentIndex?: number;
}
interface LabelmapStyle {
  renderOutline: boolean;
  outlineWidth: number;
  renderFill: boolean;
  fillAlpha: number;
  outlineAlpha: number;
  // ....
}
// Functions
getStyle(specifier: StyleSpecifier): LabelmapStyle | ContourStyle | SurfaceStyle;
setStyle(specifier: StyleSpecifier, style: LabelmapStyle | ContourStyle | SurfaceStyle): void;
setRenderInactiveSegmentations(viewportId: string, renderInactive: boolean): void;
getRenderInactiveSegmentations(viewportId: string): boolean;
```


**Before:**

```js
// Get global configuration
const config = segmentationService.getConfiguration();
console.log(config.fillAlpha, config.renderOutline);
// Get tool group specific config
const toolGroupConfig = segmentationService.getConfiguration('toolGroup1');
```

**After:**

```js
// Get global style for labelmap
const labelmapStyle = segmentationService.getStyle({
  type: SegmentationRepresentations.Labelmap
});
// Get viewport-specific style
const viewportStyle = segmentationService.getStyle({
  viewportId: 'viewport1',
  type: SegmentationRepresentations.Labelmap
});
// Get segmentation-specific style
const segmentationStyle = segmentationService.getStyle({
  segmentationId: 'seg1',
  type: SegmentationRepresentations.Labelmap
});
// Get segment-specific style
const segmentStyle = segmentationService.getStyle({
  segmentationId: 'seg1',
  type: SegmentationRepresentations.Labelmap,
  segmentIndex: 1
});
```



**Setting Configuration/Style**

**Before:**

```js
segmentationService.setConfiguration({
  fillAlpha: 0.5,
  outlineWidthActive: 2,
  renderOutline: true,
  renderFill: true,
  renderInactiveSegmentations: true
});
```

**After:**

```js
// Set global style
segmentationService.setStyle(
  { type: SegmentationRepresentations.Labelmap },
  {
    fillAlpha: 0.5,
    outlineWidth: 2,
    renderOutline: true,
    renderFill: true
  }
);
// Set viewport-specific style
segmentationService.setStyle(
  {
    viewportId: 'viewport1',
    type: SegmentationRepresentations.Labelmap
  },
  {
    fillAlpha: 0.5,
    outlineWidth: 2
  }
);
// Handle inactive segmentations separately
segmentationService.setRenderInactiveSegmentations('viewport1', true);
```


<details>
<summary>Migration Examples</summary>

**Combining Multiple Style Settings**

**Before:**

```js
segmentationService.setConfiguration({
  fillAlpha: 0.5,
  fillAlphaInactive: 0.2,
  outlineWidthActive: 2,
  outlineOpacity: 1,
  outlineOpacityInactive: 0.5,
  renderOutline: true,
  renderFill: true,
  renderInactiveSegmentations: true
});
```

**After:**

```js
// Set base style
segmentationService.setStyle(
  { type: SegmentationRepresentations.Labelmap },
  {
    fillAlpha: 0.5,
    outlineWidth: 2,
    outlineAlpha: 1,
    renderOutline: true,
    renderFill: true
  }
);
```

</details>



**Set inactive rendering per viewport**

```js
segmentationService.setRenderInactiveSegmentations('viewport1', true);
// Set style for inactive segments if needed
segmentationService.setStyle(
  {
    viewportId: 'viewport1',
    type: SegmentationRepresentations.Labelmap,
    segmentationId: 'seg1'
  },
  {
    fillAlpha: 0.2,
    outlineAlpha: 0.5
  }
);
```

---



## setSegmentRGBAColor , setSegmentOpacity, setSegmentRGBA
Previously, the SegmentationService had multiple redundant methods for setting colors and opacity (`setSegmentRGBA`, `setSegmentColor`, `setSegmentOpacity`). This led to confusion and potential state inconsistencies between the service and Cornerstone.js Tools.

The old methods (`setSegmentRGBA`, `setSegmentRGBA`, and `setSegmentOpacity`) are now removed.


1. Replace `setSegmentRGBAColor`, `setSegmentRGBA`, and `setSegmentOpacity` calls: Replace all instances of the old methods with the new `setSegmentColor` method. Note that you now need to provide the `viewportId` as the first argument since segment color is managed per viewport and representation in cornerstone3D.


**Before**

```js
// Old API:
segmentationService.setSegmentRGBAColor(segmentationId, segmentIndex, rgbaColor, toolGroupId);
segmentationService.setSegmentRGBA(segmentationId, segmentIndex, rgbaColor, toolGroupId);
segmentationService.setSegmentOpacity(segmentationId, segmentIndex, opacity, toolGroupId);
```

**After**

```js
// New API:
segmentationService.setSegmentColor(viewportId, segmentationId, segmentIndex, color); // color is an array of [red, green, blue, alpha]
```

The new `color` argument is an array representing the RGBA color, where the alpha component determines the opacity.  Since the Cornerstone Tools library handles segment color per viewport and representation, we require the `viewportId` as an argument now.



2. **Retrieve Segment Color using** `getSegmentColor`: The new `getSegmentColor` provides a way to fetch the color of a segment within a specific viewport.

```js
const color = segmentationService.getSegmentColor(viewportId, segmentationId, segmentIndex); //returns [r, g, b, a]
```


---



## ToggleSegmentationVisibility

In Cornerstone3D v2.x, `toggleSegmentationVisibility` has been replaced with `toggleSegmentationRepresentationVisibility`. This change reflects the fact that
a representation is what is being toggled, not the segmentation.


**Before (OHIF 3.8)**

```js
// Toggle visibility for a segmentation globally
segmentationService.toggleSegmentationVisibility(segmentationId);
```

**After (OHIF 3.9)**

```js
// Toggle visibility for a segmentation representation in a specific viewport
segmentationService.toggleSegmentationRepresentationVisibility(viewportId, {
  segmentationId: segmentationId,
  type: csToolsEnums.SegmentationRepresentations.Labelmap
});
```

**Migration Steps**

1. Update all calls to `toggleSegmentationVisibility` to use `toggleSegmentationRepresentationVisibility`
2. Add the required `viewportId` parameter
3. Add a `type` parameter specifying the representation type (e.g., Labelmap, Contour)
4. If you were toggling visibility across all viewports, you'll need to loop through the viewports:


<details>
<summary>Additional Notes</summary>


- Each viewport can now have independent visibility settings for the same segmentation
- The visibility state is specific to the representation type (Labelmap, Contour, etc.)
- To check current visibility, use `getSegmentationRepresentationVisibility(viewportId, { segmentationId, type })`
</details>

---
