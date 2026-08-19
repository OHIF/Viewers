import type { InstanceGroup } from '@cornerstonejs/metadata';
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

  // Applied from the CURRENT image list, so re-running it after a merge keeps
  // instance-derived attributes (e.g. `instanceNumber`) in step with the new
  // sort order instead of describing the instances of the first batch.
  const applyCustomAttributes = () => {
    const currentInstances = imageSet.images;
    const customAttributes = matchedRule.customAttributes?.(
      {
        instance: currentInstances[0],
        isMultiFrame: Number(currentInstances[0]?.NumberOfFrames) > 1,
        sopClassUids: sopClassUids as string[],
        viewportTypes: matchedRule.viewportTypes,
      },
      { instances: [...currentInstances], splitNumber }
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

    // Recompute every image-list-derived attribute through the same helper the
    // initial build uses (reconstructability, messages, volumeLoaderSchema,
    // frame count, and the `instance`/thumbnail the new sort order implies).
    const derived = applyImageListAttributes(imageSet, context);
    applyThumbnailSrc(imageSet, context, derived);
    // Last, so a rule's custom attributes still win over the recomputed
    // defaults - the same precedence as the initial build.
    applyCustomAttributes();

    return imageSet;
  });

  return imageSet;
}
