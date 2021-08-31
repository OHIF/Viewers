import cornerstone from 'cornerstone-core';

export default function(element) {
  // Get the Cornerstone imageId
  const enabledElement = cornerstone.getEnabledElement(element);
  const imageId = enabledElement.image.imageId;

  // Get StudyInstanceUID & PatientID
  const {
    StudyInstanceUID,
    PatientID,
    SeriesInstanceUID,
    SOPInstanceUID,
  } = cornerstone.metaData.get('instance', imageId);

  const splitImageId = imageId.split('&frame');
  const frameIndex =
    splitImageId[1] !== undefined ? Number(splitImageId[1]) : 0;

  const imagePath = [
    StudyInstanceUID,
    SeriesInstanceUID,
    SOPInstanceUID,
    frameIndex,
  ].join('_');

  return {
    PatientID,
    StudyInstanceUID,
    SeriesInstanceUID,
    SOPInstanceUID,
    frameIndex,
    imagePath,
  };
}
