import cornerstone from 'cornerstone-core';

/**
 * Extracts the seriesInstanceUid from an image, given the imageId.
 *
 * @param {String} imageId The ID of the image being queried.
 */
export default function getSeriesInstanceUidFromImageId(imageId) {
  const generalSeriesModule = cornerstone.metaData.get(
    'generalSeriesModule',
    imageId
  );

  return generalSeriesModule.seriesInstanceUID;
}
