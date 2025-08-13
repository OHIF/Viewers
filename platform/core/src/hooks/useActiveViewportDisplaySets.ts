import { useEffect, useState, useCallback } from 'react';
import { DisplaySet } from '../types';
import { useSystem } from '../';
/**
 * Hook that listens for changes in the active viewport and its display sets.
 * It returns the display sets associated with the active viewport.
 *
 * @param servicesManager - Services manager instance
 * @returns Array of display sets for the active viewport
 */
const useActiveViewportDisplaySets = (): DisplaySet[] => {
  const { servicesManager } = useSystem();
  const { displaySetService, viewportGridService } = servicesManager.services;
  // Move this function outside useEffect and memoize it
  const getDisplaySetsForViewport = useCallback(
    (viewportId: string) => {
      const displaySetUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId) || [];
      return displaySetUIDs.map(uid => displaySetService.getDisplaySetByUID(uid)).filter(Boolean);
    },
    [displaySetService, viewportGridService]
  );

  // Get initial state
  const viewportId = viewportGridService.getActiveViewportId();
  const displaySetsNew = getDisplaySetsForViewport(viewportId) || [];
  const [displaySets, setDisplaySets] = useState<DisplaySet[]>(displaySetsNew);

  useEffect(() => {
    const handleViewportChange = ({ viewportId }) => {
      const displaySetsNew = getDisplaySetsForViewport(viewportId);
      setDisplaySets(displaySetsNew);
    };

    const handleGridStateChange = ({ state }) => {
      const activeViewportId = state.activeViewportId;
      if (activeViewportId) {
        const displaySetsNew = getDisplaySetsForViewport(activeViewportId);
        setDisplaySets(displaySetsNew);
      }
    };

    // Subscribe to viewport changes
    const subscriptions = [
      viewportGridService.subscribe(
        viewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED,
        handleViewportChange
      ),
      viewportGridService.subscribe(
        viewportGridService.EVENTS.GRID_STATE_CHANGED,
        handleGridStateChange
      ),
    ];

    return () => {
      subscriptions.forEach(subscription => subscription.unsubscribe());
    };
  }, [viewportGridService, getDisplaySetsForViewport]); // Only depend on stable references

  return displaySets;
};

export default useActiveViewportDisplaySets;
