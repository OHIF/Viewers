# Bug Fix Summary: OHI-2216

## Issue
Segmentation not displayed and unable to draw segments when switching back to volume/stack viewport from 3D viewport.

## Root Cause
When switching between viewports with different representation types (LABELMAP for volume/stack viewports, SURFACE for 3D viewports), the old representation was not being removed before adding the new one. This caused:
1. Previously drawn segmentations to disappear when switching back to volume/stack viewport
2. Inability to draw new segments with the brush tool

## Solution
Modified the `SegmentationService.ts` to automatically remove incompatible segmentation representations when switching viewport types:

### Changes Made

1. **Updated `handleVolumeViewportCase` method**:
   - When switching TO a 3D viewport (VOLUME_3D): Remove existing LABELMAP representations before adding SURFACE
   - When switching FROM a 3D viewport to volume viewport (ORTHOGRAPHIC): Remove existing SURFACE representations before adding LABELMAP

2. **Updated `handleStackViewportCase` method**:
   - Remove any existing SURFACE representations before adding LABELMAP when switching to stack viewport

3. **Updated `handleViewportConversion` method**:
   - Pass `viewportId` and `segmentationId` parameters to `handleVolumeViewportCase` to enable representation cleanup

### Technical Details

The fix ensures that:
- When a viewport requires a specific representation type, any conflicting representation types are automatically removed
- This prevents representation type conflicts that would cause segmentations to not display
- The drawing tools work correctly because the appropriate representation type (LABELMAP) is active

### Files Modified
- `/workspace/extensions/cornerstone/src/services/SegmentationService/SegmentationService.ts`

### Testing
- All existing unit tests pass (77 tests)
- TypeScript compilation successful
- No breaking changes to existing functionality

## Expected Behavior After Fix
1. Segmentations drawn in volume/stack viewport remain visible when switching to 3D viewport and back
2. Users can draw new segments using the brush tool after switching between viewport types
3. Seamless conversion between LABELMAP and SURFACE representations based on viewport type
