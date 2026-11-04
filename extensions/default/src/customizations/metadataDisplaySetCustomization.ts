import { displaySetRules } from '@cornerstonejs/metadata';
import type { GroupInstancesOptions, InstanceGroup } from '@cornerstonejs/metadata';
import { makeDisplaySetFromInstanceGroup } from '../displaySetSplitting/makeDisplaySetFromInstanceGroup';
import type { ImageSetFactoryContext } from '../displaySetSplitting/makeImageSetDisplaySet';

/**
 * The `useMetadataDisplaySet` customization (default OFF).
 *
 * When enabled, DisplaySetService splits series instances into display sets
 * with the `@cornerstonejs/metadata` split-rules engine. A rule with a
 * `handler` name gives its display sets to the SOP class handler of the mode
 * that declares that name in `handlerNames`.
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
 * `splitRules` is the `@cornerstonejs/metadata` default rule set, keyed by
 * rule id, with no OHIF copy. A customization adds a rule with `$merge`, turns
 * a default off with `priority: null`, or moves one by changing its priority.
 * DisplaySetService compiles the rules with `createDisplaySetSplitRules`, with
 * the `metadataContext` customization as the context.
 *
 * A rule error stops display set creation; OHIF does not drop the rule, and
 * does not fall back to the SOP class handlers. See `DisplaySetService`.
 */
export default function getMetadataDisplaySetCustomization(context: ImageSetFactoryContext) {
  return {
    useMetadataDisplaySet: {
      enabled: false,
      splitRules: displaySetRules,
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
