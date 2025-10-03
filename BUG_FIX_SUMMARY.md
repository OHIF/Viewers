# Bug Fix: Duplicate Segmentation Entries When Switching Layouts

## Issue Description
**Linear Issue:** OHI-2076  
**Title:** [Bug] Duplicate entries for same segmentation when switching between Common and advanced layout

When switching from a Common layout to an advanced layout (e.g., 3D Four-Up) in the OHIF Viewer, duplicate entries for the same segmentation appear in the Segmentation Panel.

## Root Cause
The issue was in the `useViewportSegmentations` hook located at:
```
extensions/cornerstone/src/hooks/useViewportSegmentations.ts
```

When a viewport contains multiple representations of the same segmentation (e.g., both a LABELMAP and SURFACE representation), the hook was creating separate entries for each representation, even though they belong to the same segmentation. This resulted in duplicate entries in the Segmentation Panel.

The problem occurred because:
1. When switching layouts, new viewports are created
2. The synchronizer may add the same segmentation with different representation types to these viewports
3. The `getSegmentationRepresentations(viewportId)` call returns ALL representations for that viewport
4. Each representation was mapped to a separate entry, creating duplicates

## Solution
Added deduplication logic in the `useViewportSegmentations` hook to ensure only one entry per unique `segmentationId` is shown in the panel, regardless of how many representation types exist.

### Code Changes

**File:** `extensions/cornerstone/src/hooks/useViewportSegmentations.ts`

**Before:**
```typescript
const representations = segmentationService.getSegmentationRepresentations(viewportId);

const newSegmentationsWithRepresentations = representations.map(representation => {
  const segmentation = segmentationService.getSegmentation(representation.segmentationId);
  const mappedSegmentation = mapSegmentationToDisplay(segmentation, customizationService);
  return {
    representation,
    segmentation: mappedSegmentation,
  };
});
```

**After:**
```typescript
const representations = segmentationService.getSegmentationRepresentations(viewportId);

// Deduplicate representations by segmentationId to prevent showing
// the same segmentation multiple times in the panel when it has
// multiple representation types (e.g., labelmap and surface)
const uniqueSegmentationMap = new Map();
representations.forEach(representation => {
  if (!uniqueSegmentationMap.has(representation.segmentationId)) {
    uniqueSegmentationMap.set(representation.segmentationId, representation);
  }
});

const newSegmentationsWithRepresentations = Array.from(uniqueSegmentationMap.values()).map(
  representation => {
    const segmentation = segmentationService.getSegmentation(representation.segmentationId);
    const mappedSegmentation = mapSegmentationToDisplay(segmentation, customizationService);
    return {
      representation,
      segmentation: mappedSegmentation,
    };
  }
);
```

## How It Works
1. After retrieving all representations for a viewport, we create a `Map` keyed by `segmentationId`
2. We iterate through all representations and only add the first occurrence of each unique `segmentationId`
3. This ensures that even if a segmentation has multiple representation types (labelmap, surface, etc.), only one entry appears in the panel
4. The fix is applied at the data source level, ensuring consistency across all panel views

## Testing
To verify the fix:
1. Launch OHIF Viewer with segmentation data (e.g., https://viewer-dev.ohif.org/segmentation?StudyInstanceUIDs=1.3.6.1.4.1.14519.5.2.1.1706.8374.643249677828306008300337414785)
2. Drag and drop a segmentation into the Common layout viewport
3. Switch to an advanced layout (e.g., 3D Four-Up)
4. Verify that only one entry per segmentation appears in the Segmentation Panel (no duplicates)

## Impact
- **Scope:** Minimal - only affects the display logic in the Segmentation Panel
- **Breaking Changes:** None
- **Performance:** Negligible - adds a simple Map-based deduplication step
- **User Experience:** Significantly improved - eliminates confusion from duplicate entries

## Related Files
- `/workspace/extensions/cornerstone/src/hooks/useViewportSegmentations.ts` (modified)
- `/workspace/extensions/cornerstone/src/hooks/useActiveViewportSegmentationRepresentations.ts` (uses the fixed hook)
- `/workspace/extensions/cornerstone/src/panels/PanelSegmentation.tsx` (consumes the data)
