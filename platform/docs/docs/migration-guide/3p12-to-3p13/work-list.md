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

## Opting back into the legacy study list

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
