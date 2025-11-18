import type { Types as CoreTypes } from '@cornerstonejs/core';

type SyncParams = {
  worldPosition?: CoreTypes.Point3;
  FrameOfReferenceUID?: string;
  referencedImageId?: string;
  displaySetInstanceUID?: string;
  cornerstoneViewportService: AppTypes.Services['cornerstoneViewportService'];
};

/**
 * Finds viewport IDs that display the same Frame of Reference or display set.
 */
function getRelevantViewportIds({
  FrameOfReferenceUID,
  displaySetInstanceUID,
  cornerstoneViewportService,
}: {
  FrameOfReferenceUID?: string;
  displaySetInstanceUID?: string;
  cornerstoneViewportService: AppTypes.Services['cornerstoneViewportService'];
}): string[] {
  const relevantViewports: string[] = [];
  const allViewportIds = Array.from(cornerstoneViewportService.viewportsById.keys());

  allViewportIds.forEach(viewportId => {
    const cornerstoneViewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
    let matchesFoR = false;

    try {
      const viewportFoR = cornerstoneViewport?.getFrameOfReferenceUID?.();
      matchesFoR = Boolean(FrameOfReferenceUID && viewportFoR === FrameOfReferenceUID);
    } catch (_) {
      matchesFoR = false;
    }

    if (!matchesFoR && displaySetInstanceUID) {
      const viewportDisplaySets = cornerstoneViewportService.getViewportDisplaySets(
        viewportId
      ) as any[];
      matchesFoR = Boolean(
        viewportDisplaySets?.some(ds => {
          const frameUID = ds?.FrameOfReferenceUID;
          const dsUID = ds?.displaySetInstanceUID;
          return (
            (FrameOfReferenceUID && frameUID === FrameOfReferenceUID) ||
            (displaySetInstanceUID && dsUID === displaySetInstanceUID)
          );
        })
      );
    }

    if (matchesFoR) {
      relevantViewports.push(viewportId);
    }
  });

  return relevantViewports;
}

/**
 * Synchronizes all relevant viewports to the provided CustomProbe position.
 * Returns the list of viewportIds that were updated so callers can perform
 * additional work if necessary (e.g. selection).
 */
export function syncCustomProbeViewports({
  worldPosition,
  FrameOfReferenceUID,
  referencedImageId,
  displaySetInstanceUID,
  cornerstoneViewportService,
}: SyncParams): string[] {
  if (!worldPosition || !FrameOfReferenceUID) {
    return [];
  }

  const relevantViewportIds = getRelevantViewportIds({
    FrameOfReferenceUID,
    displaySetInstanceUID,
    cornerstoneViewportService,
  });

  relevantViewportIds.forEach(viewportId => {
    try {
      const cornerstoneViewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);
      if (!cornerstoneViewport) {
        return;
      }

      if ('jumpToWorld' in cornerstoneViewport && typeof cornerstoneViewport.jumpToWorld === 'function') {
        cornerstoneViewport.jumpToWorld(worldPosition);
      } else if (referencedImageId && 'setViewReference' in cornerstoneViewport) {
        cornerstoneViewport.setViewReference({
          referencedImageId,
        });
      }

      cornerstoneViewport.render?.();
    } catch (e) {
      console.warn(`Unable to sync CustomProbe for viewport ${viewportId}:`, e);
    }
  });

  return relevantViewportIds;
}

export { getRelevantViewportIds };
