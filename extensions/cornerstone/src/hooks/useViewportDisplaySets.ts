import { useEffect, useMemo, useState } from 'react';
import { useSystem, utils } from '@ohif/core';
import { useViewportGrid } from '@ohif/ui-next';
import {
  getEnhancedDisplaySets,
  sortByOverlayable,
  DERIVED_OVERLAY_MODALITIES,
} from '../components/ViewportDataOverlaySettingMenu/utils';

const sortByPriority = (a, b) => {
  if (utils.isLowPriorityModality(a.Modality)) {
    return 1;
  }
  return -1;
};

/**
 * Options for the useViewportDisplaySets hook
 */
export type UseViewportDisplaySetsOptions = {
  /**
   * Whether to include background display set
   */
  includeBackground?: boolean;
  /**
   * Whether to include foreground display sets
   */
  includeForeground?: boolean;
  /**
   * Whether to include overlay display sets
   */
  includeOverlay?: boolean;
  /**
   * Whether to include potential overlay display sets
   */
  includePotentialOverlay?: boolean;
  /**
   * Whether to include potential foreground display sets
   */
  includePotentialForeground?: boolean;
  /**
   * Whether to include potential background display sets
   */
  includePotentialBackground?: boolean;
};

/**
 * Return type for useViewportDisplaySets
 */
export type ViewportDisplaySets = {
  /**
   * All display sets for the viewport
   */
  allDisplaySets: AppTypes.DisplaySet[];
  /**
   * The viewport display sets for the viewport
   */
  viewportDisplaySets: AppTypes.DisplaySet[];
  /**
   * The primary display set for the viewport (base image)
   */
  backgroundDisplaySet?: AppTypes.DisplaySet;
  /**
   * Display sets currently shown with background (non-overlay layers)
   */
  foregroundDisplaySets?: AppTypes.DisplaySet[];
  /**
   * Segmentation display sets currently applied as overlays
   */
  overlayDisplaySets?: AppTypes.DisplaySet[];
  /**
   * Display sets that could be toggled on as overlays (derived modalities)
   */
  potentialOverlayDisplaySets?: AppTypes.DisplaySet[];
  /**
   * Display sets that could be added as foreground layers
   */
  potentialForegroundDisplaySets?: AppTypes.DisplaySet[];
  /**
   * Display sets that could replace the current background
   */
  potentialBackgroundDisplaySets?: AppTypes.DisplaySet[];
};

/**
 * Hook to provide display sets and overlay information for a viewport based on options.
 *
 * @param viewportId - The viewport ID to get display sets for
 * @param options - Options to control which display sets to compute
 * @returns Object containing requested display set collections based on options
 */
