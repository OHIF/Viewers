import React from 'react';
import { Icons } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';
import { Enums } from '@cornerstonejs/core';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  Button,
  useViewportGrid,
} from '@ohif/ui-next';

function ViewportOrientationMenu({
  location,
  viewportId,
  displaySets,
  isOpen = false,
  onOpen,
  onClose,
  iconSize = 24,
}: withAppTypes<{
  location?: string;
  viewportId: string;
  displaySets: AppTypes.DisplaySet[];
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  iconSize?: number;
}>) {
  const [gridState] = useViewportGrid();
  const viewportIdToUse = viewportId || gridState.activeViewportId;

  const { servicesManager, commandsManager } = useSystem();
  const { cornerstoneViewportService, toolbarService } = servicesManager.services;

  const handleOrientationChange = (orientation: string) => {
    const viewportInfo = cornerstoneViewportService.getViewportInfo(viewportIdToUse);
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
        viewportId: viewportIdToUse,
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
        viewportId: viewportIdToUse,
        orientation: orientationEnum,
      });
    }

    // Close the menu after selection
    onClose?.();
  };

  const handleOpenChange = (openState: boolean) => {
    if (openState) {
      onOpen?.();
    } else {
      onClose?.();
    }
  };

  if (!displaySets.length) {
    return null;
  }

  const hasReconstructableDisplaySet = displaySets.some(ds => ds.isReconstructable);

  // Get proper alignment and side based on the location using toolbar service
  const { align, side } = toolbarService.getAlignAndSide(Number(location));

  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
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
