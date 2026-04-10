---
sidebar_position: 2
sidebar_label: SegmentationService
title: SegmentationService API change
---

# SegmentationService – method rename

The `SegmentationService` method for removing segmentation representations from a viewport has been renamed to better reflect its behavior.

## Change

| 3.12 (old)                         | 3.13 (new)                        |
|------------------------------------|-----------------------------------|
| `removeSegmentationRepresentations` | `removeRepresentationsFromViewport` |

The signature is unchanged:

```ts
removeRepresentationsFromViewport(
  viewportId: string,
  specifier?: {
    segmentationId?: string;
    type?: SegmentationRepresentations;
  }
): void
```

## Migration

Replace calls to `removeSegmentationRepresentations` with `removeRepresentationsFromViewport`.

**Before (3.12):**

```ts
segmentationService.removeSegmentationRepresentations(viewportId);
// or with a specifier:
segmentationService.removeSegmentationRepresentations(viewportId, { segmentationId });
```

**After (3.13):**

```ts
segmentationService.removeRepresentationsFromViewport(viewportId);
// or with a specifier:
segmentationService.removeRepresentationsFromViewport(viewportId, { segmentationId });
```

## Reason

The new name makes it clear that the method removes representations from a specific viewport, rather than removing segmentations globally.
