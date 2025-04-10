import ImageSet from '@ohif/core/src/classes/ImageSet';
import { DisplaySetMessage, DisplaySetMessageList } from '@ohif/core';
/**
 * Default handler for a instance list with an unsupported sopClassUID
 */
export default function getDisplaySetsFromUnsupportedSeries(instances) {
  const imageSet = new ImageSet(instances);
  const messages = new DisplaySetMessageList();
  messages.addMessage(DisplaySetMessage.CODES.UNSUPPORTED_DISPLAYSET);
  const instance = instances[0];

  imageSet.setAttributes({
    displaySetInstanceUID: imageSet.uid, // create a local alias for the imageSet UID
    SeriesDate: instance.SeriesDate,
    SeriesTime: instance.SeriesTime,
    SeriesInstanceUID: instance.SeriesInstanceUID,
    StudyInstanceUID: instance.StudyInstanceUID,
    SeriesNumber: instance.SeriesNumber || 0,
    FrameRate: instance.FrameTime,
    SOPClassUID: instance.SOPClassUID,
    SeriesDescription: instance.SeriesDescription || '',
    Modality: instance.Modality,
    numImageFrames: instances.length,
    unsupported: true,
    SOPClassHandlerId: 'unsupported',
    isReconstructable: false,
    messages,
  });
  return [imageSet];
}
