import { log, Types } from '@ohif/core';
import { EVENTS } from '@cornerstonejs/core';

const { TimingEnum } = Types;

const IMAGE_TIMING_KEYS = [
  TimingEnum.DISPLAY_SETS_TO_ALL_IMAGES,
  TimingEnum.DISPLAY_SETS_TO_FIRST_IMAGE,
  TimingEnum.STUDY_TO_FIRST_IMAGE,
];

const imageTiming = {
  viewportsWaiting: 0,
};

/**
 * Defines the initial view timing reporting.
 * This allows knowing how many viewports are waiting for initial views and
 * when the IMAGE_RENDERED gets sent out.
 * The first image rendered will fire the FIRST_IMAGE timeEnd logs, while
 * the last of the enabled viewport will fire the ALL_IMAGES timeEnd logs.
 *
 */

export default function initViewTiming({ element }) {
  if (!IMAGE_TIMING_KEYS.find(key => log.timingKeys[key])) {
    return;
  }
  imageTiming.viewportsWaiting += 1;
  element.addEventListener(EVENTS.IMAGE_RENDERED, imageRenderedListener);
}

function imageRenderedListener(evt) {
  if (evt.detail.viewportStatus === 'preRender') {
    return;
  }
  log.timeEnd(TimingEnum.DISPLAY_SETS_TO_FIRST_IMAGE);
  log.timeEnd(TimingEnum.STUDY_TO_FIRST_IMAGE);
  log.timeEnd(TimingEnum.SCRIPT_TO_VIEW);
  imageTiming.viewportsWaiting -= 1;
  evt.detail.element.removeEventListener(EVENTS.IMAGE_RENDERED, imageRenderedListener);
  if (!imageTiming.viewportsWaiting) {
    log.timeEnd(TimingEnum.DISPLAY_SETS_TO_ALL_IMAGES);
  }
}
