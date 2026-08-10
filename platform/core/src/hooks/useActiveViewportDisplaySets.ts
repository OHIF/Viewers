import { useEffect, useState, useCallback } from 'react';
import { DisplaySet } from '../types';
import { useSystem } from '../';
import { shallowEqual } from '../services/ViewportGridService';

/**
 * Hook that listens for changes in the active viewport and its display sets.
 * It returns the display sets associated with the active viewport.
 *
 * @returns Array of display sets for the active viewport
 */
const useActiveViewportDisplaySets = (): DisplaySet[] => {
  const { servicesManager } = useSystem();
  const { displaySetService, viewportGridService } = servicesManager.services;

  const getDisplaySetsForViewport = useCallback(
    (viewportId: string) => {
      const displaySetUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId) || [];
      return displaySetUIDs.map(uid => displaySetService.getDisplaySetByUID(uid)).filter(Boolean);
    },
    [displaySetService, viewportGridService]
  );

  const [displaySets, setDisplaySets] = useState<DisplaySet[]>(
    () => getDisplaySetsForViewport(viewportGridService.getActiveViewportId()) || []
  );

  useEffect(() => {
    const unsubscribe = viewportGridService.select(
      state => {
        const { activeViewportId } = state;
        return {
          activeViewportId,
          uids: activeViewportId
            ? state.viewports.get(activeViewportId)?.displaySetInstanceUIDs
            : undefined,
        };
      },
      ({ activeViewportId }) => {
        // Null on reset/mode-exit; the legacy events never fired then, and
        // the hook kept its last display sets.
        if (!activeViewportId) {
          return;
        }
        setDisplaySets(getDisplaySetsForViewport(activeViewportId));
      },
      { equality: shallowEqual }
    );

    return unsubscribe;
  }, [viewportGridService, getDisplaySetsForViewport]);

  return displaySets;
};

export default useActiveViewportDisplaySets;
