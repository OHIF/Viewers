import React, { ReactNode } from 'react';
import {
  Button,
  Icons,
  Popover,
  PopoverContent,
  PopoverTrigger,
  useViewportGrid,
} from '@ohif/ui-next';
import { cn } from '@ohif/ui-next';
import ViewportOrientationMenu from './ViewportOrientationMenu';
import classNames from 'classnames';
import { useSystem } from '@ohif/core';

export function ViewportOrientationMenuWrapper({
  viewportId,
  location,
}: withAppTypes<{
  viewportId: string;
  element: HTMLElement;
  location: string;
}>): ReactNode {
  const { servicesManager } = useSystem();
  const { viewportActionCornersService } = servicesManager.services;
  const [viewportGrid] = useViewportGrid();

  const isActiveViewport = viewportId === viewportGrid.activeViewportId;
  console.debug('🚀 ~ isActiveViewport:', isActiveViewport);

  const { align, side } = viewportActionCornersService.getAlignAndSide(location);

  return (
    <Popover>
      <PopoverTrigger
        asChild
        className="flex items-center justify-center"
      >
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'text-muted-foreground',
            isActiveViewport ? 'visible' : 'invisible group-hover/pane:visible'
          )}
        >
          <Icons.Tool3DRotate className={classNames('text-highlight')} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="border-none bg-transparent p-0 shadow-none"
        side={side}
        align={align}
        alignOffset={-15}
        sideOffset={5}
      >
        <ViewportOrientationMenu viewportId={viewportId} />
      </PopoverContent>
    </Popover>
  );
}
