import checkSeriesDimensions from './checkSeriesDimensions';
import checkSeriesComponents from './checkSeriesComponents';
import checkSeriesOrientation from './checkSeriesOrientation';
import checkSeriesPositionShift from './checkSeriesPositionShit';
import checkSeriesSpacing from './checkSeriesSpacing';
import { DisplaySetMessage, DisplaySetMessageList } from '@ohif/core';

/**
 * Runs various checks in a single frame series
 * @param {*} instances
 * @param {*} warnings
 */
export default function checkSingleFrames(
  instances,
  messages: DisplaySetMessageList
): void {
  if (instances.length > 2) {
    if (!checkSeriesDimensions(instances)) {
      messages.addMessage(DisplaySetMessage.CODES.INCONSISTENT_DIMENSIONS);
    }

    if (!checkSeriesComponents(instances)) {
      messages.addMessage(DisplaySetMessage.CODES.INCONSISTENT_COMPONENTS);
    }

    if (!checkSeriesOrientation(instances)) {
      messages.addMessage(DisplaySetMessage.CODES.INCONSISTENT_ORIENTATIONS);
    }

    if (!checkSeriesPositionShift(instances)) {
      messages.addMessage(
        DisplaySetMessage.CODES.INCONSISTENT_POSITION_INFORMATION
      );
    }
    checkSeriesSpacing(instances, messages);
  }
}
