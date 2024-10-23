import React, { ReactNode, useEffect, useState } from 'react';
import { Button, Icons, Popover, PopoverContent, PopoverTrigger } from '@ohif/ui-next';
import ViewportSegmentationMenu from './ViewportSegmentationMenu';
import classNames from 'classnames';

export function ViewportSegmentationMenuWrapper({
  viewportId,
  displaySets,
  servicesManager,
  commandsManager,
  location,
}: withAppTypes<{
  viewportId: string;
  element: HTMLElement;
}>): ReactNode {
  const { segmentationService, viewportActionCornersService, viewportGridService } =
    servicesManager.services;
  const [representations, setRepresentations] = useState(null);

  useEffect(() => {
    const representations = segmentationService.getSegmentationsInfo();
    setRepresentations(representations);
  }, [viewportId, servicesManager]);

  useEffect(() => {
    const { unsubscribe } = segmentationService.subscribe(
      segmentationService.EVENTS.SEGMENTATION_REPRESENTATION_MODIFIED,
      () => {
        const representations = segmentationService.getSegmentationsInfo();
        setRepresentations(representations);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [viewportId, servicesManager]);

  const activeViewportId = viewportGridService.getActiveViewportId();
  const isActiveViewport = viewportId === activeViewportId;

  const { align, side } = getAlignAndSide(viewportActionCornersService, location);

  if (!representations?.length) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger
        asChild
        className="flex items-center justify-center"
      >
        <Button
          variant="ghost"
          size="icon"
        >
          <Icons.ViewportViews
            className={classNames(
              'text-highlight',
              isActiveViewport ? 'visible' : 'invisible group-hover/pane:visible'
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
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
      </PopoverContent>
    </Popover>
  );
}

const getAlignAndSide = (viewportActionCornersService, location) => {
  const ViewportActionCornersLocations = viewportActionCornersService.LOCATIONS;

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
