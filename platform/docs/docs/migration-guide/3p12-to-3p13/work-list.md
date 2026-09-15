---
sidebar_position: 4
sidebar_label: WorkList
title: WorkList route rename
---

# WorkList route rename

3.13 ships a new study-list at `/`. The 3.12 study-list code has been preserved and renamed to `LegacyWorkList`; what is now mounted at `/` by default is the new `WorkList`.

If you imported the 3.12 `WorkList` directly from `platform/app`, update the import path:

**Before (3.12):**

```ts
import WorkList from 'path/to/routes/WorkList/WorkList';
```

**After (3.13):**

```ts
import LegacyWorkList from 'path/to/routes/LegacyWorkList/LegacyWorkList';
```

This path was removed in 3.14 along with the route itself; see the
[3.13 to 3.14 migration guide](../3p13-to-3p14/work-list.md).

## Opting back into the legacy study list

:::danger Removed in 3.14
Both `workList.variant` and `LegacyWorkList` were removed in 3.14. The opt-out
below works only while you are on 3.13 — treat it as a temporary bridge, not a
long-term setting, and plan to migrate to the ui-next `WorkList` before
upgrading. See the
[3.13 to 3.14 migration guide](../3p13-to-3p14/work-list.md).
:::

If you need more time to migrate, set the new `workList.variant` customization to `'legacy'` to mount `LegacyWorkList` at `/`:

```js
window.config = {
  customizationService: [
    {
      'workList.variant': {
        $set: 'legacy',
      },
    },
  ],
};
```

See the [Work List customization docs](../../platform/services/customization-service/WorkList.md) for details.

## Thumbnail request concurrency

The new study list's preview panel fetches a thumbnail for each series in the selected study, in parallel. To keep that from saturating the connection and delaying viewer navigation, the parallel thumbnail pool is now bounded (mirroring Cornerstone3D's `imageLoadPoolManager` thumbnail limit), and the shipped example configs set `maxNumRequests.thumbnail` to `5`.

The shipped configs previously used `75`. In practice that was higher than this workload benefits from — beyond a handful of concurrent requests there is little throughput gain, while a large pool can crowd out interaction and prefetch requests and put unnecessary load on the server. If your configuration is based on a shipped config (or otherwise sets `maxNumRequests.thumbnail`), consider lowering it to around `5`.

When the value is not configured, the preview panel already defaults to `5`, so this only affects configurations that set it explicitly.
