---
title: Work List (UINext) Customization
summary: Documentation for configuring the OHIF WorkListUINext study-list route, including the preview panel's series view (thumbnails, list, or both).
sidebar_position: 9
---

# Work List (UINext)

The `workListUINext.*` namespace customizes the WorkListUINext study-list route used as the default landing page in OHIF.

## `workListUINext.previewSeriesView`

Controls which series views are available in the preview panel that opens to the right of the study list.

- `'all'` (default customization value): the thumbnails/list toggle is visible. The initial preview view is thumbnails.
- `'thumbnails'`: the toggle is hidden; the preview is locked to thumbnails.
- `'list'`: the toggle is hidden; the preview is locked to the series list.

Note: the preview is forced to `'list'` when the active data source either declares `thumbnailRendering` as `'wadors'` or `'thumbnailDirect'`, or declares `thumbnailRequestStrategy` as `'bulkDataRetrieve'` (the default value for `thumbnailRequestStrategy`). In those cases, the customization is ignored and the technical override wins.

import { workListUINextCustomizations, TableGenerator } from './sampleCustomizations';

{TableGenerator(workListUINextCustomizations)}
