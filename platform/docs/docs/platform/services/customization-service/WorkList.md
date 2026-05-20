---
title: Work List Customization
summary: Documentation for configuring the OHIF WorkList study-list route — selecting between the new (default) and legacy variants, and the preview panel's series view (thumbnails, list, or both).
sidebar_position: 9
---

# Work List

The `workList.*` namespace customizes the WorkList study-list route used as the default landing page in OHIF.

## `workList.variant`

Selects which study-list route is mounted at `/`.

- `'default'` (default customization value): the new ui-next WorkList, introduced in 3.13.
- `'legacy'`: the pre-3.13 WorkList (internally `LegacyWorkList`). Use this as an opt-out while migrating to the new study list.

The customization is read once during route registration, so changing it requires a reload.

## `workList.previewSeriesView`

Controls which series views are available in the preview panel that opens to the right of the study list.

- `'all'` (default customization value): the thumbnails/list toggle is visible. The initial preview view is thumbnails.
- `'thumbnails'`: the toggle is hidden; the preview is locked to thumbnails.
- `'list'`: the toggle is hidden; the preview is locked to the series list.

Note: the preview is forced to `'list'` when the active data source either declares `thumbnailRendering` as `'wadors'` or `'thumbnailDirect'`, or declares `thumbnailRequestStrategy` as `'bulkDataRetrieve'` (the default value for `thumbnailRequestStrategy`). In those cases, the customization is ignored and the technical override wins.

This customization currently only applies when `workList.variant` is `'default'`.

import { workListCustomizations, TableGenerator } from './sampleCustomizations';

{TableGenerator(workListCustomizations)}
