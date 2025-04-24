import { useMemo } from 'react';
import { useSystem } from '@ohif/core';
import { getEnhancedDisplaySets, sortByOverlayable, DERIVED_OVERLAY_MODALITIES } from './utils';

/**
 * Hook to provide all the display sets and overlay information for a viewport
 */
export function useViewportDisplaySets(viewportId) {
  const { servicesManager } = useSystem();
  const { displaySetService, viewportGridService, segmentationService } = servicesManager.services;

  // Get all available display sets
  const allDisplaySets = displaySetService.getActiveDisplaySets();

  // Get all available segmentations
  const segmentationRepresentations =
    segmentationService.getSegmentationRepresentations(viewportId);

  const overlayDisplaySets = segmentationRepresentations.map(repr => {
    const displaySet = displaySetService.getDisplaySetByUID(repr.segmentationId);
    return displaySet;
  });

  const overlayDisplaySetUIDs = overlayDisplaySets.map(ds => ds.displaySetInstanceUID);

  // Get display sets that can be used as overlays
  const { viewportDisplaySets, enhancedDisplaySets } = getEnhancedDisplaySets({
    viewportId,
    services: { displaySetService, viewportGridService },
  });

  const backgroundDisplaySet = viewportDisplaySets[0];

  const foregroundDisplaySets = useMemo(() => {
    // all the background display sets except the first one and except the derived overlay display sets
    return viewportDisplaySets
      .filter(ds => !DERIVED_OVERLAY_MODALITIES.includes(ds.Modality))
      .filter(ds => ds.displaySetInstanceUID !== backgroundDisplaySet.displaySetInstanceUID);
  }, [viewportDisplaySets, backgroundDisplaySet]);

  const foregroundDisplaySetUIDs = foregroundDisplaySets.map(ds => ds.displaySetInstanceUID);

  const potentialOverlayDisplaySets = useMemo(() => {
    // all the derived overlay display sets except the ones that are already in the overlayDisplaySets
    return enhancedDisplaySets
      .filter(ds => DERIVED_OVERLAY_MODALITIES.includes(ds.Modality))
      .filter(ds => !overlayDisplaySetUIDs.includes(ds.displaySetInstanceUID))
      .sort(sortByOverlayable);
  }, [enhancedDisplaySets, overlayDisplaySetUIDs]);

  const potentialForegroundDisplaySets = useMemo(() => {
    // all the non-derived overlay display sets except the ones that are already in the overlayDisplaySets
    return enhancedDisplaySets
      .filter(ds => !DERIVED_OVERLAY_MODALITIES.includes(ds.Modality))
      .filter(ds => !foregroundDisplaySetUIDs.includes(ds.displaySetInstanceUID));
  }, [enhancedDisplaySets, foregroundDisplaySetUIDs]);

  // Get potential background display sets
  const potentialBackgroundDisplaySets = useMemo(() => {
    return allDisplaySets.filter(
      ds =>
        !DERIVED_OVERLAY_MODALITIES.includes(ds.Modality) &&
        ds.displaySetInstanceUID !== backgroundDisplaySet.displaySetInstanceUID &&
        !overlayDisplaySetUIDs.includes(ds.displaySetInstanceUID) &&
        !foregroundDisplaySetUIDs.includes(ds.displaySetInstanceUID)
    );
  }, [allDisplaySets, backgroundDisplaySet, overlayDisplaySetUIDs, foregroundDisplaySetUIDs]);

  return {
    backgroundDisplaySet,
    foregroundDisplaySets,
    overlayDisplaySets,
    potentialOverlayDisplaySets,
    potentialForegroundDisplaySets,
    potentialBackgroundDisplaySets,
  };
}
