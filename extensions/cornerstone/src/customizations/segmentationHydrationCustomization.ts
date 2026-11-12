export default {
  /**
   * Viewport types a hydrated segmentation is allowed to appear in
   * automatically.
   *
   * `null` (the default) means every viewport type that can render it, which is
   * the behaviour hydration has always had. Set it to a list of OHIF viewport
   * types - the vocabulary of a hanging protocol's
   * `viewportOptions.viewportType` - to narrow that, e.g.
   * `['stack', 'volume']` to keep automatic hydration out of 3D viewports,
   * where the labelmap has to be converted to a surface first. Narrowing this
   * does not stop a user adding the segmentation to such a viewport by hand
   * from the overlay menu.
   */
  'cornerstone.segmentation.autoHydrateViewportTypes': null,
};
