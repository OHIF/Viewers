import { cache, Types } from '@cornerstonejs/core';
import { utilities } from '@cornerstonejs/tools';

function _getVolumeFromViewport(viewport: Types.IBaseVolumeViewport) {
  // Guard for different CS3D versions and non-volume viewports
  let volumeIds: string[] = [];

  try {
    const ids = (viewport as any).getAllVolumeIds?.() ?? (viewport as any).getVolumeIds?.() ?? [];
    volumeIds = Array.isArray(ids) ? ids : [];
  } catch (_) {
    volumeIds = [];
  }

  const volumes = volumeIds
    .map(id => {
      try {
        return cache.getVolume(id);
      } catch (_) {
        return undefined;
      }
    })
    .filter(Boolean) as any[];

  const dynamicVolume = volumes.find(v => v?.isDynamicVolume?.());

  return (dynamicVolume as any) ?? (volumes[0] as any) ?? null;
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
  const srcViewportState = viewportsStates.get(srcViewportId);

  if (srcViewportState?.viewportOptions?.viewportType !== 'volume') {
    return [];
  }

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
