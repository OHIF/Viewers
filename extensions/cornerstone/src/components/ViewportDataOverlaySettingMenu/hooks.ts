import { useState, useEffect, useMemo } from 'react';
import { useSystem } from '@ohif/core';
import {
  getModalitySettings,
  DEFAULT_OPACITY_PERCENT,
  getEnhancedDisplaySets,
  sortByOverlayable,
  DERIVED_OVERLAY_MODALITIES,
  getAvailableSegmentations,
} from './utils';

/**
 * Hook to provide all the display sets and overlay information for a viewport
 */
export function useViewportDisplaySets(viewportId) {
  const { servicesManager } = useSystem();
  const { displaySetService, viewportGridService, segmentationService } = servicesManager.services;

  // Get all available display sets
  const allDisplaySets = displaySetService.getActiveDisplaySets();

  // Get display sets that can be used as overlays
  const { backgroundDisplaySet, enhancedDisplaySets } = getEnhancedDisplaySets({
    viewportId,
    services: { displaySetService, viewportGridService },
  });

  // Split overlays into derived and non-derived types
  const derivedOverlays = useMemo(() => {
    return enhancedDisplaySets
      .filter(ds => DERIVED_OVERLAY_MODALITIES.includes(ds.Modality))
      .sort(sortByOverlayable);
  }, [enhancedDisplaySets]);

  const nonDerivedOverlays = useMemo(() => {
    return enhancedDisplaySets
      .filter(ds => !DERIVED_OVERLAY_MODALITIES.includes(ds.Modality))
      .sort(sortByOverlayable);
  }, [enhancedDisplaySets]);

  // Get potential background display sets
  const potentialBackgroundDisplaySets = useMemo(() => {
    return allDisplaySets.filter(
      ds =>
        !DERIVED_OVERLAY_MODALITIES.includes(ds.Modality) &&
        ds.displaySetInstanceUID !== backgroundDisplaySet.displaySetInstanceUID
    );
  }, [allDisplaySets, backgroundDisplaySet]);

  // Get available segmentations (deprecated approach - segmentations are now represented as display sets)
  const availableSegmentations = useMemo(() => {
    return getAvailableSegmentations(segmentationService);
  }, [segmentationService]);

  return {
    allDisplaySets,
    backgroundDisplaySet,
    enhancedDisplaySets,
    derivedOverlays,
    nonDerivedOverlays,
    potentialBackgroundDisplaySets,
    availableSegmentations,
  };
}

/**
 * Hook to manage active overlays and their opacities
 */
export function useOverlayState(viewportId) {
  const { servicesManager } = useSystem();
  const { displaySetService, viewportGridService, customizationService, segmentationService } =
    servicesManager.services;

  const [activeOverlays, setActiveOverlays] = useState([]);
  const [activeSegmentations, setActiveSegmentations] = useState([]);
  const [overlayOpacities, setOverlayOpacities] = useState({});

  // Initialize active overlays based on current viewport state
  useEffect(() => {
    const displaySetsUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId);

    // Get active segmentation representations for this viewport
    const segRepresentations = segmentationService.getSegmentationRepresentations(viewportId);

    // First UID is the background, any additional UIDs are overlays
    if (displaySetsUIDs.length > 1) {
      // Standard overlays from display sets
      const overlayUIDs = displaySetsUIDs.slice(1);
      const currentDisplaySetOverlays = overlayUIDs
        .map(uid => displaySetService.getDisplaySetByUID(uid))
        .filter(Boolean)
        .filter(ds => ds.Modality !== 'SEG');

      setActiveOverlays(currentDisplaySetOverlays);

      // Initialize opacities for display set overlays
      const newOpacities = { ...overlayOpacities };
      currentDisplaySetOverlays.forEach(overlay => {
        if (!newOpacities[overlay.displaySetInstanceUID]) {
          // Use modality-specific opacity if defined, otherwise use default
          const modalitySettings = getModalitySettings(customizationService, overlay.Modality);
          const defaultOpacity = modalitySettings.opacity
            ? Math.round(modalitySettings.opacity * 100)
            : DEFAULT_OPACITY_PERCENT;
          newOpacities[overlay.displaySetInstanceUID] = defaultOpacity;
        }
      });
      setOverlayOpacities(newOpacities);
    } else {
      setActiveOverlays([]);
    }

    // Set active segmentations separately
    if (segRepresentations.length > 0) {
      setActiveSegmentations(
        segRepresentations.map(rep => ({
          id: rep.segmentationId,
          segmentationId: rep.segmentationId,
          label: rep.label || 'Segmentation',
          type: rep.type,
        }))
      );
    } else {
      setActiveSegmentations([]);
    }
  }, [
    viewportId,
    displaySetService,
    viewportGridService,
    customizationService,
    segmentationService,
  ]);

  const addOverlay = displaySet => {
    setActiveOverlays(prev => [...prev, displaySet]);
    setOverlayOpacities(prev => ({
      ...prev,
      [displaySet.displaySetInstanceUID]: DEFAULT_OPACITY_PERCENT,
    }));
  };

  const removeOverlay = displaySetUID => {
    setActiveOverlays(prev =>
      prev.filter(overlay => overlay.displaySetInstanceUID !== displaySetUID)
    );
    setOverlayOpacities(prev => {
      const newOpacities = { ...prev };
      delete newOpacities[displaySetUID];
      return newOpacities;
    });
  };

  const addSegmentation = segmentation => {
    const segId = segmentation.segmentationId || segmentation.id;
    setActiveSegmentations(prev => [
      ...prev,
      {
        segmentationId: segId,
        id: segId, // Keep id for backward compatibility
        label: segmentation.label,
        type: segmentation.type || 'LABELMAP',
      },
    ]);
  };

  const removeSegmentation = segmentationId => {
    setActiveSegmentations(prev =>
      prev.filter(seg => (seg.segmentationId || seg.id) !== segmentationId)
    );
  };

  const updateOpacity = (displaySetUID, opacity) => {
    setOverlayOpacities(prev => ({
      ...prev,
      [displaySetUID]: opacity,
    }));
  };

  return {
    activeOverlays,
    activeSegmentations,
    overlayOpacities,
    addOverlay,
    removeOverlay,
    addSegmentation,
    removeSegmentation,
    updateOpacity,
  };
}
