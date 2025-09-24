import ImageSet from '@ohif/core/src/classes/ImageSet';
import { DisplaySetMessage, DisplaySetMessageList } from '@ohif/core';
/**
 * Default handler for a instance list with an unsupported sopClassUID
 */
export default function getDisplaySetsFromUnsupportedSeries(instances) {
  const imageSet = new ImageSet(instances);
  const messages = new DisplaySetMessageList();
  const instance = instances[0];

  if (!instances.length) {
    messages.addMessage(DisplaySetMessage.CODES.NO_VALID_INSTANCES);
  } else {
    const sopClassUid = instance.SOPClassUID;
    if (sopClassUid) {
      messages.addMessage(DisplaySetMessage.CODES.UNSUPPORTED_SOP_CLASS_UID, {
        sopClassUid,
      });
    } else {
      messages.addMessage(DisplaySetMessage.CODES.MISSING_SOP_CLASS_UID);
    }
  }

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
