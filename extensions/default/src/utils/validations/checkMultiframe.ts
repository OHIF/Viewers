import {
  hasPixelMeasurements,
  hasOrientation,
  hasPosition,
} from '@ohif/core/src/utils/isDisplaySetReconstructable';
import { DisplaySetMessage, DisplaySetMessageList } from '@ohif/core';

/**
 * Check various multi frame issues. It calls OHIF core functions
 * @param {*} multiFrameInstance
 * @param {*} warnings
 */
export default function checkMultiFrame(multiFrameInstance, messages: DisplaySetMessageList): void {
  if (!hasPixelMeasurements(multiFrameInstance)) {
    messages.addMessage(DisplaySetMessage.CODES.MULTIFRAME_NO_PIXEL_MEASUREMENTS);
  }

  if (!hasOrientation(multiFrameInstance)) {
    messages.addMessage(DisplaySetMessage.CODES.MULTIFRAME_NO_ORIENTATION);
  }

  if (!hasPosition(multiFrameInstance)) {
    messages.addMessage(DisplaySetMessage.CODES.MULTIFRAME_NO_POSITION_INFORMATION);
  }
}
