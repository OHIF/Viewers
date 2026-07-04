import { cache, Types } from '@cornerstonejs/core';
import { utilities } from '@cornerstonejs/tools';

function _getVolumeFromViewport(viewport: Types.IBaseVolumeViewport) {
  // Handle non-volume viewports that don't have getAllVolumeIds
  if (!viewport?.getAllVolumeIds) {
    return null;
  }

  const volumeIds = viewport.getAllVolumeIds();
  const volumes = volumeIds.map(id => cache.getVolume(id)).filter(Boolean);
  const dynamicVolume = volumes.find(volume => volume.isDynamicVolume());

  return dynamicVolume ?? volumes[0] ?? null;
}

/**
 * Return all viewports that needs to be synchronized with the source
 * viewport passed as parameter when cine is updated.
 * @param servicesManager ServiceManager
 * @param srcViewportIndex Source viewport index
 * @returns array with viewport information.
 */
function _getSyncedViewports(servicesManager: AppTypes.ServicesManager, srcViewportId) {
  const { viewportGridService, cornerstoneViewportService } = servicesManager.services;

  const { viewports: viewportsStates } = viewportGridService.getState();

  // Volume-ness is derived from the live cornerstone viewport, not the grid
  // composition's viewportOptions.viewportType: the mount pipeline applies its
  // dynamic-volume 'volume' override on a mount-local copy, so a 4D series
  // mounted into a pane whose composition never said 'volume' would be missed
  // by a grid-state check. Non-volume viewports have no getAllVolumeIds and
  // yield no volume below.
  const srcViewport = cornerstoneViewportService.getCornerstoneViewport(srcViewportId);

  const srcVolume = srcViewport ? _getVolumeFromViewport(srcViewport) : null;

  if (!srcVolume?.isDynamicVolume()) {
    return [];
  }

  const { volumeId: srcVolumeId } = srcVolume;

  return Array.from(viewportsStates.values())
    .filter(({ viewportId }) => {
      const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);

      return viewportId !== srcViewportId && viewport?.hasVolumeId?.(srcVolumeId);
    })
    .map(({ viewportId }) => ({ viewportId }));
}

function initCineService(servicesManager: AppTypes.ServicesManager) {
  const { cineService } = servicesManager.services;

  const getSyncedViewports = viewportId => {
    return _getSyncedViewports(servicesManager, viewportId);
  };

  const playClip = (element, playClipOptions) => {
    return utilities.cine.playClip(element, playClipOptions);
  };

  const stopClip = (element, stopClipOptions) => {
    return utilities.cine.stopClip(element, stopClipOptions);
  };

  cineService.setServiceImplementation({
    getSyncedViewports,
    playClip,
    stopClip,
  });
}

export default initCineService;
