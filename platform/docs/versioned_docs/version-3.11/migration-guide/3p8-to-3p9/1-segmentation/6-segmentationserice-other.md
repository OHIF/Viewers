---
id: seg-other
title: Other Changes
summary: Migration guide for additional segmentation service changes in OHIF 3.9, covering updates to addOrUpdateSegmentation with new data structures, loadSegmentationsForViewport, highlightSegment, and jumpToSegmentCenter methods with viewport-centric approach.
---




## addOrUpdateSegmentation

This was a public method but there is a good chance you were not using it


**Before (OHIF 3.8)**

```js
// Before
addOrUpdateSegmentation(
  segmentation: Segmentation,
  suppressEvents = false,
  notYetUpdatedAtSource = false
): string
```

**After**

```js
addOrUpdateSegmentation(
  segmentationInput: SegmentationPublicInput | Partial<Segmentation>
)
```

### Data Structure Changes

The segmentation object that was used previously was a custom segmentation object that was used internally by the SegmentationService. But
we have moved to the cornerstone public segmentation input type.

**Before:**

```js
const segmentation = {
  id: 'segmentation1',
  type: SegmentationRepresentations.Labelmap,
  isActive: true,
  activeSegmentIndex: 1,
  segments: [
    {
      segmentIndex: 1,
      color: [255, 0, 0],
      isVisible: true,
      isLocked: false,
      opacity: 255
    }
  ],
  label: 'Segmentation 1',
  cachedStats: {},
  representationData: {
    LABELMAP: {
      volumeId: 'volume1',
      referencedVolumeId: 'reference1'
    }
  }
};
```


**After:**

This matches the cornerstone public segmentation input type.

```js
const segmentationInput = {
  segmentationId: 'segmentation1',
  representation: {
    type: SegmentationRepresentations.Labelmap,
    data: {
      imageIds: segmentationImageIds,
      referencedVolumeId: 'reference1'
    }
  },
  config: {
    label: 'Segmentation 1',
    segments: {
      1: {
        label: 'Segment 1',
        active: true,
        locked: false
      }
    }
  }
};
```

<details>
<summary>Migration Examples</summary>


```js
// Before
const newSegmentation = {
  id: 'seg1',
  type: SegmentationRepresentations.Labelmap,
  segments: [...],
  representationData: {
    LABELMAP: {
      volumeId: 'volume1',
      referencedVolumeId: 'reference1'
    }
  }
};
segmentationService.addOrUpdateSegmentation(newSegmentation);

// After
segmentationService.addOrUpdateSegmentation({
  segmentationId: 'seg1',
  representation: {
    type: SegmentationRepresentations.Labelmap,
    data: {
      imageIds: segmentationImageIds,
      referencedVolumeId: 'reference1'
    }
  },
  config: {
    segments: {
      1: {
        label: 'Segment 1',
        active: true
      }
    }
  }
});
```


**Updating Existing Segmentation**

```js
// Before
const updatedSegmentation = {
  ...existingSegmentation,
  segments: [...modifiedSegments],
  activeSegmentIndex: 2
};
segmentationService.addOrUpdateSegmentation(updatedSegmentation);

// After
segmentationService.addOrUpdateSegmentation({
  segmentationId: 'seg1',
  config: {
    segments: {
      2: { active: true },
    }
  }
});
```

</details>


## loadSegmentationsForViewport

same as addOrUpdateSegmentation, you should pass in the new segmentation data structure.

For instance

**Before**

```js
const segmentations = [
  {
    id: '1',
    label: 'Segmentations',
    segments: labels.map((label, index) => ({
      segmentIndex: index + 1,
      label
    })),
    isActive: true,
    activeSegmentIndex: 1,
  },
];

commandsManager.runCommand('loadSegmentationsForViewport', {
  segmentations,
});
```



**After**

```js

const labels = ['Segment 1', 'Segment 2', 'Segment 3'];

const segmentations = [
  {
    segmentationId: '1',
    representation: {
      type: Enums.SegmentationRepresentations.Labelmap,
    },
    config: {
      label: 'Segmentations',
      segments: labels.reduce((acc, label, index) => {
        acc[index + 1] = {
          label,
          active: index === 0, // First segment is active
          locked: false,
        };
        return acc;
      }, {}),
    },
  },
];

commandsManager.runCommand('loadSegmentationsForViewport', {
  segmentations,
});
```


---




## highlightSegment

**Before (OHIF 3.8)**

```js
// Before (v1.x)
highlightSegment(
  segmentationId: string,
  segmentIndex: number,
  toolGroupId?: string,
  alpha = 0.9,
  animationLength = 750,
  hideOthers = true,
  highlightFunctionType = 'ease-in-out'
)

```

**After (OHIF 3.9)**

```js
highlightSegment(
  segmentationId: string,
  segmentIndex: number,
  viewportId?: string, // notice viewportId instead of toolGroupId
  alpha = 0.9,
  animationLength = 750,
  hideOthers = true,
  highlightFunctionType = 'ease-in-out'
)
```

<details>
<summary>Key Changes</summary>

1. Removed `toolGroupId` in favor of `viewportId`
2. If no viewportId is provided, highlights in all relevant viewports

</details>

<details>
<summary>Migration Examples</summary>

**Basic Usage**

```js
// Before
segmentationService.highlightSegment(
  'seg1',
  1,
  'toolGroup1',
  0.9,
  750,
  true,
);
// After
segmentationService.highlightSegment(
  'seg1',
  1,
  'viewport1',
  0.9,
  750,
  true
);
```

**Highlighting in Multiple Views**

```js
// Before
const toolGroupIds = ['toolGroup1', 'toolGroup2'];
toolGroupIds.forEach(toolGroupId => {
  segmentationService.highlightSegment(
    'seg1',
    1,
    toolGroupId
  );
});
// After - Method 1: Let service handle multiple viewports
segmentationService.highlightSegment('seg1', 1);
// After - Method 2: Explicitly specify viewports
const viewportIds = ['viewport1', 'viewport2'];
viewportIds.forEach(viewportId => {
  segmentationService.highlightSegment(
    'seg1',
    1,
    viewportId
  );
});
```
</details>

---

## jumpToSegmentCenter

**Before (OHIF 3.8)**

```js
jumpToSegmentCenter(
  segmentationId: string,
  segmentIndex: number,
  toolGroupId?: string,
  highlightAlpha = 0.9,
  highlightSegment = true,
  animationLength = 750,
  highlightHideOthers = false,
  highlightFunctionType = 'ease-in-out'
)
```

**After (OHIF 3.9)**

```js
jumpToSegmentCenter(
  segmentationId: string,
  segmentIndex: number,
  viewportId? string, // notice viewportId instead of toolGroupId
  highlightAlpha = 0.9,
  highlightSegment = true,
  animationLength = 750,
  highlightHideOthers = false,
  animationFunctionType = 'ease-in-out'
)
```

<details>
<summary>Key Changes</summary>

1. Removed `toolGroupId` parameter infavor of viewportId
2. Automatically handles relevant viewports if `viewportId` not provided


```
// Before
segmentationService.jumpToSegmentCenter(
  'seg1',
  1,
  'toolGroup1'
);
// After
segmentationService.jumpToSegmentCenter(
  'seg1',
  1,
  'viewportId1'
);
```

</details>
