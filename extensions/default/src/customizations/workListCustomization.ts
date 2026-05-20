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
 *
 * - `workList.columns`: `(defaults) => ColumnDef[]` (default: identity)
 *   Builds the column set for the WorkList table. Receives the default
 *   `ColumnDef[]` (same shape as `StudyList.defaultColumns()`) and must return
 *   a `ColumnDef[]`. Use this to reorder, hide, or insert columns without
 *   rewriting the defaults. If the returned value is not an array, WorkList
 *   falls back to the defaults.
 *   Currently only applies when `workList.variant` is `'default'`.
 */
export default function getWorkListCustomization() {
  return {
    'workList.variant': 'default',
    'workList.previewSeriesView': 'all',
    'workList.columns': (defaults: unknown) => defaults,
  };
}
