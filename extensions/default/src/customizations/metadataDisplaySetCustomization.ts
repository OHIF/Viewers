import type { InstanceGroup } from '@cornerstonejs/metadata';
import { ohifDefaultSplitRules } from '../displaySetSplitting/ohifDefaultSplitRules';
import { makeDisplaySetFromInstanceGroup } from '../displaySetSplitting/makeDisplaySetFromInstanceGroup';
import type { ImageSetFactoryContext } from '../displaySetSplitting/makeImageSetDisplaySet';

/**
 * The `useMetadataDisplaySet` customization (default OFF).
 *
 * When enabled, DisplaySetService splits series instances into display sets
 * with the `@cornerstonejs/metadata` split-rules engine instead of the stack
 * SOP class handler.  Instances not matched by any rule (video, whole-slide,
 * ECG, SEG, SR, RT, PDF, ...) fall through to the registered SOP class
 * handlers unchanged.
 *
 * Enable per mode:
 * ```js
 * customizationService.setCustomizations({
 *   useMetadataDisplaySet: { enabled: { $set: true } },
 * });
 * ```
 * or globally via the named module entry
 * `'@ohif/extension-default.customizationModule.metadataDisplaySet'`,
 * or from the URL with `?customization=split/enableNewSplit`.
 *
 * Split rules may be overridden with immutability-helper specs.  Rules may
 * also be authored declaratively (e.g. in JSONC URL customizations) with
 * `$function` expressions and object-form `series`/`customAttributes` maps —
 * DisplaySetService normalizes those into engine shape when reading the
 * customization.
 *
 * Note: image SOP class instances without `Rows` are unmatched by the default
 * rules and become a separate legacy stack display set (the legacy handler
 * merges them into the series' stackable display set instead).
 */
export default function getMetadataDisplaySetCustomization(context: ImageSetFactoryContext) {
  return {
    useMetadataDisplaySet: {
      enabled: false,
      splitRules: ohifDefaultSplitRules,
      createDisplaySetFromGroup: (group: InstanceGroup, options: { splitNumber: number }) =>
        makeDisplaySetFromInstanceGroup(group, options, context),
    },
  };
}
