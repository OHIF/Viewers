---
id: seg-creation
title: Segmentation Creation
summary: Migration guide for segmentation creation methods in OHIF 3.9, covering renamed methods like createLabelmapForViewport and createLabelmapForDisplaySet, updated parameter structures, and transition from tool group to viewport-centric approach.
---

## createEmptySegmentationForViewport

is now `createLabelmapForViewport` to align with other segmentation creation methods.

Run it using `commandsManager.runCommand('createLabelmapForViewport', {viewportId})`.

## createSegmentationForDisplaySet

is now -> `createLabelmapForDisplaySet`

Since we are moving towards segmentations be contours as well, this is renamed to clearly state the purpose.
Since OHIF 3.9 introduced Stack Segmentation support, we no longer generate a volume-based labelmap or convert the viewport to a volume viewport by default. Our default creation is now stack-based.

API Changes
-  `createSegmentationForDisplaySet` has been renamed to `createLabelmapForDisplaySet`.
-  Pass a `displaySet` object instead of a `displaySetInstanceUID`. This change enhances type safety and flexibility, accommodating future updates to the `displaySetService`.

**Before (OHIF 3.8)**

```js
async createSegmentationForDisplaySet(
  displaySetInstanceUID: string,
  options?: {
    segmentationId: string;
    FrameOfReferenceUID: string;
    label: string;
  }
): Promise<string>
```

**After (OHIF 3.9)**

```js
// Method 1: Display Set Based
async createLabelmapForDisplaySet(
  displaySet: DisplaySet,
  options?: {
    segmentationId?: string;
    label: string;
    segments?: {
      [segmentIndex: number]: Partial<Segment>
    };
  }
): Promise<string>
```


<details>
<summary>Migration Examples</summary>


```js
// Before - OHIF 3.8
const segmentationId = await segmentationService.createSegmentationForDisplaySet(
  displaySetInstanceUID,
  {
    label: 'My Segmentation'
  }
);
```

```js
// After - OHIF 3.9
// Option 1: If you have a display set UID
const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);

const segmentationId = await segmentationService.createLabelmapForDisplaySet(
  displaySet,
  {
    label: 'My Segmentation'
  }
);
```

</details>

---

## createSegmentationForRTDisplaySet


**Before (OHIF 3.8)**

```js
async createSegmentationForRTDisplaySet(
  rtDisplaySet,
  segmentationId?: string,
  suppressEvents = false
): Promise<string>
```

**After (OHIF 3.9)**

```js
async createSegmentationForRTDisplaySet(
  rtDisplaySet,
  options: {
    segmentationId?: string;
    type: SegmentationRepresentations;  // not required, defaults to Contour
  }
): Promise<string>
```


<details>
<summary>Migration Examples</summary>

if you were not passing segmentationId, you don't need to change anything


```js
// Before - OHIF 3.8
const segmentationId = await segmentationService.createSegmentationForRTDisplaySet(
  rtDisplaySet
);

// After - OHIF 3.9
const segmentationId = await segmentationService.createSegmentationForRTDisplaySet(
  rtDisplaySet,
);
```

if you were passing segmentationId, you need to update the API to pass an options object and set the segmentationId in there.

```js
// Before - OHIF 3.8
const segmentationId = await segmentationService.createSegmentationForRTDisplaySet(
  rtDisplaySet,
  'custom-id',
);
// After - OHIF 3.9
const segmentationId = await segmentationService.createSegmentationForRTDisplaySet(
  rtDisplaySet,
  {
    segmentationId: 'custom-id',
    type: csToolsEnums.SegmentationRepresentations.Contour
  }
);
```

</details>

---


## createSegmentationForSEGDisplaySet Changes

**Before (OHIF 3.8)**

```js
async createSegmentationForSEGDisplaySet(
  segDisplaySet,
  segmentationId?: string,
  suppressEvents = false
): Promise<string>
```

**After (OHIF 3.9)**

```js
async createSegmentationForSEGDisplaySet(
  segDisplaySet,
  options: {
    segmentationId?: string;
    type: SegmentationRepresentations; // not required, defaults to Labelmap
  }
): Promise<string>
```

<details>
<summary>Migration Examples</summary>

1. **Basic Usage Update**

    ```
    // Before - OHIF 3.8
    const segmentationId = await segmentationService.createSegmentationForSEGDisplaySet(
      segDisplaySet
    );
    // After - OHIF 3.9
    const segmentationId = await segmentationService.createSegmentationForSEGDisplaySet(
      segDisplaySet,
      {
        type: csToolsEnums.SegmentationRepresentations.Labelmap
      }
    );
    ```

2. **Custom Configuration**

    ```
    // Before - OHIF 3.8
    const segmentationId = await segmentationService.createSegmentationForSEGDisplaySet(
      segDisplaySet,
      'custom-id',
      false
    );
    // After - OHIF 3.9
    const segmentationId = await segmentationService.createSegmentationForSEGDisplaySet(
      segDisplaySet,
      {
        segmentationId: 'custom-id',
        type: csToolsEnums.SegmentationRepresentations.Labelmap
      }
    );
    ```
</details>


---
