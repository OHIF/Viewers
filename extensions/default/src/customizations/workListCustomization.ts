/**
 * Default customization values for the WorkList study-list route.
 *
 * - `workList.variant`: `'default' | 'legacy'` (default: `'default'`)
 *   Selects which study-list route is mounted at `/`.
 *   - `'default'`: the new ui-next WorkList.
 *   - `'legacy'`: the pre-3.13 WorkList (now `LegacyWorkList`). Useful as an
 *     opt-out while integrators migrate to the new study list.
 *
 * - `workList.previewSeriesView`: `'all' | 'thumbnails' | 'list'` (default: `'all'`)
 *   Controls which series views are available in the preview panel.
 *   - `'all'`: thumbnails/list toggle is visible; defaults to thumbnails.
 *   - `'thumbnails'`: toggle hidden; locked to thumbnails view.
 *   - `'list'`: toggle hidden; locked to list view.
 *   Note: the preview is forced to `'list'` when the active data source either:
 *   - declares `thumbnailRendering` as `'wadors'` or `'thumbnailDirect'`, or
 *   - declares `thumbnailRequestStrategy` as `'bulkDataRetrieve'` (default value).
 *   Currently only applies when `workList.variant` is `'default'`.
 */
export default function getWorkListCustomization() {
  return {
    'workList.variant': 'default',
    'workList.previewSeriesView': 'all',
  };
}
