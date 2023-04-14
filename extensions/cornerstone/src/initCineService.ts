import { cache } from '@cornerstonejs/core';
import { utilities } from '@cornerstonejs/tools';

function _getVolumesFromViewport(viewport) {
  return viewport
    ? viewport.getActors().map(actor => cache.getVolume(actor.uid))
    : [];
}

function _getVolumeFromViewport(viewport) {
  const volumes = _getVolumesFromViewport(viewport);
  const dynamicVolume = volumes.find(volume => volume.isDynamicVolume());

  return dynamicVolume ?? volumes[0];
}

/**
 * Return all viewports that needs to be synchronized with the source
 * viewport passed as parameter when cine is updated.
 * @param servicesManager ServiceManager
 * @param srcViewportIndex Source viewport index
 * @returns array with viewport information.
 */
function _getSyncedViewports(servicesManager, srcViewportIndex) {
  const {
    viewportGridService,
    cornerstoneViewportService,
  } = servicesManager.services;

  const { viewports: viewportsStates } = viewportGridService.getState();
  const srcViewportState = viewportsStates.find(
    ({ viewportIndex }) => viewportIndex === srcViewportIndex
  );

  if (srcViewportState?.viewportOptions?.viewportType !== 'volume') {
    return [];
  }

  const srcViewport = cornerstoneViewportService.getCornerstoneViewportByIndex(
    srcViewportIndex
  );

  const srcVolume = srcViewport ? _getVolumeFromViewport(srcViewport) : null;

  if (!srcVolume?.isDynamicVolume()) {
    return [];
  }

  const { volumeId: srcVolumeId } = srcVolume;

  return viewportsStates
    .filter(({ viewportIndex }) => {
      const viewport = cornerstoneViewportService.getCornerstoneViewportByIndex(
        viewportIndex
      );

      return (
        viewportIndex !== srcViewportIndex && viewport?.hasVolumeId(srcVolumeId)
      );
    })
    .map(({ viewportIndex }) => ({ viewportIndex }));
}

function initCineService(servicesManager) {
  const { cineService } = servicesManager.services;

  const getSyncedViewports = viewportIndex => {
    return _getSyncedViewports(servicesManager, viewportIndex);
  };

  const playClip = (element, playClipOptions) => {
    return utilities.cine.playClip(element, playClipOptions);
  };

  const stopClip = element => {
    return utilities.cine.stopClip(element);
  };

  cineService.setServiceImplementation({
    getSyncedViewports,
    playClip,
    stopClip,
  });
}

export default initCineService;
