import { useEffect } from 'react';
import { AllInOneMenu } from '@ohif/ui-next';
import { getWindowLevelActionMenu } from '../components/WindowLevelActionMenu/getWindowLevelActionMenu';
import { getViewportDataOverlaySettingsMenu } from '../components/ViewportDataOverlaySettingMenu';
import { getViewportOrientationMenu } from '../components/ViewportOrientationMenu';

interface UseViewportActionCornersProps {
  viewportId: string;
  elementRef: React.MutableRefObject<HTMLDivElement>;
  displaySets: any[];
  viewportActionCornersService: any;
  customizationService: any;
  commandsManager: any;
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
          location: windowLevelActionMenu.location,
          verticalDirection: AllInOneMenu.VerticalDirection.TopToBottom,
          horizontalDirection: AllInOneMenu.HorizontalDirection.RightToLeft,
        }),
        location: windowLevelActionMenu.location,
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
      });
    }

    // Only show orientation menu for reconstructable displaySets
    if (orientationMenu?.enabled && displaySets.some(ds => ds.isReconstructable)) {
      viewportActionCornersService.addComponent({
        viewportId,
        id: 'orientationMenu',
        component: getViewportOrientationMenu({
          viewportId,
          element: elementRef.current,
          location: orientationMenu.location,
        }),
        location: orientationMenu.location,
      });
    }
  }, [displaySets, viewportId, viewportActionCornersService, commandsManager, elementRef]);
}

export default useViewportActionCorners;