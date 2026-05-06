/**
 * Default customization values for the WorkListUINext study-list route.
 *
 * - `workListUINext.previewSeriesView`: `'all' | 'thumbnails' | 'list'` (default: `'all'`)
 *   Controls which series views are available in the preview panel.
 *   - `'all'`: thumbnails/list toggle is visible; defaults to thumbnails.
 *   - `'thumbnails'`: toggle hidden; locked to thumbnails view.
 *   - `'list'`: toggle hidden; locked to list view.
 *   Note: the preview is forced to `'list'` when the active data source either:
 *   - declares `thumbnailRendering` as `'wadors'` or `'thumbnailDirect'`, or
 *   - declares `thumbnailRequestStrategy` as `'bulkDataRetrieve'` (default value).
 */
export default function getWorkListUINextCustomization() {
  return {
    'workListUINext.previewSeriesView': 'all',
  };
}
