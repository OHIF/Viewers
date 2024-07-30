import * as cornerstone from '@cornerstonejs/core';

/**
 * It checks if the imageId is provided then it uses it to query
 * the metadata and get the SOPInstanceUID, SeriesInstanceUID and StudyInstanceUID.
 * If the imageId is not provided then undefined is returned.
 * @param {string} imageId The image id of the referenced image
 * @returns
 */
export default function getSOPInstanceAttributes(imageId, displaySetService, annotation) {
  if (imageId) {
    return _getUIDFromImageID(imageId);
  }

  const { metadata } = annotation;
  const { volumeId } = metadata;

  const displaySet = displaySetService.getDisplaySetsBy(displaySet =>
    volumeId.includes(displaySet.uid)
  )[0];
  const { StudyInstanceUID, SeriesInstanceUID } = displaySet;

  return {
    SOPInstanceUID: undefined,
    SeriesInstanceUID,
    StudyInstanceUID,
  };
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
