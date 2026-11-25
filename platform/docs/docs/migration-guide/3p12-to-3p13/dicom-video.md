---
sidebar_position: 8
sidebar_label: DICOM video viewport
title: DICOM video viewport migration
---

# DICOM video viewport migration

The `@ohif/extension-dicom-video` extension no longer provides its own viewport module in 3.13. DICOM video rendering is handled by the Cornerstone viewport, which supports Cornerstone3D video viewports directly.

The DICOM video SOP class handler remains available and should still be used to identify and build video display sets:

```ts
'@ohif/extension-dicom-video.sopClassHandlerModule.dicom-video'
```

## What changed

The following viewport namespace has been removed:

```ts
'@ohif/extension-dicom-video.viewportModule.dicom-video'
```

Use the Cornerstone viewport namespace instead:

```ts
'@ohif/extension-cornerstone.viewportModule.cornerstone'
```

## Migration

If your mode has a dedicated DICOM video viewport entry, replace it with the Cornerstone viewport or add the video SOP class handler to an existing Cornerstone viewport entry.

**Before (3.12):**

```ts
const dicomvideo = {
  sopClassHandler: '@ohif/extension-dicom-video.sopClassHandlerModule.dicom-video',
  viewport: '@ohif/extension-dicom-video.viewportModule.dicom-video',
};

viewports: [
  {
    namespace: '@ohif/extension-cornerstone.viewportModule.cornerstone',
    displaySetsToDisplay: [ohif.sopClassHandler],
  },
  {
    namespace: dicomvideo.viewport,
    displaySetsToDisplay: [dicomvideo.sopClassHandler],
  },
];
```

**After (3.13):**

```ts
const dicomvideo = {
  sopClassHandler: '@ohif/extension-dicom-video.sopClassHandlerModule.dicom-video',
};

viewports: [
  {
    namespace: '@ohif/extension-cornerstone.viewportModule.cornerstone',
    displaySetsToDisplay: [ohif.sopClassHandler, dicomvideo.sopClassHandler],
  },
];
```

If your mode uses a custom viewport that wraps `OHIFCornerstoneViewport` (for example, a tracked Cornerstone viewport), route DICOM video display sets through that wrapper instead of the removed DICOM video viewport namespace.

## Why

Keeping video rendering in the Cornerstone viewport avoids a separate custom React video viewport path and keeps video behavior aligned with Cornerstone3D viewport services, tools, annotations, and presentation state handling.
