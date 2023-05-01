import { utilities } from '@cornerstonejs/tools';

function initCineService(cineService) {
  const playClip = (element, playClipOptions) => {
    return utilities.cine.playClip(element, playClipOptions);
  };

  const stopClip = element => {
    return utilities.cine.stopClip(element);
  };

  cineService.setServiceImplementation({ playClip, stopClip });
}

export default initCineService;
