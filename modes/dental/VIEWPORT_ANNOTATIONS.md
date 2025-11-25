# Viewport-Specific Annotations in Dental Mode

## Problem

By default, Cornerstone3D stores annotations globally based on `FrameOfReferenceUID` and `imageId`, not by viewport. This means:

- If multiple viewports display images from the same series/study, they share the same Frame of Reference
- Annotations created in one viewport will appear in **all** viewports showing the same image
- This is problematic for dental 2x2 hanging protocols where independent measurements per viewport are required

## Solution

We've implemented a **viewport-specific annotation filtering system** that:

1. **Tags annotations** with the viewport ID they were created in
2. **Filters annotations during rendering** to only show those belonging to each specific viewport

## Implementation

### Files Created

1. **`utils/dentalAnnotationFilter.ts`**
   - `tagAnnotationWithViewport()` - Adds viewport metadata to annotations
   - `filterAnnotationsForDentalViewport()` - Filters annotations by viewport ID
   - `getAnnotationsForViewport()` - Retrieves all annotations for a viewport
   - `removeAllAnnotationsForViewport()` - Removes all annotations from a viewport

2. **`tools/DentalViewportAnnotationTool.ts`**
   - `initializeDentalAnnotationFiltering()` - Sets up the filtering system
   - `resetDentalAnnotationFiltering()` - Cleanup function for mode exit

### How It Works

#### 1. Initialization (onModeEnter)

```typescript
// modes/dental/src/index.ts
function onModeEnter({ servicesManager, extensionManager, commandsManager }) {
  // Initialize dental-specific annotation filtering
  initializeDentalAnnotationFiltering(servicesManager);
  // ... rest of mode enter
}
```

#### 2. Annotation Tagging

When a measurement is completed:
1. Event listener captures `ANNOTATION_COMPLETED` event
2. Extracts the viewport ID from the event's element
3. Tags the annotation with `metadata.dentalViewportId`

```typescript
csEventTarget.addEventListener(csToolsEnums.Events.ANNOTATION_COMPLETED, (evt) => {
  const { annotation: newAnnotation, element } = evt.detail;
  const enabledElement = getEnabledElement(element);
  const viewportId = enabledElement?.viewport?.id;

  if (viewportId) {
    tagAnnotationWithViewport(newAnnotation.annotationUID, viewportId);
  }
});
```

#### 3. Annotation Filtering

The system overrides `annotation.state.getAnnotations()` to filter by viewport:

```typescript
annotation.state.getAnnotations = function(toolName, element) {
  const annotations = originalGetAnnotations.call(this, toolName, element);
  const enabledElement = getEnabledElement(element);
  const viewportId = enabledElement?.viewport?.id;

  // Filter to only show annotations belonging to this viewport
  return filterAnnotationsForDentalViewport(element, annotations, viewportId);
};
```

#### 4. Clear Viewport

The clear viewport command removes both display sets and annotations:

```typescript
commandsManager.registerCommand('DENTAL_MODE', 'clearActiveViewport', {
  commandFn: () => {
    const activeViewportId = viewportGridService.getActiveViewportId();

    // Remove all annotations for this viewport
    removeAllAnnotationsForViewport(activeViewportId);

    // Clear the display sets
    viewportGridService.setDisplaySetsForViewport({
      viewportId: activeViewportId,
      displaySetInstanceUIDs: [],
    });
  },
});
```

## Usage

### Creating Measurements

1. Click a measurement tool (PALength, CanalAngle, etc.)
2. Draw the measurement in any viewport
3. The annotation is automatically tagged with that viewport's ID
4. The annotation **only appears in that viewport**

### Clearing a Viewport

1. Click the "Clear Viewport" button in the toolbar
2. All annotations and images in the active viewport are removed
3. Other viewports remain unaffected

## Technical Details

### Annotation Metadata

Each annotation now contains:

```typescript
{
  annotationUID: "...",
  metadata: {
    toolName: "Length",
    FrameOfReferenceUID: "...",
    referencedImageId: "...",
    dentalViewportId: "dental-current"  // <-- NEW
  },
  data: { ... }
}
```

### Backward Compatibility

Annotations without `dentalViewportId` metadata are shown in **all** viewports (legacy behavior). This ensures:
- Existing annotations from before this feature continue to work
- Annotations from other modes aren't affected

### Tool Groups

This filtering system works **in conjunction with** the 4 separate tool groups:
- `dental-current` (top-left viewport)
- `dental-prior` (top-right viewport)
- `dental-bitewing-left` (bottom-left viewport)
- `dental-bitewing-right` (bottom-right viewport)

Tool groups control **tool behavior**, while viewport filtering controls **annotation visibility**.

## Cleanup

When exiting dental mode:

```typescript
function onModeExit() {
  // Reset the annotation filtering override
  resetDentalAnnotationFiltering();
  // ... rest of cleanup
}
```

This restores the default Cornerstone3D annotation behavior.

## Troubleshooting

### Annotations still appear in multiple viewports

**Possible causes:**
1. Annotation was created before the filtering system was initialized
   - Solution: Reload the page/study
2. The viewport ID could not be determined
   - Check browser console for warnings
3. The annotation doesn't have viewport metadata (legacy annotation)
   - These are shown everywhere by design

### Annotations disappear after viewport clearing

This is expected behavior. Use the "Clear Viewport" button only when you want to remove all content from that viewport.

## Future Enhancements

Potential improvements:
- Add UI indicator showing which viewport an annotation belongs to
- Support annotation copying between viewports
- Add viewport-specific annotation styling
- Persist viewport annotations across sessions
