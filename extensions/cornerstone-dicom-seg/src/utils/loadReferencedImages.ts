import { cache, imageLoader } from '@cornerstonejs/core';
import type { Types as cstTypes } from '@cornerstonejs/tools';

/**
 * Loads the referenced source images of a labelmap that are not in the cache.
 * generateSegmentation needs all of them, and a user can save or download a
 * SEG before the series has fully loaded. When images are missing, the
 * optional `uiNotificationService` tells the user that the save waits for them.
 */
export async function loadReferencedImages(
  labelmapData?: cstTypes.LabelmapSegmentationData,
  uiNotificationService?: AppTypes.UINotificationService
): Promise<void> {
  if (!labelmapData) {
    return;
  }
  const layers = Object.values(labelmapData.labelmaps ?? {});
  const segImageIds = [
    ...((labelmapData as { imageIds?: string[] }).imageIds ?? []),
    ...layers.flatMap(layer => layer.imageIds ?? []),
  ];
  const referencedImageIds = new Set([
    ...(labelmapData.referencedImageIds ?? []),
    ...layers.flatMap(layer => layer.referencedImageIds ?? []),
    ...segImageIds.map(imageId => cache.getImage(imageId)?.referencedImageId),
  ]);

  const missingImageIds = [...referencedImageIds].filter(
    imageId => imageId && !cache.getImage(imageId)
  );
  // loadAndCacheImages throws for an empty array.
  if (!missingImageIds.length) {
    return;
  }
  uiNotificationService?.show({
    title: 'DICOM SEG',
    message: `Loading ${missingImageIds.length} source images before the SEG is created.`,
    type: 'info',
  });
  await Promise.all(imageLoader.loadAndCacheImages(missingImageIds));
}
