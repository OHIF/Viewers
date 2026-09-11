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
/**
 * How a `$function` at each split-rule attribute is invoked.
 *
 * Registered here, by the extension that reads these attributes back, rather
 * than left for a data author to declare with `params`: the caller is the only
 * party that knows the calling convention, and a marker guessing it wrong
 * compiles cleanly and then computes nonsense.
 *
 * `series` facts take only the series context, so a bare `instances` in a fact
 * expression resolves against it. `compareInstances` is the reason this exists
 * at all — a comparator needs both instances in scope, which no default
 * convention provides.
 */
const SPLIT_RULE_FUNCTION_SIGNATURES: Record<string, string[]> = {
  'useMetadataDisplaySet.splitRules.matches': ['instance', 'context'],
  'useMetadataDisplaySet.splitRules.runBy': ['instance', 'context'],
  'useMetadataDisplaySet.splitRules.groupBy': ['instance', 'context'],
  'useMetadataDisplaySet.splitRules.series.*': ['context'],
  'useMetadataDisplaySet.splitRules.customAttributes.*': ['instance', 'context'],
  'useMetadataDisplaySet.splitRules.compareInstances': ['a', 'b', 'context'],
};

export default function getMetadataDisplaySetCustomization(context: ImageSetFactoryContext) {
  // Registered as the customization module is built, which is the once-per-app
  // moment the attributes below become readable.
  context.servicesManager.services.customizationService?.registerFunctionSignatures?.(
    SPLIT_RULE_FUNCTION_SIGNATURES
  );

  return {
    useMetadataDisplaySet: {
      enabled: false,
      splitRules: ohifDefaultSplitRules,
      createDisplaySetFromGroup: (group: InstanceGroup, options: { splitNumber: number }) =>
        makeDisplaySetFromInstanceGroup(group, options, context),
    },
  };
}
