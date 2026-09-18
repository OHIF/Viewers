/**
 * Default customization values for viewport scrollbar behavior.
 * The `progress` scrollbar variant is in full mode for stack viewports and
 * acquisition-plane orthographic viewports.
 * Otherwise, viewports using the `progress` scrollbar show only the indicator.
 *
 * - `viewportScrollbar.variant`: `'progress' | 'legacy'` (default: `'progress'`)
 * - `viewportScrollbar.showLoadedEndpoints`: show loaded-range endpoint caps in full mode
 * - `viewportScrollbar.showLoadedFill`: show loaded/cached fill in full mode
 * - `viewportScrollbar.showViewedFill`: show viewed fill in full mode
 * - `viewportScrollbar.showLoadingPattern`: show loading pattern in full mode while not fully loaded
 * - `viewportScrollbar.viewedDwellMs`: delay before marking current image viewed in full mode (ms)
 * - `viewportScrollbar.loadedBatchIntervalMs`: loaded-state version batch interval in full mode (ms)
 * - `viewportScrollbar.indicator`: optional custom indicator config
 */
export default function getViewportScrollbarCustomization() {
  return {
    'viewportScrollbar.variant': 'progress',
    'viewportScrollbar.showLoadedEndpoints': true,
    'viewportScrollbar.showLoadedFill': true,
    'viewportScrollbar.showViewedFill': true,
    'viewportScrollbar.showLoadingPattern': true,
    'viewportScrollbar.viewedDwellMs': 0,
    'viewportScrollbar.loadedBatchIntervalMs': 200,
    'viewportScrollbar.indicator': {},
  };
}
