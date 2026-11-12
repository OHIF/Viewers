import OHIF from '@ohif/core';

import { setNonEnumerableInstanceProperty } from './dicomWriter';

const metadataProvider = OHIF.classes.MetadataProvider;

/**
 * Gives a just stored instance the imageId that loading it back would use, and
 * maps that imageId to the instance's UIDs.
 *
 * Instances that arrive through a data source's metadata request are given this
 * as part of that request.  An instance stored from the viewer is added to the
 * metadata store directly, so it has to be done here - and until it is, the
 * display set made from the stored instance does not know which instance it came
 * from.  That is what makes a just stored object the predecessor of the next save
 * of the same data, so that the next save can offer to extend the series just
 * written instead of creating another one.
 *
 * @param instance - naturalized instance that has just been stored
 * @param dataSource - the data source it was stored to, when there is one
 * @returns the imageId of the instance, or undefined when none can be determined
 */
export function registerStoredInstanceImageId(instance, dataSource?): string | undefined {
  if (!instance) {
    return undefined;
  }

  if (instance.imageId) {
    return instance.imageId;
  }

  let imageId: string | undefined;
  try {
    imageId = dataSource?.getImageIdsForInstance?.({ instance });
  } catch (error) {
    OHIF.log.debug('Unable to derive the imageId of a stored instance', error);
  }

  // Instances with pixel data have already been registered with the local
  // wadouri file manager, which puts that imageId on `url` and maps it.
  imageId ||= instance.url;

  if (!imageId || typeof imageId !== 'string') {
    return undefined;
  }

  setNonEnumerableInstanceProperty(instance, 'imageId', imageId);

  const { StudyInstanceUID, SeriesInstanceUID } = instance;
  const SOPInstanceUID = instance.SOPInstanceUID || instance.SopInstanceUID;

  if (StudyInstanceUID && SeriesInstanceUID && SOPInstanceUID) {
    metadataProvider.addImageIdToUIDs(imageId, {
      StudyInstanceUID,
      SeriesInstanceUID,
      SOPInstanceUID,
    });
  }

  return imageId;
}

export function registerStoredInstanceImageIds(instances, dataSource?): void {
  const list = Array.isArray(instances) ? instances : [instances];
  list.forEach(instance => registerStoredInstanceImageId(instance, dataSource));
}
