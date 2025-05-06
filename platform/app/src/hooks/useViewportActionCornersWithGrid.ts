import { useCallback, MutableRefObject, useRef } from 'react';
import { useViewportActionCorners, ViewportActionCornersLocations } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';

/**
 * Hook that manages viewport action corner components for all viewports in the grid
 * @returns A function that can be called to initialize action corners for a viewport
 */
export default function useViewportActionCornersWithGrid() {
  const [, api] = useViewportActionCorners();
  const { servicesManager } = useSystem();
  const { customizationService } = servicesManager.services;

  // Keep a ref to track processed viewports to avoid duplicates
  const processedViewports = useRef<Set<string>>(new Set());

  // Map of customization keys to their corresponding enum values
  const locationMap = {
    'viewportActionMenu.topLeft': ViewportActionCornersLocations.topLeft,
    'viewportActionMenu.topRight': ViewportActionCornersLocations.topRight,
    'viewportActionMenu.bottomLeft': ViewportActionCornersLocations.bottomLeft,
    'viewportActionMenu.bottomRight': ViewportActionCornersLocations.bottomRight,
  };

  // Function to process customizations for a viewport
  const initializeViewportCorners = useCallback(
    (
      viewportId: string,
      elementRef: MutableRefObject<HTMLDivElement>,
      displaySets: any[],
      commandsManager: any
    ) => {
      if (!viewportId || !elementRef?.current) {
        return;
      }

      // Prevent duplicate processing
      if (processedViewports.current.has(viewportId)) {
        return;
      }

      // Mark this viewport as processed
      processedViewports.current.add(viewportId);

      // Clear any existing components for this viewport
      api.clear(viewportId);

      // Process each location
      Object.entries(locationMap).forEach(([locationKey, locationValue]) => {
        const items = customizationService.getCustomization(locationKey);
        if (!items || !items.length) {
          return;
        }

        items.forEach(item => {
          if (!item.enabled) {
            return;
          }

          try {
            if (typeof item.component === 'function') {
              // Use the component renderer provided directly in the item
              const component = item.component({
                viewportId,
                element: elementRef.current,
                displaySets,
                location: locationValue,
                commandsManager,
              });

              if (component) {
                api.addComponent({
                  viewportId,
                  id: item.id,
                  component,
                  location: locationValue,
                  indexPriority: item.indexPriority,
                });
              }
            } else if (item.component) {
              // Handle static components
              api.addComponent({
                viewportId,
                id: item.id,
                component: item.component,
                location: locationValue,
                indexPriority: item.indexPriority,
              });
            }
          } catch (error) {
            console.error(`Error adding component ${item.id} to viewport corner:`, error);
          }
        });
      });
    },
    [api, customizationService]
  );

  // Cleanup function for unmounting viewports
  const cleanupViewportCorners = useCallback(
    (viewportId: string) => {
      if (!viewportId) {
        return;
      }

      // Remove from processed set
      processedViewports.current.delete(viewportId);

      // Clear from the store
      api.clear(viewportId);
    },
    [api]
  );

  return { initializeViewportCorners, cleanupViewportCorners };
}
