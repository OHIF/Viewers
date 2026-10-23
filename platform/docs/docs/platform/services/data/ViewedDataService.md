---
sidebar_position: 9
sidebar_label: Viewed Data Service
title: Viewed Data Service
summary: Documentation for OHIF's ViewedDataService, which tracks dataIds a user has viewed and publishes change events for incremental UI updates.
---

# Viewed Data Service

## Overview

`ViewedDataService` tracks which dataIds have been marked as viewed in the
current session. Internally it stores ids in a `Set<string>` and publishes a
single event whenever viewed state changes.

Typical usage is to:

- mark a data item as viewed when users land on a slice
- query whether a data item has been viewed to seed UI state
- subscribe to viewed changes for incremental updates
- clear viewed state when a context reset is needed

## Events

The following events are published by `ViewedDataService`.

| Event | Description |
| --- | --- |
| `VIEWED_DATA_CHANGED` | Fired when one data item is newly marked viewed, or when all viewed data is cleared. |

### Event payload

```ts
type ViewedDataPayload = {
  viewedDataId?: string;
  viewedDataCleared?: boolean;
};
```

- When a single data item is marked viewed: `{ viewedDataId: string }`
- When all viewed data is cleared: `{ viewedDataCleared: true }`

## API

- `markDataViewed(dataId: string): void`

  Marks one data item as viewed and emits `VIEWED_DATA_CHANGED` only if:

  - `dataId` is truthy, and
  - it was not already marked viewed.

- `isDataViewed(dataId: string): boolean`


  Returns `true` if `dataId` is currently in the viewed set.

- `clearViewedData(): void`

    Clears all viewed dataIds and emits `VIEWED_DATA_CHANGED` with
`{ viewedDataCleared: true }`.

- `subscribeViewedDataChanges(listener): Subscription`

    Subscribes to `VIEWED_DATA_CHANGED` payloads.

  ```ts
  const subscription = viewedDataService.subscribeViewedDataChanges(payload => {
    if (payload.viewedDataCleared) {
      // reset local viewed state
      return;
    }

    if (payload.viewedDataId) {
      // mark one data item as viewed locally
    }
  });

  // later
  subscription.unsubscribe();
  ```

## Notes

- Service registration name: `viewedDataService`
- Alternate registration name: `ViewedDataService`
- The service is session-scoped in-memory state; it is not persisted by default.
