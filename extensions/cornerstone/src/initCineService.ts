import { utilities } from '@cornerstonejs/tools';

function initCineService(CineService) {
  const playClip = (element, playClipOptions) => {
    return utilities.cine.playClip(element, playClipOptions);
  };

  const stopClip = element => {
    return utilities.cine.stopClip(element);
  };

  CineService.setServiceImplementation({ playClip, stopClip });
}

export default initCineService;
