---
id: seg-api
title: SegmentationService API
summary: Detailed guide to the SegmentationService API changes in OHIF 3.9, covering the transition from toolGroup to viewport-centric segmentation management, updates to key methods like getActiveSegmentation, setActiveSegmentation, and addSegment.
---



Below we will review the changes to the API of the `SegmentationService`

# SegmentationService API

## Events

SEGMENTATION_UPDATED -> SEGMENTATION_MODIFIED


Just a rename to match the cornerstone terminology

## VolumeId vs SegmentationId

Previously, we used the SegmentationId as the VolumeId for volume-based segmentations, which led to confusion and issues.

Now, we have two separate IDs: one for the segmentation and one for the volume.

`segmentationService.getLabelmapVolume(segmentationId)` will return the volume associated with the segmentation.

If your code uses `cache.getVolume(segmentationId)`, update it to use the new `getLabelmapVolume` method.


## getSegmentation(segmentationId)

remains the same it will return the segmentation object = cornerstone segmentation object with the following properties:

```js
/**
 * Global Segmentation Data which is used for the segmentation
 */
type Segmentation = {
  /** segmentation id  */
  segmentationId: string;
  /** segmentation label */
  label: string;
  segments: {
    [segmentIndex: number]: Segment;
  };
  /**
   * Representations of the segmentation. Each segmentation "can" be viewed
   * in various representations. For instance, if a DICOM SEG is loaded, the main
   * representation is the labelmap. However, for DICOM RT the main representation
   * is contours, and other representations can be derived from the contour (currently
   * only labelmap representation is supported)
   */
  representationData: RepresentationsData;
  /**
   * Segmentation level stats, Note each segment can have its own stats
   * This is used for caching stats for the segmentation level
   */
  cachedStats: { [key: string]: unknown };
};

export type Segment = {
  /** segment index */
  segmentIndex: number;
  /** segment label */
  label: string;
  /** is segment locked for editing */
  locked: boolean;
  /** cached stats for the segment, e.g., pt suv mean, max etc. */
  cachedStats: { [key: string]: unknown };
  /** is segment active for editing, at the same time only one segment can be active for editing */
  active: boolean;
};
```


<details>
<summary>Compared to Cornerstone3D 1.x</summary>

Previously this function was returning this

```js
export type Segmentation = {
  segmentationId: string;
  type: Enums.SegmentationRepresentations;
  label: string;
  activeSegmentIndex: number;
  segmentsLocked: Set<number>;
  cachedStats: { [key: string]: number };
  segmentLabels: { [key: string]: string };
  representationData: SegmentationRepresentationData;
};

```

As you can see `segmentLabels`, `segmentsLocked`, `activeSegmentIndex`, are all gathered under the new `segments` object. We now have support for per segment cachedStats as well.

</details>

---

## getSegmentations

It provides all segmentations in the state. Previously, it accepted a `filterNonhydrated` flag, but since we've moved away from hydration and every loaded segmentation is now hydrated by default, it returns all segmentations.




---

## getActiveSegmentation


After migrating to viewport-specific segmentations, different viewports can have distinct active segmentations for editing. The panel will always display the active segmentation when the active viewport changes.

Before (3.8)

```js
// Returns full segmentation object
public getActiveSegmentation(): Segmentation {
  const segmentations = this.getSegmentations();
  return segmentations.find(segmentation => segmentation.isActive);
}
```

After (3.9)

```js
public getActiveSegmentation(viewportId: string): Segmentation | null {
  return cstSegmentation.activeSegmentation.getActiveSegmentation(viewportId);
}
```

<details>
<summary>Key Changes</summary>

1. **Viewport Specificity**
    - Before: Global active segmentation across all tool groups
    - After: Active segmentation per viewport
2. **Required Parameters**
    - Before: No parameters needed
    - After: Requires viewportId parameter
</details>


<details>
<summary>Migration Examples</summary>

**Before:**

```js
// Get active segmentation
const activeSegmentation = segmentationService.getActiveSegmentation();
if (activeSegmentation) {
  console.log('Active segmentation:', activeSegmentation.segmentationId);
  console.log('Active segment:', activeSegmentation.activeSegmentIndex);
}
```

**After:**

```js
// Get active segmentation for specific viewport
const activeSegmentation = segmentationService.getActiveSegmentation('viewport1');

```

</details>

---

## getToolGroupIdsWithSegmentation

is now -> `getViewportIdsWithSegmentation` as you guessed



## setActiveSegmentationForToolGroup

-> setActiveSegmentation



**Before (OHIF 3.8)**

```js
setActiveSegmentationForToolGroup(
  segmentationId: string,
  toolGroupId?: string,
  suppressEvents?: boolean
): void
```

**After (OHIF 3.9)**

```js
setActiveSegmentation(
  viewportId: string,
  segmentationId: string
): void
```

<details>
<summary>Migration Examples</summary>

