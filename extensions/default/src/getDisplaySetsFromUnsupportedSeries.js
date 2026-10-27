import ImageSet from '@ohif/core/src/classes/ImageSet';
import { DisplaySetMessage, DisplaySetMessageList } from '@ohif/core';

/** The message that names why the instances are not supported. */
function getUnsupportedMessages(instances) {
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
  return messages;
}

/** The fields of an unsupported display set, other than its identity. */
const getUnsupportedFields = instances => ({
  unsupported: true,
  SOPClassHandlerId: 'unsupported',
  isReconstructable: false,
  messages: getUnsupportedMessages(instances),
});

/**
 * Adds the unsupported fields to a display set that a split rule with the
 * `unsupported` handler made, or that names a handler the mode does not have.
 */
export function extendUnsupportedDisplaySet(displaySet) {
  Object.assign(displaySet, getUnsupportedFields(displaySet.instances));
}

/**
 * Default handler for a instance list with an unsupported sopClassUID
 */
export default function getDisplaySetsFromUnsupportedSeries(instances) {
  const imageSet = new ImageSet(instances);
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
    instances,
    instance: instances[instance.length - 1],
    ...getUnsupportedFields(instances),
  });
  return [imageSet];
}
