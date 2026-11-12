import HeaderUndoRedo from '../ViewerLayout/HeaderUndoRedo';

/**
 * Opt-in customization that drops the undo/redo buttons from the right side of
 * the viewer header's menu bar, leaving every other item there (patient info,
 * plus anything a site added) untouched. Add it to the app config:
 *
 * ```js
 * window.config = {
 *   customizationService: ['@ohif/extension-default.customizationModule.hideHeaderUndoRedo'],
 * };
 * ```
 *
 * `$filter` keeps the items its predicate returns true for, so this removes one
 * entry from the shipped `ohif.headerRightSide` list rather than replacing the
 * list — a site that added its own items keeps them.
 */
export default {
  'ohif.headerRightSide': {
    items: { $filter: (item: unknown) => item !== HeaderUndoRedo },
  },
};
