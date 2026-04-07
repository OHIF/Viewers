---
sidebar_position: 9
sidebar_label: Viewed Images Service
title: Viewed Images Service
summary: Documentation for OHIF's ViewedImagesService, which tracks imageIds a user has viewed and publishes change events for incremental UI updates.
---

# Viewed Images Service

## Overview

`ViewedImagesService` tracks which imageIds have been marked as viewed in the
current session. Internally it stores ids in a `Set<string>` and publishes a
single event whenever viewed state changes.

Typical usage is to:

- mark an image as viewed when users land on a slice
- query whether an image has been viewed to seed UI state
- subscribe to viewed changes for incremental updates
- clear viewed state when a context reset is needed

## Events

The following events are published by `ViewedImagesService`.

| Event | Description |
| --- | --- |
| `VIEWED_IMAGES_CHANGED` | Fired when one image is newly marked viewed, or when all viewed images are cleared. |

### Event payload

```ts
type ViewedImagePayload = {
  viewedImageId?: string;
  viewedImagesCleared?: boolean;
};
```

- When a single image is marked viewed: `{ viewedImageId: string }`
- When all viewed images are cleared: `{ viewedImagesCleared: true }`

## API

- `markImageViewed(imageId: string): void`

  Marks one image as viewed and emits `VIEWED_IMAGES_CHANGED` only if:

  - `imageId` is truthy, and
  - it was not already marked viewed.

- `isImageViewed(imageId: string): boolean`


  Returns `true` if `imageId` is currently in the viewed set.

- `clearViewedImages(): void`

    Clears all viewed imageIds and emits `VIEWED_IMAGES_CHANGED` with
`{ viewedImagesCleared: true }`.

- `subscribeViewedImageChanges(listener): Subscription`

    Subscribes to `VIEWED_IMAGES_CHANGED` payloads.

  ```ts
  const subscription = viewedImagesService.subscribeViewedImageChanges(payload => {
    if (payload.viewedImagesCleared) {
      // reset local viewed state
      return;
    }

    if (payload.viewedImageId) {
      // mark one image as viewed locally
    }
  });

  // later
  subscription.unsubscribe();
  ```

## Notes

- Service registration name: `viewedImagesService`
- Alternate registration name: `ViewedImagesService`
- The service is session-scoped in-memory state; it is not persisted by default.
