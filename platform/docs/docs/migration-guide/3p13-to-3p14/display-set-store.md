---
sidebar_position: 2
sidebar_label: Display set storage
title: Display sets are stored in the cornerstone metadata cache
---

# Display sets are stored in the cornerstone metadata cache

In 3.14, `DisplaySetService` **always** stores its display sets in the
`@cornerstonejs/metadata` `DISPLAY_SET` typed metadata cache, keyed by
`displaySetInstanceUID`. This is not an option: the `useMetadataDisplaySet`
customization changes how display sets are **made**, not where they are
stored. In 3.13, the service kept them in a private `Map`.

Cornerstone code can now read the same display sets that OHIF uses:

```js
import { Enums, metaData } from '@cornerstonejs/metadata';

const displaySet = metaData.getTyped(
  Enums.MetadataModules.DISPLAY_SET,
  displaySetInstanceUID
);
```

| Change | Kind |
| --- | --- |
| Writes to the map from `getDisplaySetCache()` are lost | **Breaking** |
| `getDisplaySetCache()` is deprecated | Deprecation, still works for reads |
| `onModeExit()` clears only OHIF's own entries | Information |
| Display sets last for one mode | Information, unchanged behaviour |
| Display sets become immutable | Planned, not in 3.14 |

## Breaking: writes to `getDisplaySetCache()` are lost

`displaySetService.getDisplaySetCache()` returns a new `Map` on each call, a
copy of the stored display sets. A write to that copy does not change the
service.

In 3.13, the 4D commands of `@ohif/extension-cornerstone-dynamic-volume`
(`swapDynamicWithComputedDisplaySet` and `swapComputedWithDynamicDisplaySet`)
wrote to this map. In 3.14 they call `addDisplaySets`, so the service also
sends `DISPLAY_SETS_ADDED` for the computed display set.

**Before (3.13)**, these calls changed the service:

```js
displaySetService.getDisplaySetCache().set(uid, myDisplaySet);
displaySetService.getDisplaySetCache().delete(uid);
displaySetService.getDisplaySetCache().clear();
```

**After (3.14)**, use the service methods, which also update the active display
set list and send the events:

```js
displaySetService.addDisplaySets(myDisplaySet);
displaySetService.deleteDisplaySet(uid);
displaySetService.onModeExit(); // removes all of this service's display sets
```

To make display sets from instances, use
`displaySetService.makeDisplaySets(instances)`.

## Deprecated: `getDisplaySetCache()`

Reads from `getDisplaySetCache()` still work. Use the service methods instead.

**Before (3.13):**

```js
const cache = displaySetService.getDisplaySetCache();
const one = cache.get(uid);
const all = Array.from(cache.values());
const ct = Array.from(cache.values()).filter(ds => ds.Modality === 'CT');
```

**After (3.14):**

```js
const one = displaySetService.getDisplaySetByUID(uid);
const all = displaySetService.getActiveDisplaySets();
const ct = displaySetService.getDisplaySetsBy(ds => ds.Modality === 'CT');
```

`getActiveDisplaySets()` returns all display sets of the current mode, as
`getDisplaySetCache().values()` did.

## Information: clearing removes only OHIF's own entries

`onModeExit()` removes only the display sets that this service created, one UID
at a time. It does not clear the whole `DISPLAY_SET` module. Entries that
cornerstone code writes directly (keyed by image id, not by
`displaySetInstanceUID`) stay.

## Information: display sets last for one mode

This is the same as in 3.13, but the mechanism is now shared with cornerstone.
Two steps clear display sets when a mode exits, and both are intended:

| Step | What it clears |
| --- | --- |
| `mode.onModeExit` | nothing; it runs first, so a mode can keep what it needs |
| `@ohif/extension-cornerstone` `onModeExit` | `utilities.clearCacheData()`: the whole typed metadata registry, with the `DISPLAY_SET` module |
| `DisplaySetService.onModeExit()` | this service's own display sets, one UID at a time |

The cornerstone extension releases the typed registry because naturalized
instances hold full Part 10 buffers, outside the size-capped image cache. The
display sets go with them on purpose. Because `mode.onModeExit` runs before
both steps, this pattern still works:

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

A `displaySetInstanceUID` kept across a mode change does not work:
`getDisplaySetByUID` returns `undefined` after the change. Keep the display set
object itself.

If code calls `utilities.clearCacheData()` while a mode is active (for example
when a loader initializes again), the service finds the missing entries on the
next read and removes their UIDs from its index. It does not return stale UIDs.

## Planned (not in 3.14): display sets become immutable

This section is for information. Nothing in it changes in 3.14.

A later release replaces the display set storage with a vanilla zustand store,
the `displaySetStore` of `@cornerstonejs/metadata`. In that release:

- A display set is an immutable record. Code changes a display set with a
  service call (for example an `update` of the fields), and not with a direct
  write such as `displaySet.isLoaded = true`.
- A change gives a new display set object. Code that keeps a display set object
  must read it again by `displaySetInstanceUID` to see the change.
- `utilities.clearCacheData()` no longer clears display sets. Only
  `DisplaySetService.onModeExit()` clears them.

To prepare, avoid new code that writes to a display set object after
`addDisplaySets`, and keep the `displaySetInstanceUID` instead of the object
where you can.
