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
survive that call.

## Display sets do not survive a mode exit

This is unchanged from 3.13 in effect, but the mechanism is now shared with
cornerstone, so it is worth stating explicitly: **display sets last for the
duration of a mode.** Two separate things clear them on the way out, and both
are intended:

| Step | What it clears |
| --- | --- |
| `mode.onModeExit` | nothing — runs first, so a mode can snapshot what it wants to keep |
| `@ohif/extension-cornerstone` `onModeExit` | `utilities.clearCacheData()` — the whole typed metadata registry, including the `DISPLAY_SET` module |
| `DisplaySetService.onModeExit()` | this service's own display sets, per UID |

The cornerstone extension releases the typed registry because naturalized
instances hold full Part 10 buffers that live outside the size-capped image
cache; dropping display sets along with them is deliberate, not collateral.
Because `mode.onModeExit` runs before either clear, the existing
snapshot-and-restore pattern still works:

```js
// In your mode
onModeExit({ servicesManager }) {
  const { displaySetService } = servicesManager.services;
  this.saved = displaySetService.getActiveDisplaySets().filter(isWorthKeeping);
},

onModeEnter({ servicesManager }) {
  const { displaySetService } = servicesManager.services;
  this.saved?.forEach(ds => displaySetService.addDisplaySets(ds));
},
```

What does **not** work is stashing a `displaySetInstanceUID` across a mode
change and looking it up afterwards — `getDisplaySetByUID` will return
`undefined`. Hold the display set object itself.

If `utilities.clearCacheData()` is called mid-mode (a loader
re-initialization, say), the store notices the missing entries on the next read
and prunes its own index instead of returning stale UIDs.
