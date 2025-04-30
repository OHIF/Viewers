import { useEffect } from 'react';
import React from 'react';
import { AllInOneMenu } from '@ohif/ui-next';
import { getWindowLevelActionMenu } from '../components/WindowLevelActionMenu/getWindowLevelActionMenu';
import { getViewportDataOverlaySettingsMenu } from '../components/ViewportDataOverlaySettingMenu';
import { getViewportOrientationMenu } from '../components/ViewportOrientationMenu';

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
    location: ViewportActionCornerLocation | string;
    indexPriority?: number;
  }) => void;
  clear: (viewportId: string) => void;
  getAlignAndSide: (location: ViewportActionCornerLocation | string) => {
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
  viewportActionCornersService: ViewportActionCornerService;
  customizationService: CustomizationService;
  commandsManager: AppTypes.CommandsManager;
}

/**
 * Hook to manage viewport action corners for a Cornerstone viewport
 */
export function useViewportActionCorners({
  viewportId,
  elementRef,
  displaySets,
  viewportActionCornersService,
  customizationService,
  commandsManager,
}: UseViewportActionCornersProps): void {
  // Set up the window level action menu in the viewport action corners.
  useEffect(() => {
    const windowLevelActionMenu = customizationService.getCustomization(
      'viewportActionMenu.windowLevelActionMenu'
    );
    const dataOverlay = customizationService.getCustomization('viewportActionMenu.dataOverlay');
    const orientationMenu = customizationService.getCustomization(
      'viewportActionMenu.orientationMenu'
    );

    if (windowLevelActionMenu?.enabled) {
      viewportActionCornersService.addComponent({
        viewportId,
        id: 'windowLevelActionMenu',
        component: getWindowLevelActionMenu({
          viewportId,
          element: elementRef.current,
          displaySets,
          verticalDirection: AllInOneMenu.VerticalDirection.TopToBottom,
          horizontalDirection: AllInOneMenu.HorizontalDirection.LeftToRight,
        }),
        location: windowLevelActionMenu.location,
        indexPriority: windowLevelActionMenu.indexPriority,
      });
    }

    if (dataOverlay?.enabled) {
      viewportActionCornersService.addComponent({
        viewportId,
        id: 'dataOverlay',
        component: getViewportDataOverlaySettingsMenu({
          viewportId,
          element: elementRef.current,
          displaySets,
          location: dataOverlay.location,
        }),
        location: dataOverlay.location,
        indexPriority: dataOverlay.indexPriority,
      });
    }

    // Only show orientation menu for reconstructable displaySets
    if (orientationMenu?.enabled) {
      viewportActionCornersService.addComponent({
        viewportId,
        id: 'orientationMenu',
        component: getViewportOrientationMenu({
          viewportId,
          element: elementRef.current,
          location: orientationMenu.location,
        }),
        location: orientationMenu.location,
        indexPriority: orientationMenu.indexPriority,
      });
    }
  }, [displaySets, viewportId, viewportActionCornersService, commandsManager, elementRef]);
}

export default useViewportActionCorners;
