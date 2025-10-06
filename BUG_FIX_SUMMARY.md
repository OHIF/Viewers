# Bug Fix Summary: OHI-2065

## Issue
The `viewportGridService.EVENTS.VIEWPORTS_READY` event was not firing when:
1. A layout (e.g., 2x2) had more viewport slots than available series (e.g., only 3 series for 4 viewports)
2. The layout was changed to add new empty viewports (e.g., from 2x2 to 3x2)

## Root Cause
The `getGridViewportsReady()` function in `ViewportGridProvider.tsx` was checking if **all** viewports were ready by comparing `readyViewports.length === viewports.size`. This meant that empty viewports (without display sets) would prevent the event from firing, since they would never become "ready".

## Solution
Modified the `getGridViewportsReady()` function to only check if viewports **with content** are ready:

### Changed File
- `platform/ui-next/src/contextProviders/ViewportGridProvider.tsx`

### Code Changes
**Before (lines 405-409):**
```typescript
const getGridViewportsReady = useCallback(() => {
  const { viewports } = viewportGridState;
  const readyViewports = Array.from(viewports.values()).filter(viewport => viewport.isReady);
  return readyViewports.length === viewports.size;
}, [viewportGridState]);
```

**After (lines 405-418):**
```typescript
const getGridViewportsReady = useCallback(() => {
  const { viewports } = viewportGridState;
  // Filter viewports that have display sets (i.e., have content to display)
  const viewportsWithContent = Array.from(viewports.values()).filter(
    viewport => viewport.displaySetInstanceUIDs && viewport.displaySetInstanceUIDs.length > 0
  );
  // If there are no viewports with content, return false
  if (viewportsWithContent.length === 0) {
    return false;
  }
  // Check if all viewports with content are ready
  const readyViewports = viewportsWithContent.filter(viewport => viewport.isReady);
  return readyViewports.length === viewportsWithContent.length;
}, [viewportGridState]);
```

## Expected Behavior After Fix
1. **2x2 layout with 3 series**: The `VIEWPORTS_READY` event will fire once all 3 series are loaded, even though the 4th viewport is empty.
2. **Layout change from 2x2 to 3x2**: When new viewports are added, the event will fire based on the loaded series in those viewports, not requiring all 6 viewports to have content.
3. **Drag and drop to newly added viewports**: When series are dragged to new empty viewports, the event logic will correctly evaluate readiness.

## Testing
- TypeScript compilation verified with no errors
- Logic validated to ensure:
  - Only viewports with `displaySetInstanceUIDs.length > 0` are considered
  - Event fires when all content-bearing viewports are ready
  - Empty viewports don't block the event from firing

## Impact
This fix ensures that the `VIEWPORTS_READY` event fires when all **available series** are loaded into viewports, rather than requiring all viewport slots to be filled. This aligns with the expected behavior described in the Linear issue.
