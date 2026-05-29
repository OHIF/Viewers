import { StudyList } from '@ohif/ui-next';

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
 * - `workList.columns`: `ColumnDef[]` (default: `StudyList.defaultColumns`)
 *   The column set for the WorkList table, as a value (not a function). Because
 *   it is a plain array, override it with immutability-helper commands:
 *   - reorder / insert / remove: `$splice`
 *   - relabel / resize / reprioritize (all plain data in `meta`): `$set` / `$merge`
 *   - replace a renderer: `$set` a new `cell` / `header` function
 *   - `$apply: (cols) => ColumnDef[]`: receive the current columns and return the
 *     new array. Use it for anything the other commands don't express cleanly —
 *     moves, conditional inserts, or any edit keyed off a column's `id` rather
 *     than its position (e.g. `cols.find(c => c.id === 'modalities')`).
 *   Use `StudyList.textColumn(id, label, meta?)` to build a simple display-only
 *   column without writing the accessor/header/cell wiring.
 *
 *   Gotchas / limitations:
 *   - A `ColumnDef`'s `accessorFn` / `cell` / `header` / `filterFn` / `sortingFn`
 *     are functions: `$set`/`$push` accept them, but they are not serializable,
 *     so columns that render anything beyond plain text still need code.
 *   - The trailing `actions` column should stay last for correct layout (its
 *     hover menu is right-aligned to sit at the row end) — this is cosmetic,
 *     not a hard requirement. Insert new columns *before* it with `$splice`
 *     (a `$push` lands after it, leaving the actions menu mid-row).
 *   - Index-based commands (e.g. `{ 2: { meta: { label: { $set: '…' } } } }`)
 *     are position-fragile; prefer `$apply` for id-based edits.
 *   If the merged value is not an array, WorkList falls back to the defaults.
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
    'workList.columns': StudyList.defaultColumns,
    'workList.renderPreviewContent': undefined,
    'workList.settingsMenuItems': (defaults: unknown) => defaults,
  };
}
