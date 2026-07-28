---
sidebar_position: 2
sidebar_label: Display set storage
title: getDisplaySetCache() returns a snapshot
---

# Display sets moved into the cornerstone metadata store

`DisplaySetService` previously kept its display sets in a module-private
`Map`, and `getDisplaySetCache()` handed that map out directly. In 3.14 they
are stored in the `@cornerstonejs/metadata` `DISPLAY_SET` typed metadata cache,
keyed by `displaySetInstanceUID`, so cornerstone-native code can resolve the
same display sets OHIF sees:

```js
import { Enums, metaData } from '@cornerstonejs/metadata';

const displaySet = metaData.getTyped(
  Enums.MetadataModules.DISPLAY_SET,
  displaySetInstanceUID
);
```

## `getDisplaySetCache()` is deprecated

It still returns a `Map<string, DisplaySet>`, but that map is now a **snapshot**
rather than the live store. Reading from it is unchanged:

```js
// Still fine.
const displaySets = Array.from(displaySetService.getDisplaySetCache().values());
```

Mutating it no longer affects the service — the writes land on a throwaway copy
and are silently lost:

```js
// Broken in 3.14: both are no-ops.
displaySetService.getDisplaySetCache().set(uid, myDisplaySet);
displaySetService.getDisplaySetCache().delete(uid);
```

Nothing in the OHIF tree mutated it, so this only affects downstream code.
Replace mutations with the service API, which keeps the active display set list
and the events in step:

| Instead of | Use |
| --- | --- |
| `cache.get(uid)` | `displaySetService.getDisplaySetByUID(uid)` |
| `cache.values()` (all) | `displaySetService.getActiveDisplaySets()` |
| filtering `cache.values()` | `displaySetService.getDisplaySetsBy(predicate)` |
| `cache.delete(uid)` | `displaySetService.deleteDisplaySet(uid)` |
| `cache.clear()` | `displaySetService.onModeExit()` |
| `cache.set(uid, ds)` | `displaySetService.makeDisplaySets(instances)` |

## Clearing is scoped to OHIF's own entries

`onModeExit()` removes only the display sets this service created, per UID,
rather than clearing the whole `DISPLAY_SET` module. Entries written directly
by cornerstone code (keyed by image id rather than by `displaySetInstanceUID`)
survive a mode exit.

If a loader re-initialization calls `utilities.clearCacheData()` out from under
the service, the store notices the missing entries on the next read and prunes
its own index instead of returning stale UIDs.
