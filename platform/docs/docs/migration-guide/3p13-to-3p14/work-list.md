---
sidebar_position: 3
sidebar_label: WorkList
title: LegacyWorkList deprecated
---

# `LegacyWorkList` deprecated

3.13 shipped the ui-next `WorkList` at `/` and kept the previous study list as
`LegacyWorkList`, selectable through the `workList.variant` customization.

3.14 keeps that opt-out, unchanged. It is deprecated.

:::warning `LegacyWorkList` will be removed in a future release
`workList.variant: 'legacy'` still mounts the 3.13 study list in 3.14. A later
release removes the route and the customization id together. Treat the opt-out
as time to finish migrating, not as a setting to keep.
:::

## What is unchanged in 3.14

- `workList.variant` accepts `'default'` and `'legacy'`, and defaults to
  `'default'`.
- `'legacy'` mounts the same `LegacyWorkList` code as 3.13. The file is opted
  out of the React Compiler, so it runs on its own memoization exactly as it did.
- The other `workList.*` customizations apply only when the variant is
  `'default'`, as before.

## What to do now

Move whatever the legacy list is kept for onto the new one. The `workList.*`
namespace covers the study-list table and its preview panel:

| Customization | Purpose |
| --- | --- |
| `workList.columns` | the study-list table's column set |
| `workList.previewSeriesView` | thumbnails, list, or both in the preview panel |
| `workList.renderPreviewContent` | replace the preview panel's contents |
| `workList.settingsMenuItems` | entries in the study-list settings menu |

See the [Work List customization docs](../../platform/services/customization-service/WorkList.md)
for the full reference and examples. Once your customizations are in place,
remove `workList.variant` from your config.

If you import `LegacyWorkList` directly, plan on that import path disappearing
with the route. There will be no drop-in replacement; customize `WorkList` or
mount your own route.

## Related: `@ohif/ui` is frozen

`LegacyWorkList` is the last consumer of the legacy `@ohif/ui` package inside the
viewer. 3.14 drops the `@ohif/ui` workspace dependency from the extensions and
modes that declared it without importing it. The package still builds and
publishes, and it leaves the app graph when `LegacyWorkList` does.

If your extension or mode imports components from `@ohif/ui`, migrate those
imports to `@ohif/ui-next`.
