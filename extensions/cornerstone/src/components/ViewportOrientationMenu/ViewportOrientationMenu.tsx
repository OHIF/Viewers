import React from 'react';
import { Button, Icons, ScrollArea } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';
import { Enums } from '@cornerstonejs/core';

function ViewportOrientationMenu({ viewportId }: withAppTypes<{ viewportId: string }>) {
  const { servicesManager, commandsManager } = useSystem();
  const { cornerstoneViewportService, displaySetService, viewportGridService } =
    servicesManager.services;

  // Check if the viewport has reconstructable data before trying to change orientation
  const handleOrientationChange = (orientation: string) => {
    const viewportInfo = cornerstoneViewportService.getViewportInfo(viewportId);
    debugger;
    if (!viewportInfo || viewportInfo.getViewportType() !== 'volume') {
      // Orientation changes only work on volume viewports
      return;
    }

    // Get the displaySets in this viewport
    const displaySetUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId);
    const displaySets = displaySetUIDs.map(uid => displaySetService.getDisplaySetByUID(uid));

    // Check if at least one displaySet is reconstructable
    if (!displaySets.some(ds => ds.isReconstructable)) {
      console.warn('Cannot change orientation: No reconstructable display sets in viewport');
      return;
    }

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

    commandsManager.runCommand('setViewportOrientation', {
      viewportId,
      orientation: orientationEnum,
    });
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
