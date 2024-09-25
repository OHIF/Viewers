import React, { ReactNode } from 'react';
import { Button, Popover } from '@ohif/ui-next';
import ViewportSegmentationMenu from './ViewportSegmentationMenu';

export function getViewportSegmentationMenu({
  viewportId,
  displaySets,
  servicesManager,
  commandsManager,
  location,
}: withAppTypes<{
  viewportId: string;
  element: HTMLElement;
}>): ReactNode {
  const viewportActionCornersService = servicesManager.services.viewportActionCornersService;
  const ViewportActionCornersLocations = viewportActionCornersService.LOCATIONS;
  // get align and side from the locations

  const getAlignAndSide = location => {
    switch (location) {
      case ViewportActionCornersLocations.topLeft:
        return { align: 'start', side: 'bottom' };
      case ViewportActionCornersLocations.topRight:
        return { align: 'end', side: 'bottom' };
      case ViewportActionCornersLocations.bottomLeft:
        return { align: 'start', side: 'top' };
      case ViewportActionCornersLocations.bottomRight:
        return { align: 'end', side: 'top' };
      default:
        console.debug('Unknown location, defaulting to bottom-start');
        return { align: 'start', side: 'bottom' };
    }
  };

  const { align, side } = getAlignAndSide(location);

  return (
    <Popover.Popover>
      <Popover.PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
        >
          SEG
        </Button>
      </Popover.PopoverTrigger>
      <Popover.PopoverContent
        className="border-none bg-transparent p-0 shadow-none"
        side={side}
        align={align}
        alignOffset={-15}
        sideOffset={5}
      >
        <ViewportSegmentationMenu
          className="w-full"
          viewportId={viewportId}
          displaySets={displaySets}
          servicesManager={servicesManager}
          commandsManager={commandsManager}
        />
      </Popover.PopoverContent>
    </Popover.Popover>
  );
}
