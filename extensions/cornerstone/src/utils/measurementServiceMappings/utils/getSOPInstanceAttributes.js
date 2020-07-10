import cornerstone from 'cornerstone-core';
import { classes } from '@ohif/core';

const { MetadataProvider } = classes;

export default function getSOPInstanceAttributes(element) {
  const enabledElement = cornerstone.getEnabledElement(element);
  const imageId = enabledElement.image.imageId;
  const instance = cornerstone.metaData.get('instance', imageId);

  debugger;
  const FrameNumber = MetadataProvider.getFrameNumberFromImageId(imageId) || 1;

  return {
    SOPInstanceUID: instance.SOPInstanceUID,
    FrameOfReferenceUID: instance.FrameOfReferenceUID,
    SeriesInstanceUID: instance.SeriesInstanceUID,
    StudyInstanceUID: instance.StudyInstanceUID,
    FrameNumber,
  };
}
