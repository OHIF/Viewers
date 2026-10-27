import { createDisplaySetFromGroup, orderInstancesForRule } from '@cornerstonejs/metadata';
import type {
  GroupInstancesOptions,
  InstanceGroup,
  SeriesFacts,
  SplitRule,
} from '@cornerstonejs/metadata';
import {
  applyImageAttributes,
  applyImageListAttributes,
  applyThumbnailSrc,
  makeSeriesDisplaySet,
  type ImageSetFactoryContext,
} from './makeImageSetDisplaySet';

/**
 * The fields of the `@cornerstonejs/metadata` display set that the OHIF
 * display set does not take: the CS3D identity and image id lists, and the
 * fields that define the identity or the content of the OHIF display set.
 * The rule's custom attributes cannot set these either.
 */
const NOT_COPIED = new Set([
  'displaySetId',
  'imageIds',
  'underlyingImageIds',
  'instances',
  'instance',
  'images',
  'uid',
  'displaySetInstanceUID',
  // A rule has no viewport types: the handler decides how OHIF shows the
  // display set.
  'viewportTypes',
  'preferredViewportType',
  // The growth hook DisplaySetService calls on a re-split.
  'extendInstances',
  // `imageSet['__proto__'] = value` replaces the prototype of the ImageSet.
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
 * `orderInstancesForRule` composes OHIF's default order (`ImageSet.sortInstances`)
 * with the rule's comparator and the host comparator, with the precedence the
 * split engine uses, so the result is the order the engine computed. The host
 * comparator and the group's series facts must be passed again, or the re-sort
 * discards that order.
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
 * OHIF's default sort reads `isReconstructable`, so the image-list attributes
 * must already describe the current images. `instance`, `messages` and the
 * thumbnail depend on the order, so they are applied again from the final
 * order. The initial build and the growth hook both end here, so a display
 * set that grew is the same as one built from all of its instances.
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
 * Copies the fields of the `@cornerstonejs/metadata` display set onto the OHIF
 * display set: `splitKey`, `splitRuleId`, `splitGroupId`, `sopClassUids`,
 * `handler` and the rule's attributes. Applied after the OHIF
 * defaults, so the rule's attributes win over them.
 */
function copyRuleDisplaySet(displaySet, ruleDisplaySet: object) {
  for (const [key, value] of Object.entries(ruleDisplaySet)) {
    if (!NOT_COPIED.has(key)) {
      displaySet.setAttribute(key, value);
    }
  }
}

/**
 * Converts a `@cornerstonejs/metadata` split-rule instance group into an OHIF
 * display set. This is the default `createDisplaySetFromGroup` of the
 * `useMetadataDisplaySet` customization.
 *
 * The build has three steps (DS-IMPL-OHIF-4); this function runs the first two:
 *
 * 1. CS3D `createDisplaySetFromGroup` builds the display set of the group,
 *    the same one that a server builds.
 * 2. The OHIF generic step builds an ImageSet with the series identity, and
 *    copies the fields of step 1. Its image part (the stack handler id, the
 *    image-list attributes, the thumbnail and the instance order) runs only
 *    for a rule with no `handler`, or with the `image` handler.
 * 3. DisplaySetService calls the `extendDisplaySet` of the SOP class handler
 *    that declares the rule's `handler` name.
 *
 * The `extendInstances` hook repeats steps 1 and 2 for the instances that
 * arrive later. It only adds: a split-rule display set never loses an
 * instance. It is not named `addInstances` (the SOP class handler merge
 * hook), so the legacy handler loop never feeds instances into it.
 */
export function makeDisplaySetFromInstanceGroup(
  group: InstanceGroup,
  {
    splitNumber,
    compareInstances,
  }: { splitNumber: number; compareInstances?: GroupInstancesOptions['compareInstances'] },
  context: ImageSetFactoryContext
) {
  const { matchedRule } = group;
  // What every re-sort of this display set orders with.
  const order: InstanceOrder = { series: group.series, compareInstances };

  // Step 1. `compileSplitRules` wraps `customAttributes`, so an error here
  // names the rule and the field; DisplaySetService catches it and stops the
  // study.
  const ruleDisplaySet = createDisplaySetFromGroup(group, { splitNumber });
  const { handler } = ruleDisplaySet as { handler?: string };
  const isImage = !handler || handler === 'image';

  // Step 2.
  const displaySet = makeSeriesDisplaySet([...group.instances]);
  if (isImage) {
    // The order is applied below, once, with the matched rule folded in.
    applyImageAttributes(displaySet, context, { skipSort: true });
    orderAndRefreshAttributes(displaySet, matchedRule, order, context);
  }
  copyRuleDisplaySet(displaySet, ruleDisplaySet);

  displaySet.setAttribute(
    'extendInstances',
    (
      newInstances,
      options: {
        series?: SeriesFacts;
        compareInstances?: GroupInstancesOptions['compareInstances'];
      } = {}
    ) => {
      const known = new Set(displaySet.images.map(instance => instance.SOPInstanceUID));
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

      // `images` is a non-writable property, but the array contents are
      // mutable. A non-image display set keeps the new instances at the end.
      displaySet.images.push(...instancesToAdd);
      if (isImage) {
        // The sort reads `isReconstructable`: one slice is not reconstructable,
        // but more slices can be. So the attributes come first for the grown
        // list, then again from the final order.
        applyImageListAttributes(displaySet, context);
        orderAndRefreshAttributes(displaySet, matchedRule, order, context);
      }
      // The display set keeps the `splitKey` of the group that created it.
      copyRuleDisplaySet(
        displaySet,
        createDisplaySetFromGroup(
          { ...group, series: order.series, instances: [...displaySet.images] },
          { splitNumber }
        )
      );
      return displaySet;
    }
  );
  return displaySet;
}
