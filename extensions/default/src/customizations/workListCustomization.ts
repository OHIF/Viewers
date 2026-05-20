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
 *
 * - `workList.renderPreviewContent`: `(React, props) => ReactNode` (default: undefined)
 *   Render function for the preview panel content. Receives the host React and
 *   `{ study, series, seriesView, onThumbnailImageError }`:
 *   - `study`: the selected `StudyRow` (`null` when nothing is selected).
 *   - `series`: the study's series; each item has the raw data-source fields
 *     (`seriesInstanceUid`, `modality`, `description`, `seriesDate`,
 *     `seriesNumber`, `numSeriesInstances`, etc.) plus `thumbnailStatus` added
 *     by the shell, which is one of `{ status: 'loading' }`,
 *     `{ status: 'ready', src }`, `{ status: 'notAvailable' }`, or
 *     `{ status: 'notApplicable' }`. The `src` in the `'ready'` form is the
 *     URL to render in an `<img>`.
 *   - `seriesView`: `'all' | 'thumbnails' | 'list'`, resolved from
 *     `workList.previewSeriesView` with `'list'` forced for data sources that
 *     can't produce thumbnails. Honor it if your layout has both views.
 *   - `onThumbnailImageError(seriesUID)`: call when an `<img>` you render fails
 *     to load. The shell marks that series as `notAvailable` and revokes its
 *     blob URL if needed.
 *   Use this to change the preview layout while keeping the fetch/abort/thumbnail
 *   logic intact. When unset (or not a function), the built-in
 *   `<StudyList.PreviewContainer>` layout is used.
 *   Currently only applies when `workList.variant` is `'default'`.
 *
 * - `workList.settingsMenuItems`: `(defaults) => SettingsMenuItem[]` (default: identity)
 *   Builds the items in the WorkList settings popover. Receives the default
 *   items (`about`, `userPreferences`, and `logout` when OIDC is configured)
 *   and must return a
 *   `SettingsMenuItem[]`. Each item is `{ id, label, onClick }`. Use this to
 *   reorder, remove, or insert items without rebuilding the popover shell. If
 *   the returned value is not an array, WorkList falls back to the defaults.
 *   Currently only applies when `workList.variant` is `'default'`.
 */
export default function getWorkListCustomization() {
  return {
    'workList.variant': 'default',
    'workList.previewSeriesView': 'all',
    'workList.columns': (defaults: unknown) => defaults,
    'workList.renderPreviewContent': undefined,
    'workList.settingsMenuItems': (defaults: unknown) => defaults,
  };
}
