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
} from '@ohif/ui-next';

function ViewportOrientationMenu({
  viewportId,
  location,
}: withAppTypes<{ viewportId: string; location?: string }>) {
  const { servicesManager, commandsManager } = useSystem();
  const { cornerstoneViewportService, displaySetService, viewportGridService } =
    servicesManager.services;

  const handleOrientationChange = (orientation: string) => {
    const viewportInfo = cornerstoneViewportService.getViewportInfo(viewportId);
    const currentViewportType = viewportInfo?.getViewportType();

    // Get the displaySets in this viewport
    const displaySetUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId);
    const displaySets = displaySetUIDs.map(uid => displaySetService.getDisplaySetByUID(uid));

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
  };
  const { viewportActionCornersService } = servicesManager.services;

  // Get proper alignment and side based on the location
  let align = 'center';
  let side = 'bottom';

  if (location) {
    const positioning = viewportActionCornersService.getAlignAndSide(location);
    align = positioning.align;
    side = positioning.side;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-highlight"
        >
          <Icons.Tool3DRotate />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-[160px]"
        align={align as any}
        side={side as any}
        sideOffset={5}
      >
        <DropdownMenuLabel>Orientation</DropdownMenuLabel>
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
