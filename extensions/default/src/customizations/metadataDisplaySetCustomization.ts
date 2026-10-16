import type { GroupInstancesOptions, InstanceGroup } from '@cornerstonejs/metadata';
import {
  ohifDefaultSplitRules,
  ohifSplitRuleClassifiers,
} from '../displaySetSplitting/ohifDefaultSplitRules';
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
 * `splitRules` is keyed by rule id, and each rule has a `priority` (ascending
 * order, first match wins). The defaults use `1..n`. A customization adds a
 * rule with `$merge`, turns a default off with `priority: null`, or moves one
 * by changing its priority - a priority below 0 runs before every default, and
 * above 10000 after every default.
 *
 * The rules are `@cornerstonejs/metadata` raw selector data - the same
 * safe-function vocabulary (`{ attribute, equals }`, `{ expression }`, series
 * facts, custom attribute recipes) a JSONC URL customization writes.
 * DisplaySetService compiles them with `createDisplaySetSplitRules`, with the
 * `classifiers` below as the named extension points.
 *
 * A rule error stops display set creation; OHIF does not drop the rule, and
 * does not fall back to the SOP class handlers. A rule that does not compile
 * stops every display set, SEG and SR included; a rule that throws at run time
 * (a classifier, a rule function, or `customAttributes` in the factory below)
 * stops further display sets for the study. Either error shows a persistent
 * notification that names the rule. See `DisplaySetService`.
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
      // `{ classifier: 'stackImage' }` in a rule: the stack SOP class
      // handler's ownership test, which data cannot express.
      classifiers: ohifSplitRuleClassifiers,
      createDisplaySetFromGroup: (
        group: InstanceGroup,
        options: {
          splitNumber: number;
          compareInstances?: GroupInstancesOptions['compareInstances'];
        }
      ) => makeDisplaySetFromInstanceGroup(group, options, context),
    },
  };
}
