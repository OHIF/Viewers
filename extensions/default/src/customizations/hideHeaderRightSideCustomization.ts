/**
 * Opt-in customization that empties the right side of the viewer header's menu
 * bar — by default the undo/redo buttons. Add it to the app config:
 *
 * ```js
 * window.config = {
 *   customizationService: ['@ohif/extension-default.customizationModule.hideHeaderRightSide'],
 * };
 * ```
 *
 * `null` is an explicit value here, not an absent one, so it overrides the
 * default `ohif.headerRightSide` component rather than falling back to it.
 */
export default {
  'ohif.headerRightSide': null,
};
