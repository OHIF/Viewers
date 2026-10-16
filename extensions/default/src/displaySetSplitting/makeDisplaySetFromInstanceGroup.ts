import { orderInstancesForRule } from '@cornerstonejs/metadata';
import type {
  GroupInstancesOptions,
  InstanceGroup,
  SeriesFacts,
  SplitRule,
} from '@cornerstonejs/metadata';
import {
  applyImageListAttributes,
  applyThumbnailSrc,
  makeImageSetDisplaySet,
  type ImageSetFactoryContext,
} from './makeImageSetDisplaySet';

/**
 * Attributes the rule's `customAttributes` may never overwrite — they define
 * the identity/content of the display set.
 */
const RESERVED_ATTRIBUTES = new Set([
  'instances',
  'instance',
  'images',
  'uid',
  'displaySetInstanceUID',
  'splitKey',
  // The rule and the rule group that made the display set. DisplaySetService
  // compares splitRuleId with the matched rule when a display set grows, and a
  // hanging protocol reads splitGroupId, so a rule must not rename either one.
  'splitRuleId',
  'splitGroupId',
  // The growth hook DisplaySetService calls on a re-split.
  'extendInstances',
  // `setAttributes` assigns each key, and `imageSet['__proto__'] = value`
  // replaces the prototype of the ImageSet instead of adding an attribute.
  '__proto__',
]);

/** The ordering inputs every sort of one split-rule display set uses. */
type InstanceOrder = {
  series?: SeriesFacts;
  compareInstances?: GroupInstancesOptions['compareInstances'];
};

/**
 * Puts a split-rule display set's images in the order the rule asks for.
 *
 * Two orderings meet here and only one can win. OHIF has a default instance
 * order (`ImageSet.sortInstances` — the `instanceSortingCriteria` customization,
 * else patient-position, else instance number) and a split rule may declare a
 * `compareInstances` of its own. Calling OHIF's sort on its own discards the
 * rule's, which is what used to happen: the engine ordered the group and
 * `imageSet.sort` immediately re-sorted it from scratch, so a rule's declared
 * order had no effect on the display set at all.
 *
 * `orderInstancesForRule` composes them with the engine's own precedence, so the
 * answer is the same one the split engine computed: OHIF's default is the base
 * order, the rule's comparator overrides it where it has an opinion, then the
 * host comparator (the customization's `compareInstances`) where the rule has
 * none, and a comparator returning 0 leaves the base order alone. The host
 * comparator must be passed here too: the engine ordered the group with it,
 * and a re-sort without it discards that order. So must the group's series
 * facts: computed from the display set alone, a fact such as "this series mixes
 * b-values" can differ from the value the split saw.
 *
 * Sorted in place, because `imageSet.images` is a non-writable property whose
 * contents are mutable.
 */
function applyInstanceOrder(
  imageSet,
  matchedRule: SplitRule,
  { series, compareInstances }: InstanceOrder,
  context: ImageSetFactoryContext
) {
  const { customizationService } = context.servicesManager.services;
  const ordered = orderInstancesForRule(imageSet.images, matchedRule, {
    sortInstances: list => imageSet.sortInstances(list, customizationService),
    compareInstances,
    series,
  });
  imageSet.images.splice(0, imageSet.images.length, ...ordered);
}

/**
 * Orders the images, then refreshes the attributes that depend on the order.
 *
 * The image-list attributes must already describe the current images: OHIF's
 * default sort reads `isReconstructable` to choose patient-position or
 * instance-number order. `isReconstructable` does not depend on the order, but
 * `instance`, `messages` and the thumbnail do, so they are applied again from
 * the final order. The initial build and the growth hook both end here, so a
 * display set that grew is the same as one built from all of its instances.
 */
function orderAndRefreshAttributes(
  imageSet,
  matchedRule: SplitRule,
  order: InstanceOrder,
  context: ImageSetFactoryContext
) {
  applyInstanceOrder(imageSet, matchedRule, order, context);
  const derived = applyImageListAttributes(imageSet, context);
  applyThumbnailSrc(imageSet, context, derived);
}

/**
 * Converts a `@cornerstonejs/metadata` split-rule instance group into a full
 * OHIF ImageSet display set.  This is the default
 * `createDisplaySetFromGroup` of the `useMetadataDisplaySet` customization.
 *
 * The display set is built by the same factory the legacy stack SOP class
 * handler uses, so it carries the complete legacy attribute set; the split
 * engine then contributes `splitKey` (reconciliation identity),
 * `splitRuleId`, `viewportTypes` and the matched rule's custom attributes.
 */
