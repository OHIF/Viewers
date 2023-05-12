import * as cornerstone from '@cornerstonejs/core';

/**
 * It checks if the imageId is provided then it uses it to query
 * the metadata and get the SOPInstanceUID, SeriesInstanceUID and StudyInstanceUID.
 * If the imageId is not provided then undefined is returned.
 * @param {string} imageId The image id of the referenced image
 * @returns
 */
export default function getSOPInstanceAttributes(imageId) {
  if (imageId) {
    return _getUIDFromImageID(imageId);
  }

  // Todo: implement for volume viewports and use the referencedSeriesInstanceUID
}

function _getUIDFromImageID(imageId) {
  const instance = cornerstone.metaData.get('instance', imageId);

  return {
    SOPInstanceUID: instance.SOPInstanceUID,
    SeriesInstanceUID: instance.SeriesInstanceUID,
    StudyInstanceUID: instance.StudyInstanceUID,
    frameNumber: instance.frameNumber || 1,
  };
}
