import React from 'react';
import { Icons, useViewportActionCorners } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';
import { Enums } from '@cornerstonejs/core';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  Button,
} from '@ohif/ui-next';
import { MENU_IDS } from '../menus/menu-ids';

function ViewportOrientationMenu({
  location,
  viewportId,
  displaySets,
}: withAppTypes<{ location?: string; viewportId: string; displaySets: AppTypes.DisplaySet[] }>) {
  const { servicesManager, commandsManager } = useSystem();
  const [actionCornerState, viewportActionCornersServiceAPI] = useViewportActionCorners();
  const { cornerstoneViewportService } = servicesManager.services;

  const isMenuOpen =
    actionCornerState.viewports[viewportId]?.[location]?.find(
      item => item.id === MENU_IDS.ORIENTATION_MENU
    )?.isOpen ?? false;

  const handleOrientationChange = (orientation: string) => {
    const viewportInfo = cornerstoneViewportService.getViewportInfo(viewportId);
    const currentViewportType = viewportInfo?.getViewportType();

    if (!displaySets.length) {
      return;
    }

    // Check if at least one displaySet is reconstructable
    const hasReconstructableDisplaySet = displaySets.some(ds => ds.isReconstructable);

    if (!hasReconstructableDisplaySet) {
      console.warn('Cannot change orientation: No reconstructable display sets in viewport');
      return;
    }

    // Set the orientation enum based on the selected orientation
    let orientationEnum;
    switch (orientation.toLowerCase()) {
      case 'axial':
        orientationEnum = Enums.OrientationAxis.AXIAL;
        break;
      case 'sagittal':
        orientationEnum = Enums.OrientationAxis.SAGITTAL;
        break;
      case 'coronal':
        orientationEnum = Enums.OrientationAxis.CORONAL;
        break;
      default:
        orientationEnum = Enums.OrientationAxis.ACQUISITION;
    }

    const displaySetUIDs = displaySets.map(ds => ds.displaySetInstanceUID);

    // If viewport is not already a volume type, we need to convert it
    if (currentViewportType !== Enums.ViewportType.ORTHOGRAPHIC) {
      // Configure the viewport to be a volume viewport with current display sets
      const updatedViewport = {
        viewportId,
        displaySetInstanceUIDs: displaySetUIDs,
        viewportOptions: {
          viewportType: Enums.ViewportType.ORTHOGRAPHIC,
          orientation: orientationEnum,
        },
        displaySetOptions: displaySetUIDs.map(() => ({})),
      };

      // Update the viewport to be a volume viewport
      commandsManager.run('setDisplaySetsForViewports', {
        viewportsToUpdate: [updatedViewport],
      });
    } else {
      // Set the viewport orientation
      commandsManager.runCommand('setViewportOrientation', {
        viewportId,
        orientation: orientationEnum,
      });
    }

    // Close the menu after selection
    viewportActionCornersServiceAPI.closeItem?.(viewportId, MENU_IDS.ORIENTATION_MENU);
  };

  const handleOpenChange = (openState: boolean) => {
    if (openState) {
      viewportActionCornersServiceAPI.openItem?.(viewportId, MENU_IDS.ORIENTATION_MENU);
    } else {
      viewportActionCornersServiceAPI.closeItem?.(viewportId, MENU_IDS.ORIENTATION_MENU);
    }
  };

  if (!displaySets.length) {
    return null;
  }

  const hasReconstructableDisplaySet = displaySets.some(ds => ds.isReconstructable);

  // Get proper alignment and side based on the location
  let align = 'center';
  let side = 'bottom';

  if (location !== undefined) {
    const positioning = viewportActionCornersServiceAPI.getAlignAndSide(location);
    align = positioning.align;
    side = positioning.side;
  }

  return (
    <DropdownMenu
      open={isMenuOpen}
      onOpenChange={handleOpenChange}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-highlight"
          disabled={!hasReconstructableDisplaySet}
        >
          <Icons.OrientationSwitch />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-[160px]"
        align={align}
        side={side}
        sideOffset={5}
      >
        <DropdownMenuLabel className="-ml-1">Orientation</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleOrientationChange('axial')}>Axial</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleOrientationChange('sagittal')}>
          Sagittal
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleOrientationChange('coronal')}>
          Coronal
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleOrientationChange('acquisition')}>
          Acquisition
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ViewportOrientationMenu;
