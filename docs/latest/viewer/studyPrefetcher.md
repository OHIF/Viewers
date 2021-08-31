# Viewer: Study Prefetcher & Stack Prefetch

Prefetching the stack of images of the active viewport is enabled by default for
cornerstone viewports via cornerstone tools's stack prefetch functionality.

In order to have a more customizable alternative for prefetching, OHIF provides
a built-in study prefetcher functionality which allows the user to set the order
in which the display sets are prefetched, the granularity, the timeout and
whether or not display a progress bar in the display set (close to the thumbnail
image) in the study browser.

You can customize these options via the viewer's configuration:

```js
window.config = {
  /**
   * OHIF's study prefetcher configuration.
   *
   * @param {boolean} enabled Whether to enable/disable OHIF's study prefetcher
   * @param {('all'|'closest'|'downward'|'upward'|'topdown')} order Fetching order: all display sets, the closest ones, downward or top down fashion based on the currently selected display set
   * @param {number} displaySetCount How much display sets should be prefetched at once (note: this attribute is ignored if order was set to 'all')
   * @param {boolean} preventCache Prevent images to be cached in Cornerstone Tools's request pool manager
   * @param {number} prefetchDisplaySetsTimeout Prefetch timeout
   * @param {boolean} displayProgress Whether to display or not the progress bar in the display set
   * @param {boolean} includeActiveDisplaySet Include or not the active display set while prefetching
   */
  studyPrefetcher: {
    enabled: true,
    order: 'all',
    displaySetCount: 1,
    preventCache: false,
    prefetchDisplaySetsTimeout: 300,
    displayProgress: false,
    includeActiveDisplaySet: true,
  },
};
```
