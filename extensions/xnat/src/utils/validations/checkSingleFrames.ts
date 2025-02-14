import areAllImageDimensionsEqual from './areAllImageDimensionsEqual';
import areAllImageComponentsEqual from './areAllImageComponentsEqual';
import areAllImageOrientationsEqual from './areAllImageOrientationsEqual';
import areAllImagePositionsEqual from './areAllImagePositionsEqual';
import areAllImageSpacingEqual from './areAllImageSpacingEqual';
import { DisplaySetMessage, DisplaySetMessageList } from '@ohif/core';

/**
 * Runs various checks in a single frame series
 * @param {*} instances
 * @param {*} warnings
 */
export default function checkSingleFrames(
  instances: Array<any>,
  messages: DisplaySetMessageList
): void {
  if (instances.length > 2) {
    if (!areAllImageDimensionsEqual(instances)) {
      messages.addMessage(DisplaySetMessage.CODES.INCONSISTENT_DIMENSIONS);
    }

    if (!areAllImageComponentsEqual(instances)) {
      messages.addMessage(DisplaySetMessage.CODES.INCONSISTENT_COMPONENTS);
    }

    if (!areAllImageOrientationsEqual(instances)) {
      messages.addMessage(DisplaySetMessage.CODES.INCONSISTENT_ORIENTATIONS);
    }

    if (!areAllImagePositionsEqual(instances)) {
      messages.addMessage(DisplaySetMessage.CODES.INCONSISTENT_POSITION_INFORMATION);
    }
    areAllImageSpacingEqual(instances, messages);
  }
}
