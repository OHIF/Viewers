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
export default function validateInstances(
  instances: Array<any>,
  isReconstructable: boolean
): DisplaySetMessageList {
  const messages = new DisplaySetMessageList();
  if (!instances.length) {
    messages.addMessage(DisplaySetMessage.CODES.NO_VALID_INSTANCES);
  }

  const firstInstance = instances[0];
  if (firstInstance.ImageType.includes('LOCALIZER')) {
    return messages;
  }

  const isMultiframe = firstInstance.NumberOfFrames > 1;
  const Modality = firstInstance.Modality;
  if (!constructableModalities.includes(Modality)) {
    return messages;
  }

  // Can't reconstruct if all instances don't have the ImagePositionPatient.
  if (
    !isMultiframe &&
    !instances.every(instance => instance.ImagePositionPatient)
  ) {
    messages.addMessage(DisplaySetMessage.CODES.NO_POSITION_INFORMATION);
  }

  const sortedInstances = sortInstancesByPosition(instances);

  if (isMultiframe) {
    checkMultiFrame(sortedInstances[0], messages);
  } else {
    checkSingleFrames(sortedInstances, messages);
  }

  if (!isReconstructable) {
    messages.addMessage(DisplaySetMessage.CODES.NOT_RECONSTRUCTABLE);
  }
  return messages;
}
