# Bug Fix Summary: Segmentation Display Issue When Switching Viewports

## Issue: OHI-2216
**Title:** [Bug] Segmentation not displayed and unable to draw segments when switching back to volume/stack viewport from 3D viewport

## Problem Description
When switching from a 3D viewport back to a volume/stack viewport, previously drawn segmentations disappeared and users were unable to draw new segments with the brush tool. This occurred because:

1. Segmentations are stored as **Surface** representation type when displayed in 3D viewports
2. When switching back to volume/stack viewports, the system attempted to restore the segmentation using the stored Surface representation type
3. Surface representations are only compatible with 3D viewports, not with volume/stack viewports which require **Labelmap** representation

## Root Cause
The `_setSegmentationPresentation` method in `CornerstoneViewportService.ts` was directly using the stored representation type from the presentation state without checking viewport compatibility. When restoring a segmentation presentation that was saved from a 3D viewport (with Surface type), it would try to apply the incompatible Surface representation to a volume/stack viewport.

## Solution
Modified the `_setSegmentationPresentation` method to intelligently convert representation types based on the target viewport type:

**File Modified:** `extensions/cornerstone/src/services/ViewportService/CornerstoneViewportService.ts`

**Change:** Added viewport type checking logic that:
- Detects when the stored representation type is Surface
- Checks if the target viewport is NOT a `VolumeViewport3D` instance
- Automatically converts Surface representation to Labelmap representation for volume/stack viewports

## Code Changes

```typescript
private _setSegmentationPresentation(
  viewport: Types.IStackViewport | Types.IVolumeViewport,
  segmentationPresentation: SegmentationPresentation
): void {
  if (!segmentationPresentation) {
    return;
  }

  const { segmentationService } = this.servicesManager.services;

  segmentationPresentation.forEach((presentationItem: SegmentationPresentationItem) => {
    const { segmentationId, type, hydrated } = presentationItem;

    if (hydrated) {
      // Check if we need to convert the representation type based on viewport type
      // Surface representations are only supported on VOLUME_3D viewports
      // For Stack and Orthographic viewports, we need to use Labelmap instead
      let representationType = type;
      if (
        type === csToolsEnums.SegmentationRepresentations.Surface &&
        !(viewport instanceof VolumeViewport3D)
      ) {
        // Convert Surface to Labelmap for non-3D viewports
        representationType = csToolsEnums.SegmentationRepresentations.Labelmap;
      }

      segmentationService.addSegmentationRepresentation(viewport.id, {
        segmentationId,
        type: representationType,
      });
    }
  });
}
```

## Technical Details

### Representation Types
- **Labelmap**: Used for volume/stack viewports - stores segmentation as a voxel-based mask
- **Surface**: Used for 3D viewports - stores segmentation as a 3D mesh/surface
- **Contour**: Used for RT structure display - stores segmentation as contours

### Viewport Types
- **StackViewport**: 2D image stack viewer
- **VolumeViewport** (Orthographic): 3D volume with orthographic views (MPR layouts)
- **VolumeViewport3D**: 3D surface rendering viewport

### The Fix
The `SegmentationService.addSegmentationRepresentation` method already has built-in conversion logic to handle representation type conversions when needed. By changing the type from Surface to Labelmap before calling this method for non-3D viewports, we ensure the proper representation is used and the underlying conversion mechanisms are triggered if necessary.

## Expected Behavior After Fix
1. ✅ Draw segmentation in volume/stack viewport using brush tool
2. ✅ Switch to 3D viewport - segmentation is converted to Surface representation and displayed correctly
3. ✅ Switch back to volume/stack viewport - segmentation is automatically converted from Surface to Labelmap and displayed correctly
4. ✅ Continue drawing/editing segmentation in volume/stack viewport with brush tool

## Testing Steps
To verify the fix:
1. Launch the OHIF viewer with the test data: https://viewer.ohif.org/segmentation?StudyInstanceUIDs=1.2.826.0.1.3680043.2.1125.1.11608962641993666019702920539307840
2. Switch to MPR layout (volume viewport)
3. Draw a segmentation using the brush tool
4. Switch to "3D only" layout (3D viewport)
5. Verify the segmentation is visible in 3D
6. Switch back to MPR layout (volume viewport)
7. Verify the segmentation is now visible (this was broken before the fix)
8. Try drawing more segments with the brush tool - should work correctly

## Impact
- **Low Risk**: The change is minimal and only affects the presentation restoration logic
- **Backward Compatible**: Existing functionality for same-type viewport switches remains unchanged
- **No Performance Impact**: The type check is a simple instanceof check performed only during viewport switches

## Related Code Areas
The `SegmentationService.addSegmentationRepresentation` method in `SegmentationService.ts` already handles various conversion scenarios between representation types, including:
- Stack to Volume conversion
- Volume to Stack conversion
- The fix leverages this existing conversion infrastructure

## Notes
- The fix assumes that segmentations always have Labelmap representation data available, which is true since all segmentations start as Labelmap and can be converted to other types
- The Surface-to-Labelmap conversion is handled internally by the SegmentationService
- No changes were needed to the SegmentationService itself as it already has the conversion logic in place
