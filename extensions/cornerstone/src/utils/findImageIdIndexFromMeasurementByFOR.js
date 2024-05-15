import { metaData } from '@cornerstonejs/core';

/**
 * Finds the index of the image ID from the given array of image IDs based on the measurement data.
 * @param {string[]} imageIds - The array of image IDs.
 * @param {object} measurement - The measurement object.
 * @returns {number} - The index of the image ID, or -1 if not found.
 */
const findImageIdIndexFromMeasurementByFOR = (imageIds, measurement) => {
  let imageIdIndex = -1;
  measurement.metadata.coords.forEach(coord => {
    for (let i = 0; i < imageIds.length; ++i) {
      const imageMetadata = metaData.get('instance', imageIds[i]);
      if (imageMetadata.FrameOfReferenceUID !== coord.ReferencedFrameOfReferenceSequence) {
        continue;
      }

      const sliceNormal = [0, 0, 0];
      const orientation = imageMetadata.ImageOrientationPatient;
      sliceNormal[0] = orientation[1] * orientation[5] - orientation[2] * orientation[4];
      sliceNormal[1] = orientation[2] * orientation[3] - orientation[0] * orientation[5];
      sliceNormal[2] = orientation[0] * orientation[4] - orientation[1] * orientation[3];

      let distanceAlongNormal = 0;
      for (let j = 0; j < 3; ++j) {
        distanceAlongNormal += sliceNormal[j] * imageMetadata.ImagePositionPatient[j];
      }

      /** Assuming 2 mm tolerance */
      if (Math.abs(distanceAlongNormal - coord.GraphicData[2]) > 2) {
        continue;
      } else {
        coord.ReferencedSOPSequence = {
          ReferencedSOPClassUID: imageMetadata.SOPClassUID,
          ReferencedSOPInstanceUID: imageMetadata.SOPInstanceUID,
        };
        imageIdIndex = i;
        i = imageIds.length;
      }
    }
  });
  return imageIdIndex;
};

export default findImageIdIndexFromMeasurementByFOR;
