import React, { ReactNode } from 'react';
import {
  Button,
  cn,
  Icons,
  Popover,
  PopoverContent,
  PopoverTrigger,
  useViewportGrid,
} from '@ohif/ui-next';
import ViewportDataOverlayMenu from './ViewportDataOverlayMenu';
import classNames from 'classnames';
import { useSystem } from '@ohif/core';

export function ViewportDataOverlayMenuWrapper({
  viewportId,
  displaySets,
  location,
}: withAppTypes<{
  viewportId: string;
  element: HTMLElement;
}>): ReactNode {
  const { servicesManager } = useSystem();
  const { viewportActionCornersService } = servicesManager.services;
  const [viewportGrid] = useViewportGrid();

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
            viewportGrid.activeViewportId === viewportId
              ? 'visible'
              : 'invisible group-hover/pane:visible'
          )}
        >
          <Icons.ViewportViews className={classNames('text-highlight')} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="border-none bg-transparent p-0 shadow-none"
        side={side}
        align={align}
        alignOffset={0}
        sideOffset={5}
      >
        <ViewportDataOverlayMenu
          className="w-full"
          viewportId={viewportId}
          displaySets={displaySets}
        />
      </PopoverContent>
    </Popover>
  );
}
