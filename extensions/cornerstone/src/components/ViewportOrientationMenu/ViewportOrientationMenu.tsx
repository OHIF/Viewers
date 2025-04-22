import React from 'react';
import { Button, Icons, ScrollArea } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';
import { Enums, utilities as csUtils } from '@cornerstonejs/core';

function ViewportOrientationMenu({ viewportId }: withAppTypes<{ viewportId: string }>) {
  const { servicesManager, commandsManager } = useSystem();
  const { cornerstoneViewportService, displaySetService, viewportGridService } =
    servicesManager.services;

  // Handle orientation change for the viewport
  const handleOrientationChange = (orientation: string) => {
    // Get viewport info and check viewport type
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

  return (
    <div className="bg-muted flex h-full w-[200px] flex-col rounded p-3">
      <span className="text-muted-foreground mb-2 block text-xs font-semibold">Orientation</span>
      <ScrollArea className="h-[120px] w-full">
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleOrientationChange('axial')}
          >
            Axial
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleOrientationChange('sagittal')}
          >
            Sagittal
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleOrientationChange('coronal')}
          >
            Coronal
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleOrientationChange('acquisition')}
          >
            Acquisition
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}

export default ViewportOrientationMenu;
