import { cache, imageLoader } from '@cornerstonejs/core';
import type { Types as cstTypes } from '@cornerstonejs/tools';

/**
 * Loads the referenced source images of a labelmap that are not in the cache.
 * generateSegmentation needs all of them, and a user can save or download a
 * SEG before the series has fully loaded.
 */
export async function loadReferencedImages(
  labelmapData?: cstTypes.LabelmapSegmentationData
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

  await Promise.all(
    [...referencedImageIds]
      .filter(imageId => imageId && !cache.getImage(imageId))
      .map(imageId => imageLoader.loadAndCacheImage(imageId))
  );
}