export function useViewportDisplaySets(
  viewportId?: string,
  options?: UseViewportDisplaySetsOptions
): ViewportDisplaySets {
  const { servicesManager } = useSystem();
  const { displaySetService, segmentationService } = servicesManager.services;

  // Note: this is very important we should use the useViewportGrid hook here,
  // since if the viewport displaySet is changed we should re-run this hook
  // to get the latest displaySets
  const [viewportGridState, viewportGridService] = useViewportGrid();

  const viewportIdToUse = viewportId || viewportGridState.activeViewportId;

  // Apply defaults - include everything if no options specified
  const {
    includeBackground = true,
    includeForeground = true,
    includeOverlay = true,
    includePotentialOverlay = true,
    includePotentialForeground = true,
    includePotentialBackground = true,
  } = options || {};

  // Get all available display sets (only if needed)
  const needsAllDisplaySets = includePotentialBackground;
  const allDisplaySets = useMemo(
    () => (needsAllDisplaySets ? displaySetService.getActiveDisplaySets() : []),
    [displaySetService, needsAllDisplaySets]
  );

  // Get all available segmentations (only if needed)
  const needsSegmentations = includeOverlay;

  const [segmentationRepresentations, setSegmentationRepresentations] = useState(
    needsSegmentations ? segmentationService.getSegmentationRepresentations(viewportIdToUse) : []
  );

  useEffect(() => {
    setSegmentationRepresentations(
      needsSegmentations ? segmentationService.getSegmentationRepresentations(viewportIdToUse) : []
    );

    const unsubscribeArr = needsSegmentations
      ? [
          segmentationService.EVENTS.SEGMENTATION_REPRESENTATION_MODIFIED,
          segmentationService.EVENTS.SEGMENTATION_REPRESENTATION_REMOVED,
        ].map(event =>
          segmentationService.subscribe(event, () => {
            setSegmentationRepresentations(
              segmentationService.getSegmentationRepresentations(viewportIdToUse)
            );
          })
        )
      : [];

    return () => {
      unsubscribeArr.forEach(item => item.unsubscribe());
    };
  }, [segmentationService, viewportIdToUse, needsSegmentations]);

  const overlayDisplaySets = useMemo(() => {
    if (!includeOverlay) {
      return [];
    }
    return segmentationRepresentations.map(repr => {
      const displaySet = displaySetService.getDisplaySetByUID(repr.segmentationId);
      return displaySet;
    });
  }, [includeOverlay, segmentationRepresentations, displaySetService]);

  const overlayDisplaySetUIDs = useMemo(() => {
    return overlayDisplaySets.map(ds => ds.displaySetInstanceUID);
  }, [overlayDisplaySets]);

  // Get enhanced display sets (only if needed)
  const needsEnhancedDisplaySets =
    includeBackground || includeForeground || includePotentialOverlay || includePotentialForeground;

  const { viewportDisplaySets = [], enhancedDisplaySets = [] } = useMemo(() => {
    if (!needsEnhancedDisplaySets) {
      return { viewportDisplaySets: [], enhancedDisplaySets: [] };
    }
    return (
      getEnhancedDisplaySets({
        viewportId: viewportIdToUse,
        services: { displaySetService, viewportGridService },
      }) || { viewportDisplaySets: [], enhancedDisplaySets: [] }
    );
  }, [viewportIdToUse, displaySetService, viewportGridService, needsEnhancedDisplaySets]);

  const backgroundDisplaySet = useMemo(
    () =>
      includeBackground && viewportDisplaySets.length > 0 ? viewportDisplaySets[0] : undefined,
    [includeBackground, viewportDisplaySets]
  );

  const foregroundDisplaySets = useMemo(() => {
    if (!includeForeground || !backgroundDisplaySet) {
      return [];
    }
    return viewportDisplaySets.filter(
      ds =>
        !DERIVED_OVERLAY_MODALITIES.includes(ds.Modality) &&
        ds.displaySetInstanceUID !== backgroundDisplaySet.displaySetInstanceUID
    );
  }, [includeForeground, viewportDisplaySets, backgroundDisplaySet]);

  const foregroundDisplaySetUIDs = useMemo(
    () => foregroundDisplaySets.map(ds => ds.displaySetInstanceUID),
    [foregroundDisplaySets]
  );

  const potentialOverlayDisplaySets = useMemo(() => {
    if (!includePotentialOverlay) {
      return [];
    }
    return enhancedDisplaySets
      .filter(
        ds =>
          DERIVED_OVERLAY_MODALITIES.includes(ds.Modality) &&
          !overlayDisplaySetUIDs.includes(ds.displaySetInstanceUID) &&
          ds.isOverlayable
      )
      .sort(sortByOverlayable);
  }, [includePotentialOverlay, enhancedDisplaySets, overlayDisplaySetUIDs]);

  const potentialForegroundDisplaySets = useMemo(() => {
    if (!includePotentialForeground) {
      return [];
    }
    return enhancedDisplaySets
      .filter(
        ds =>
          !DERIVED_OVERLAY_MODALITIES.includes(ds.Modality) &&
          !foregroundDisplaySetUIDs.includes(ds.displaySetInstanceUID) &&
          ds.isOverlayable
      )
      .sort(sortByPriority);
  }, [includePotentialForeground, enhancedDisplaySets, foregroundDisplaySetUIDs]);

  const potentialBackgroundDisplaySets = useMemo(() => {
    if (!includePotentialBackground || !backgroundDisplaySet) {
      return [];
    }
    return allDisplaySets
      .filter(
        ds =>
          !DERIVED_OVERLAY_MODALITIES.includes(ds.Modality) &&
          ds.displaySetInstanceUID !== backgroundDisplaySet.displaySetInstanceUID &&
          !overlayDisplaySetUIDs.includes(ds.displaySetInstanceUID) &&
          !foregroundDisplaySetUIDs.includes(ds.displaySetInstanceUID)
      )
      .sort(sortByPriority);
  }, [
    includePotentialBackground,
    allDisplaySets,
    backgroundDisplaySet,
    overlayDisplaySetUIDs,
    foregroundDisplaySetUIDs,
  ]);

  const result: ViewportDisplaySets = {
    allDisplaySets: allDisplaySets || [],
    viewportDisplaySets: viewportDisplaySets || [],
  };

  if (includeBackground) {
    result.backgroundDisplaySet = backgroundDisplaySet;
  }

  if (includeForeground) {
    result.foregroundDisplaySets = foregroundDisplaySets;
  }

  if (includeOverlay) {
    result.overlayDisplaySets = overlayDisplaySets;
  }

  if (includePotentialOverlay) {
    result.potentialOverlayDisplaySets = potentialOverlayDisplaySets;
  }

  if (includePotentialForeground) {
    result.potentialForegroundDisplaySets = potentialForegroundDisplaySets;
  }

  if (includePotentialBackground) {
    result.potentialBackgroundDisplaySets = potentialBackgroundDisplaySets;
  }

  return result;
}
