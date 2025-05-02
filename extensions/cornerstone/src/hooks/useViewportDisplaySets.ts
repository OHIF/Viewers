import { useMemo } from 'react';
import { useSystem } from '@ohif/core';
import {
  getEnhancedDisplaySets,
  sortByOverlayable,
  DERIVED_OVERLAY_MODALITIES,
} from '../components/ViewportDataOverlaySettingMenu/utils';

const LOW_PRIORITY_MODALITIES = ['SR', 'SEG', 'RTSTRUCT'];

const sortByPriority = (a, b) => {
  if (LOW_PRIORITY_MODALITIES.includes(a.Modality)) {
    return 1;
  }
  return -1;
};

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
    // This should be done as an && operation rather than multiple filters
    return viewportDisplaySets.filter(
      ds =>
        !DERIVED_OVERLAY_MODALITIES.includes(ds.Modality) &&
        ds.displaySetInstanceUID !== backgroundDisplaySet.displaySetInstanceUID
    );
  }, [viewportDisplaySets, backgroundDisplaySet]);

  const foregroundDisplaySetUIDs = foregroundDisplaySets.map(ds => ds.displaySetInstanceUID);

  const potentialOverlayDisplaySets = useMemo(() => {
    return enhancedDisplaySets
      .filter(
        ds =>
          DERIVED_OVERLAY_MODALITIES.includes(ds.Modality) &&
          !overlayDisplaySetUIDs.includes(ds.displaySetInstanceUID) &&
          ds.isOverlayable
      )
      .sort(sortByOverlayable);
  }, [enhancedDisplaySets, overlayDisplaySetUIDs]);

  const potentialForegroundDisplaySets = useMemo(() => {
    return enhancedDisplaySets
      .filter(
        ds =>
          !DERIVED_OVERLAY_MODALITIES.includes(ds.Modality) &&
          !foregroundDisplaySetUIDs.includes(ds.displaySetInstanceUID) &&
          ds.isOverlayable
      )
      .sort(sortByPriority);
  }, [enhancedDisplaySets, foregroundDisplaySetUIDs]);

  // Get potential background display sets
  const potentialBackgroundDisplaySets = useMemo(() => {
    return allDisplaySets
      .filter(
        ds =>
          !DERIVED_OVERLAY_MODALITIES.includes(ds.Modality) &&
          ds.displaySetInstanceUID !== backgroundDisplaySet.displaySetInstanceUID &&
          !overlayDisplaySetUIDs.includes(ds.displaySetInstanceUID) &&
          !foregroundDisplaySetUIDs.includes(ds.displaySetInstanceUID)
      )
      .sort(sortByPriority);
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
