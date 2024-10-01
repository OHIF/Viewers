import React, { ReactNode, useState, useEffect } from 'react';
import { Button, Icons, Popover } from '@ohif/ui-next';
import ViewportSegmentationMenu from './ViewportSegmentationMenu';

export function ViewportSegmentationMenuWrapper({
  viewportId,
  displaySets,
  servicesManager,
  commandsManager,
  location,
}: withAppTypes<{
  viewportId: string;
  4;
  element: HTMLElement;
}>): ReactNode {
  const { segmentationService, viewportActionCornersService } = servicesManager.services;
  const ViewportActionCornersLocations = viewportActionCornersService.LOCATIONS;
  const [representations, setRepresentations] = useState([]);

  useEffect(() => {
    const eventSubscriptions = [
      segmentationService.EVENTS.SEGMENTATION_MODIFIED,
      segmentationService.EVENTS.SEGMENTATION_REMOVED,
      segmentationService.EVENTS.SEGMENTATION_REPRESENTATION_MODIFIED,
    ];

    const allUnsubscribeFunctions = eventSubscriptions.map(evt => {
      const { unsubscribe } = segmentationService.subscribe(evt, () => {
        const representations = segmentationService.getSegmentationRepresentations(viewportId);
        setRepresentations(representations);
      });

      return unsubscribe;
    });

    return () => {
      allUnsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [segmentationService, viewportId]);

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

  if (!representations.length) {
    return null;
  }

  return (
    <Popover.Popover>
      <Popover.PopoverTrigger
        asChild
        className="flex items-center justify-center"
      >
        <Button
          variant="ghost"
          size="icon"
        >
          <Icons.ViewportViews className="text-highlight" />
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
