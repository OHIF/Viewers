import cornerstone from 'cornerstone-core';

export default function getSOPInstanceAttributes(element) {
  const enabledElement = cornerstone.getEnabledElement(element);
  const imageId = enabledElement.image.imageId;
  const instance = cornerstone.metaData.get('instance', imageId);

  return {
    SOPInstanceUID: instance.SOPInstanceUID,
    FrameOfReferenceUID: instance.FrameOfReferenceUID,
    SeriesInstanceUID: instance.SeriesInstanceUID,
    StudyInstanceUID: instance.StudyInstanceUID,
  };
}
