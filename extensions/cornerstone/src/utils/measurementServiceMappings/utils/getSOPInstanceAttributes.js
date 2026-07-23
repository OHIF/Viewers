import * as cornerstone from '@cornerstonejs/core';

function getDisplaySet({ metadata, displaySetService }) {
  const { volumeId } = metadata;

  if( volumeId ) {
    const displaySet = displaySetService.getDisplaySetsBy(displaySet =>
      volumeId.includes(displaySet.uid)
    )[0];
    if( displaySet ) {
      return displaySet;
    }
    console.warn("Unable to find volumeId", volumeId);
    metadata.volumeId = null;
  }

  if (!metadata.FrameOfReferenceUID) {
      throw new Error(
        'No volumeId and no FrameOfReferenceUID provided. Could not find matching displaySet.'
      );
    }
    const displaySet = Array.from(displaySetService.getDisplaySetCache().values()).find(
      ds => ds.instance?.FrameOfReferenceUID === metadata.FrameOfReferenceUID
    );

    if (!displaySet) {
      throw new Error('Could not find matching displaySet for the provided FrameOfReferenceUID.');
    }

    return displaySet;

}

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
  const displaySet = getDisplaySet({ metadata, displaySetService });
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
