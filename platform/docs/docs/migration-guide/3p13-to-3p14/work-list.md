---
sidebar_position: 3
sidebar_label: WorkList
title: LegacyWorkList and workList.variant removed
---

# `LegacyWorkList` and `workList.variant` removed

3.13 shipped the ui-next `WorkList` at `/` while preserving the previous study
list as `LegacyWorkList`, selectable through the `workList.variant`
customization. That opt-out was a temporary bridge for the 3.13 cycle.

In 3.14 both are gone:

- The `LegacyWorkList` route and its component directory are removed.
- The `workList.variant` customization is removed.
- The ui-next `WorkList` is always mounted at `/`, so every `workList.*`
  customization now applies unconditionally.

## If you set `workList.variant`

Remove the setting. It is now an unrecognized customization id, and OHIF ignores
unrecognized ids silently — **nothing will error**, but the legacy study list no
longer exists, so you will get the ui-next `WorkList` either way.

**Before (3.13):**

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

**After (3.14):**

```js
window.config = {
  customizationService: [
    // 'workList.variant' removed - the ui-next WorkList is the only study list.
  ],
};
```

## If you imported `LegacyWorkList` directly

The import path introduced in 3.13 no longer exists:

```ts
// Removed in 3.14
import LegacyWorkList from 'path/to/routes/LegacyWorkList/LegacyWorkList';
```

There is no drop-in replacement. Customize the ui-next `WorkList` instead (see
below), or mount your own route if you need a fully custom study list.

## Customizing the new WorkList

What the legacy list was usually kept for is expressed as customization on the new
one. The `workList.*` namespace covers the study-list table and its preview panel:

| Customization | Purpose |
| --- | --- |
| `workList.columns` | the study-list table's column set |
| `workList.previewSeriesView` | thumbnails, list, or both in the preview panel |
| `workList.renderPreviewContent` | replace the preview panel's contents |
| `workList.settingsMenuItems` | entries in the study-list settings menu |

See the [Work List customization docs](../../platform/services/customization-service/WorkList.md)
for the full reference and examples.

## Related: `@ohif/ui` left the app graph

`LegacyWorkList` was the last consumer of the legacy `@ohif/ui` package inside the
viewer, so 3.14 also drops the `@ohif/ui` workspace dependency from the packages
that still carried it. The package continues to build and publish, but nothing in
the app graph imports it any more.

If your extension or mode imports components from `@ohif/ui`, migrate those
imports to `@ohif/ui-next`.
