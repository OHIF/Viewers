import { displaySetRuleOrder, displaySetRules } from '@cornerstonejs/metadata';
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
 * Enable per mode, in the `onModeEnter` of the mode. `setCustomizations` uses
 * `CustomizationScope.Mode` by default, and `onModeExit` clears that scope:
 * ```js
 * customizationService.setCustomizations({
 *   useMetadataDisplaySet: { enabled: { $set: true } },
 * });
 * ```
 * or globally via the named module entry
 * `'@ohif/extension-default.customizationModule.metadataDisplaySet'`,
 * or from the URL with `?customization=split/enableNewSplit`.
 *
 * `displaySetRules` (the registry, keyed by rule id) and `displaySetRuleOrder`
 * (the rule ids in evaluation order) are the `@cornerstonejs/metadata`
 * defaults, with no OHIF copy. A customization changes a rule by its id in the
 * registry, and adds, removes or replaces an id of the order with `$splice`,
 * which takes a rule id as the position:
 * ```js
 * { displaySetRuleOrder: { $splice: [['volume3d', 0, 'byAcquisition']] } }
 * ```
 * DisplaySetService compiles the rules of the order with
 * `createDisplaySetSplitRules`, with the `metadataContext` customization as
 * the context.
 *
 * A rule error stops display set creation; OHIF does not drop the rule, and
 * does not fall back to the SOP class handlers. See `DisplaySetService`.
 */
export default function getMetadataDisplaySetCustomization(context: ImageSetFactoryContext) {
  return {
    useMetadataDisplaySet: {
      enabled: false,
      displaySetRules,
      displaySetRuleOrder,
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
