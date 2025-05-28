import sortInstancesByPosition from '@ohif/core/src/utils/sortInstancesByPosition';
import { constructableModalities } from '@ohif/core/src/utils/isDisplaySetReconstructable';
import { DisplaySetMessage, DisplaySetMessageList } from '@ohif/core';
import checkMultiFrame from './utils/validations/checkMultiframe';
import checkSingleFrames from './utils/validations/checkSingleFrames';
/**
 * Checks if a series is reconstructable to a 3D volume.
 *
 * @param {Object[]} instances An array of `OHIFInstanceMetadata` objects.
 */
export default function getDisplaySetMessages(
  instances: Array<any>,
  isReconstructable: boolean,
  isDynamicVolume: boolean
): DisplaySetMessageList {
  const messages = new DisplaySetMessageList();

  if (isDynamicVolume) {
    return messages;
  }

  if (!instances.length) {
    messages.addMessage(DisplaySetMessage.CODES.NO_VALID_INSTANCES);
    return;
  }

  const firstInstance = instances[0];
  const { Modality, ImageType, NumberOfFrames, modality } = firstInstance;
  // Due to current requirements, LOCALIZER series doesn't have any messages
  console.log('XNAT SOP DEBUG: ImageType:', ImageType);
  if (ImageType?.includes('LOCALIZER')) {
    return messages;
  }
  console.log('XNAT SOP DEBUG: Modality:', Modality);
  if (!constructableModalities.includes(Modality)) {
    return messages;
  }
  console.log('XNAT SOP DEBUG: NumberOfFrames:', NumberOfFrames);
  console.log('XNAT SOP DEBUG: instances:', instances);
  console.log('modality', modality);
  const isMultiframe = NumberOfFrames > 1;
  console.log('XNAT SOP DEBUG: isMultiframe:', isMultiframe);
  // Can't reconstruct if all instances don't have the ImagePositionPatient.
  if (!isMultiframe && !instances.every(instance => instance.ImagePositionPatient)) {
    messages.addMessage(DisplaySetMessage.CODES.NO_POSITION_INFORMATION);
  }

  const sortedInstances = sortInstancesByPosition(instances);

  isMultiframe
    ? checkMultiFrame(sortedInstances[0], messages)
    : checkSingleFrames(sortedInstances, messages);

  if (!isReconstructable) {
    messages.addMessage(DisplaySetMessage.CODES.NOT_RECONSTRUCTABLE);
  }
  return messages;
}
