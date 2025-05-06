import { useEffect } from 'react';
import React from 'react';
import { ViewportActionCornersLocations } from '@ohif/ui-next';
import { useSystem } from '@ohif/core/src';

/**
 * Viewport action corner location type
 */
export interface ViewportActionCornerLocation {
  type: 'VIEWPORT';
  id: string;
  corner?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * Viewport action corner service interface
 */
export interface ViewportActionCornerService {
  addComponent: (params: {
    viewportId: string;
    id: string;
    component: React.ReactNode;
    location: ViewportActionCornersLocations | string;
    indexPriority?: number;
  }) => void;
  clear: (viewportId: string) => void;
  getAlignAndSide: (location: ViewportActionCornersLocations | string) => {
    align: 'start' | 'center' | 'end';
    side: 'top' | 'right' | 'bottom' | 'left';
  };
}

/**
 * Customization service interface
 */
export interface CustomizationService {
  getCustomization: (name: string) => any;
}

/**
 * Props for the useViewportActionCorners hook
 */
interface UseViewportActionCornersProps {
  viewportId: string;
  elementRef: React.MutableRefObject<HTMLDivElement>;
  displaySets: AppTypes.DisplaySet[];
}

// Map of customization keys to their corresponding enum values
const locationMap = {
  'viewportActionMenu.topLeft': ViewportActionCornersLocations.topLeft,
  'viewportActionMenu.topRight': ViewportActionCornersLocations.topRight,
  'viewportActionMenu.bottomLeft': ViewportActionCornersLocations.bottomLeft,
  'viewportActionMenu.bottomRight': ViewportActionCornersLocations.bottomRight,
};

/**
 * Hook to manage viewport action corners for a Cornerstone viewport
 */
export function useViewportActionCorners({
  viewportId,
  elementRef,
  displaySets,
}: UseViewportActionCornersProps): void {
  const { servicesManager } = useSystem();
  const { viewportActionCornersService, customizationService } = servicesManager.services;

  useEffect(() => {
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

        const componentId = item.id;

        if (item.component) {
          // Use the component renderer provided directly in the item
          const component = item.component({
            viewportId,
            element: elementRef.current,
            displaySets,
            location: locationValue,
          });

          viewportActionCornersService.addComponent({
            viewportId,
            id: componentId,
            component,
            location: locationValue,
          });
        } else if (item.component) {
          // Handle static components
          viewportActionCornersService.addComponent({
            viewportId,
            id: item.id,
            component: item.component,
            location: locationValue,
          });
        }
      });
    });
  }, [displaySets, viewportId, viewportActionCornersService, elementRef]);
}

export default useViewportActionCorners;