export function makeDisplaySetFromInstanceGroup(
  group: InstanceGroup,
  {
    splitNumber,
    compareInstances,
  }: { splitNumber: number; compareInstances?: GroupInstancesOptions['compareInstances'] },
  context: ImageSetFactoryContext
) {
  const { instances, matchedRule, splitKey } = group;
  // What every re-sort of this display set orders with.
  const order: InstanceOrder = { series: group.series, compareInstances };

  // The factory applies the image-list attributes, which the sort reads.
  const imageSet = makeImageSetDisplaySet([...instances], context, {
    // The order is applied below, once, with the matched rule folded in.
    skipSort: true,
  });
  orderAndRefreshAttributes(imageSet, matchedRule, order, context);
  const sopClassUidsOf = list =>
    [...new Set(list.map(instance => instance.SOPClassUID))] as string[];
  const viewportTypes = matchedRule.viewportTypes ? [...matchedRule.viewportTypes] : undefined;

  imageSet.setAttributes({
    sopClassUids: sopClassUidsOf(imageSet.images),
    splitKey,
    splitRuleId: matchedRule.id,
    // The group of rules the rule belongs to; the rule id unless the rule
    // names a group. Several rules for one kind of display set (breast
    // tomosynthesis, legacy mammography, mammography already split) share one
    // group id, so a hanging protocol can match all of them.
    splitGroupId: matchedRule.groupId ?? matchedRule.id,
    viewportTypes,
  });

  // Applied from the CURRENT image list, so re-running it after a merge keeps
  // instance-derived attributes (e.g. `instanceNumber`) in step with the new
  // sort order instead of describing the instances of the first batch.
  // `compileSplitRules` wraps `customAttributes`, so an error here names the
  // rule and the field; DisplaySetService catches it and stops the study.
  const applyCustomAttributes = () => {
    const currentInstances = imageSet.images;
    const customAttributes = matchedRule.customAttributes?.(
      {
        instance: currentInstances[0],
        isMultiFrame: Number(currentInstances[0]?.NumberOfFrames) > 1,
        sopClassUids: sopClassUidsOf(currentInstances),
        viewportTypes: matchedRule.viewportTypes,
      },
      { instances: [...currentInstances], splitNumber, series: order.series }
    );
    if (!customAttributes) {
      return;
    }
    imageSet.setAttributes(
      Object.fromEntries(
        Object.entries(customAttributes).filter(([key]) => !RESERVED_ATTRIBUTES.has(key))
      )
    );
  };

  applyCustomAttributes();

  // Growth hook used by DisplaySetService when instances that are new to the
  // series belong with this display set. It only adds: a split-rule display set
  // never loses an instance. Intentionally NOT named `addInstances` (the
  // SOP-class-handler merge hook) so the legacy handler loop can never feed
  // unmatched instances into split-rule display sets - they share the stack
  // SOPClassHandlerId.
  imageSet.setAttribute(
    'extendInstances',
    (
      newInstances,
      options: {
        series?: SeriesFacts;
        compareInstances?: GroupInstancesOptions['compareInstances'];
      } = {}
    ) => {
      const known = new Set(imageSet.images.map(instance => instance.SOPInstanceUID));
      const instancesToAdd = newInstances.filter(instance => {
        if (known.has(instance.SOPInstanceUID)) {
          return false;
        }
        known.add(instance.SOPInstanceUID);
        return true;
      });
      if (!instancesToAdd.length) {
        return undefined;
      }
      // The series context of the re-split, which saw the whole series
      // including the new instances.
      if (options.series) {
        order.series = options.series;
      }
      if (options.compareInstances) {
        order.compareInstances = options.compareInstances;
      }

      // `images` is a non-writable property, but the array contents are mutable.
      imageSet.images.push(...instancesToAdd);
      // Recompute every image-list-derived attribute through the same helpers
      // the initial build uses. First for the grown list, because the sort reads
      // `isReconstructable`: one slice is not reconstructable, but more slices
      // can be. Then again from the final order, for the `instance`, the
      // messages and the thumbnail.
      applyImageListAttributes(imageSet, context);
      orderAndRefreshAttributes(imageSet, matchedRule, order, context);
      imageSet.setAttribute('sopClassUids', sopClassUidsOf(imageSet.images));
      // Last, so a rule's custom attributes still win over the recomputed
      // defaults - the same precedence as the initial build.
      applyCustomAttributes();

      return imageSet;
    }
  );
  return imageSet;
}
