import { useState, useEffect, useMemo } from 'react';
import { useSystem } from '@ohif/core';
import {
  getModalitySettings,
  DEFAULT_OPACITY_PERCENT,
  getEnhancedDisplaySets,
  sortByOverlayable,
  DERIVED_OVERLAY_MODALITIES,
} from './utils';

/**
 * Hook to provide all the display sets and overlay information for a viewport
 */
export function useViewportDisplaySets(viewportId) {
  const { servicesManager } = useSystem();
  const { displaySetService, viewportGridService } = servicesManager.services;

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

  return {
    allDisplaySets,
    backgroundDisplaySet,
    enhancedDisplaySets,
    derivedOverlays,
    nonDerivedOverlays,
    potentialBackgroundDisplaySets,
  };
}

/**
 * Hook to manage active overlays and their opacities
 */
export function useOverlayState(viewportId) {
  const { servicesManager } = useSystem();
  const { displaySetService, viewportGridService, customizationService } = servicesManager.services;

  const [activeOverlays, setActiveOverlays] = useState([]);
  const [overlayOpacities, setOverlayOpacities] = useState({});

  // Initialize active overlays based on current viewport state
  useEffect(() => {
    const displaySetsUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId);
    // First UID is the background, any additional UIDs are overlays
    if (displaySetsUIDs.length > 1) {
      const overlayUIDs = displaySetsUIDs.slice(1);
      const currentOverlays = overlayUIDs.map(uid => displaySetService.getDisplaySetByUID(uid));
      setActiveOverlays(currentOverlays);

      // Initialize opacities for new overlays
      const newOpacities = { ...overlayOpacities };
      currentOverlays.forEach(overlay => {
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
  }, [viewportId, displaySetService, viewportGridService, customizationService]);

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

  const updateOpacity = (displaySetUID, opacity) => {
    setOverlayOpacities(prev => ({
      ...prev,
      [displaySetUID]: opacity,
    }));
  };

  return {
    activeOverlays,
    overlayOpacities,
    addOverlay,
    removeOverlay,
    updateOpacity,
  };
}
