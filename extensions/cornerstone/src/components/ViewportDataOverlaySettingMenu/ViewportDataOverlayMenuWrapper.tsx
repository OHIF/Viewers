import React, { ReactNode, useEffect } from 'react';
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

// Unique ID for this menu component
const MENU_ID = 'viewport-data-overlay-menu';

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

  // Handle open state from the service
  const isOpen = viewportActionCornersService.isItemOpen?.(viewportId, MENU_ID);

  // Handle popover open/close
  const handleOpenChange = (open: boolean) => {
    if (open) {
      viewportActionCornersService.openItem?.(viewportId, MENU_ID);
    } else {
      viewportActionCornersService.closeItem?.(viewportId, MENU_ID);
    }
  };

  // Close this menu when closeAll is called for this viewport
  useEffect(() => {
    return () => {
      viewportActionCornersService.closeItem?.(viewportId, MENU_ID);
    };
  }, [viewportId, viewportActionCornersService]);

  return (
    <Popover
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
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