1. **Basic Usage Update**

    ```js
    // Before - OHIF 3.8
    segmentationService.setActiveSegmentationForToolGroup(
      segmentationId,
      toolGroupId
    );
    // After - OHIF 3.9
    segmentationService.setActiveSegmentation(
      viewportId,
      segmentationId
    );
    ```

</details>



---


## addSegment

The `addSegment` method in OHIF 3.9 has been updated to handle segmentation properties in a viewport-centric way, removing tool group dependencies and simplifying the configuration structure.


**Before (OHIF 3.8)**

```js
addSegment(
  segmentationId: string,
  config: {
    segmentIndex?: number;
    toolGroupId?: string;
    properties?: {
      label?: string;
      color?: ohifTypes.RGB;
      opacity?: number;
      visibility?: boolean;
      isLocked?: boolean;
      active?: boolean;
    };
  }
): void
```

**After (OHIF 3.9)**

```js
addSegment(
  segmentationId: string,
  config: {
    segmentIndex?: number;
    label?: string;
    isLocked?: boolean;
    active?: boolean;
    color?: csTypes.Color;
    visibility?: boolean;
  }
): void
```

<details>
<summary>Key Changes</summary>

1. **Configuration Structure**
    - Removed double nested `properties` object
    - Configuration options now at top level
    - Removed `toolGroupId` parameter
    - Removed `opacity` parameter (now part of color)
2. **Segment Index Generation**
    - Changed from length-based to max-value-based indexing
    - More reliable for non-sequential segment indices
3. **Color Handling**
    - Color now includes alpha channel (opacity)
    - Applied to all relevant viewports automatically
</details>




<details>
<summary>Migration Examples</summary>

1. **Basic Segment Creation**

    ```js
    // Before - OHIF 3.8
    segmentationService.addSegment(segmentationId, {
      properties: {
        label: 'Segment 1'
      }
    });
    // After - OHIF 3.9
    segmentationService.addSegment(segmentationId, {
      label: 'Segment 1'
    });
    ```

2. **Creating Segment with Color**

    ```js
    // Before - OHIF 3.8
    segmentationService.addSegment(segmentationId, {
      properties: {
        color: [255, 0, 0],
        opacity: 255
      }
    });
    // After - OHIF 3.9
    segmentationService.addSegment(segmentationId, {
      color: [255, 0, 0, 255]  // RGB + Alpha
    });
    ```

3. **Setting Visibility and Lock Status**

    ```js
    // Before - OHIF 3.8
    segmentationService.addSegment(segmentationId, {
      toolGroupId: 'myToolGroup',
      properties: {
        visibility: true,
        isLocked: true
      }
    });
    // After - OHIF 3.9
    segmentationService.addSegment(segmentationId, {
      visibility: true,
      isLocked: true
    });
    ```

4. **Complete Configuration Example**

    ```js
    // Before - OHIF 3.8
    segmentationService.addSegment(segmentationId, {
      segmentIndex: 1,
      toolGroupId: 'myToolGroup',
      properties: {
        label: 'Tumor',
        color: [255, 0, 0],
        opacity: 200,
        visibility: true,
        isLocked: false,
        active: true
      }
    });
    // After - OHIF 3.9
    segmentationService.addSegment(segmentationId, {
      segmentIndex: 1,
      label: 'Tumor',
      color: [255, 0, 0, 200],  // RGB + Alpha
      visibility: true,
      isLocked: false,
      active: true
    });
    ```

</details>




<details>
<summary>Important Changes</summary>

1. **Tool Group Removal**
    ```js
    // Before - OHIF 3.8
    segmentationService.addSegment(segmentationId, {
      toolGroupId: 'myToolGroup'
      // ... other properties
    });
    // After - OHIF 3.9
    // No tool group needed - automatically applies to all relevant viewports
    segmentationService.addSegment(segmentationId, {
      // ... properties
    });
    ```

2. **Segment Index Generation**
    ```js
    // Before - OHIF 3.8
    // Used array length
    segmentIndex = segmentation.segments.length === 0 ? 1 : segmentation.segments.length;
    // After - OHIF 3.9
    // Uses highest existing index + 1
    segmentIndex = Math.max(...Object.keys(csSegmentation.segments).map(Number)) + 1;
    ```

3. **Color and Opacity**
    ```js
    // Before - OHIF 3.8
    segmentationService.addSegment(segmentationId, {
      properties: {
        color: [255, 0, 0],
        opacity: 200
      }
    });

    // After - OHIF 3.9
    segmentationService.addSegment(segmentationId, {
      color: [255, 0, 0, 200]  // Combined color and opacity
    });
    ```

</details>


---

---

## getActiveSegment

now requires viewportId, since we have moved away from global active segmentation to viewport specific one

**API Changes**

```js
// Before
getActiveSegment(): Segment

// After
getActiveSegment(viewportId: string): Segment | null
```
