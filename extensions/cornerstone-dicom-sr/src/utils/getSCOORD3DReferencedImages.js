import getClosestInstanceInfoRelativeToPoint from './getClosestInstanceInfoRelativeToPoint';

/**
 * Converts a value to an array.
 *
 * @param {*} x - The value to convert.
 * @returns {Array} - The converted array.
 */
function toArray(x) {
  return Array.isArray(x) ? x : [x];
}

/**
 * Retrieves the referenced images from a measurement group.
 *
 * @param {Object} ContentSequence - The measurement ContentSequence.
 * @param {Array} displaySets - The array of display sets.
 * @returns {Array} - The array of referenced images.
 */
export function getSCOORD3DReferencedImages(ContentSequence, displaySets) {
  const referencedImages = [];
  const measurementGroupContentSequence = toArray(ContentSequence);
  const SCOORD3DContentItems = measurementGroupContentSequence.filter(
    group => group.ValueType === 'SCOORD3D'
  );
  const NUMContentItems = measurementGroupContentSequence.filter(
    group => group.ValueType === 'NUM'
  );

  if (!NUMContentItems.length) {
    if (SCOORD3DContentItems.length) {
      const frameOfReference = SCOORD3DContentItems[0].ReferencedFrameOfReferenceUID;
      const closestInstanceInfos = getClosestInstanceInfoRelativeToPoint(
        SCOORD3DContentItems[0].GraphicData,
        frameOfReference,
        displaySets
      );

      for (let i = 0; i < closestInstanceInfos.length; i++) {
        const closestInstanceInfo = closestInstanceInfos[i];
        const SOPClassUID = closestInstanceInfo.instance.SOPClassUID;
        const SOPInstanceUID = closestInstanceInfo.instance.SOPInstanceUID;
        referencedImages.push({
          ReferencedSOPClassUID: SOPClassUID,
          ReferencedSOPInstanceUID: SOPInstanceUID,
        });
      }
    }
  }

  return referencedImages;
}

export default getSCOORD3DReferencedImages;
