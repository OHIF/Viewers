/**
 * Opt-in customization that empties the undo/redo slot in the viewer header's
 * right hand menu bar. Add it to the app config to hide those buttons:
 *
 * ```js
 * window.config = {
 *   customizationService: ['@ohif/extension-default.customizationModule.hideUndoRedo'],
 * };
 * ```
 *
 * `null` is an explicit value here, not an absent one, so it overrides the
 * default `ohif.headerUndoRedo` component rather than falling back to it.
 */
export default {
  'ohif.headerUndoRedo': null,
};
