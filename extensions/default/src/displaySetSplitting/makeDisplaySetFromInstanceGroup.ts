import type { InstanceGroup } from '@cornerstonejs/metadata';
import getDisplaySetMessages from '../getDisplaySetMessages';
import {
  getDisplaySetInfo,
  makeImageSetDisplaySet,
  type ImageSetFactoryContext,
} from './makeImageSetDisplaySet';

/**
 * Attributes the rule's `customAttributes` may never overwrite — they define
 * the identity/content of the display set.
 */
const RESERVED_ATTRIBUTES = new Set([
  'instances',
  'images',
  'uid',
  'displaySetInstanceUID',
  'splitKey',
]);

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
  { splitNumber }: { splitNumber: number },
  context: ImageSetFactoryContext
) {
  const { instances, matchedRule, splitKey } = group;

  const imageSet = makeImageSetDisplaySet([...instances], context);
  const sopClassUids = [...new Set(instances.map(instance => instance.SOPClassUID))];
  const viewportTypes = matchedRule.viewportTypes ? [...matchedRule.viewportTypes] : undefined;

  imageSet.setAttributes({
    sopClassUids,
    splitKey,
    splitRuleId: matchedRule.id,
    viewportTypes,
  });

  const customAttributes = matchedRule.customAttributes?.(
    {
      instance: instances[0],
      isMultiFrame: Number(instances[0]?.NumberOfFrames) > 1,
      sopClassUids: sopClassUids as string[],
      viewportTypes: matchedRule.viewportTypes,
    },
    { instances: [...instances], splitNumber }
  );
  if (customAttributes) {
    imageSet.setAttributes(
      Object.fromEntries(
        Object.entries(customAttributes).filter(([key]) => !RESERVED_ATTRIBUTES.has(key))
      )
    );
  }

  // Incremental-merge hook used by DisplaySetService when new instances of an
  // existing split group arrive.  Intentionally NOT named `addInstances` (the
  // SOP-class-handler merge hook) so the legacy handler loop can never feed
  // unmatched instances into split-rule display sets - they share the stack
  // SOPClassHandlerId.
  imageSet.setAttribute('updateInstances', newInstances => {
    const knownSOPInstanceUIDs = new Set(
      imageSet.instances.map(instance => (instance as { SOPInstanceUID?: string }).SOPInstanceUID)
    );
    const instancesToAdd = newInstances.filter(
      instance => !knownSOPInstanceUIDs.has(instance.SOPInstanceUID)
    );
    if (!instancesToAdd.length) {
      return undefined;
    }

    // `images` is a non-writable property, but the array contents are mutable.
    imageSet.images.push(...instancesToAdd);
    imageSet.sort(context.servicesManager.services.customizationService);

    // Recompute reconstructability and validation messages exactly like the
    // initial build.
    const dataSource = context.extensionManager.getActiveDataSource()[0];
    const imageIds = dataSource.getImageIdsForDisplaySet(imageSet);
    const {
      isDynamicVolume,
      value: isReconstructable,
      averageSpacingBetweenFrames,
      dynamicVolumeInfo,
    } = getDisplaySetInfo(imageSet.images, imageIds, context);
    const messages = getDisplaySetMessages(imageSet.images, isReconstructable, isDynamicVolume);

    imageSet.setAttributes({
      numImageFrames: imageSet.images.length,
      countIcon: isReconstructable ? 'icon-mpr' : undefined,
      isReconstructable,
      messages,
      averageSpacingBetweenFrames: averageSpacingBetweenFrames || null,
      isDynamicVolume,
      dynamicVolumeInfo,
    });

    return imageSet;
  });

  return imageSet;
}
