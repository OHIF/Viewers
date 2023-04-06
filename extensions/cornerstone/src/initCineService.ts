import { cache } from '@cornerstonejs/core';
import { utilities } from '@cornerstonejs/tools';

// function _getSyncedViewports(servicesManager, srcViewportIndex) {
//   const syncedViewports = [];

//   const {
//     viewportGridService,
//     cornerstoneViewportService,
//   } = servicesManager.services;

//   const { viewports: viewportsStates } = viewportGridService.getState();
//   const srcViewportState = viewportsStates.find(
//     ({ viewportIndex }) => viewportIndex === srcViewportIndex
//   );

//   if (srcViewportState.viewportOptions.viewportType !== 'volume') {
//     return syncedViewports;
//   }

//   const srcViewport = cornerstoneViewportService.getCornerstoneViewportByIndex(
//     srcViewportIndex
//   );
//   const { uid: srcVolumeId } = srcViewport.getDefaultActor();
//   const srcVolume = cache.getVolume(srcVolumeId);

//   if (!srcVolume.isDynamicVolume()) {
//     return syncedViewports;
//   }

//   viewportsStates.forEach(({ viewportIndex }) => {
//     const viewport = cornerstoneViewportService.getCornerstoneViewportByIndex(
//       srcViewportIndex
//     );

//     if (
//       viewportIndex !== srcViewportIndex &&
//       viewport.hasVolumeId(srcVolumeId)
//     ) {
//       syncedViewports.push({ viewportIndex });
//     }
//   });

//   return syncedViewports;
// }

function initCineService(servicesManager) {
  const { cineService } = servicesManager.services;

  // const getSyncedViewports = viewportIndex => {
  //   return _getSyncedViewports(servicesManager, viewportIndex);
  // };

  const playClip = (element, playClipOptions) => {
    return utilities.cine.playClip(element, playClipOptions);
  };

  const stopClip = element => {
    return utilities.cine.stopClip(element);
  };

  cineService.setServiceImplementation({
    // getSyncedViewports,
    playClip,
    stopClip,
  });
}

export default initCineService;
