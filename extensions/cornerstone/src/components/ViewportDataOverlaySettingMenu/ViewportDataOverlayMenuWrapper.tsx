import React, { ReactNode } from 'react';
import {
  Button,
  cn,
  Icons,
  Popover,
  PopoverContent,
  PopoverTrigger,
  useViewportGrid,
  useViewportActionCorners,
} from '@ohif/ui-next';
import ViewportDataOverlayMenu from './ViewportDataOverlayMenu';
import classNames from 'classnames';

const MENU_ID = 'dataOverlayMenu';

export function ViewportDataOverlayMenuWrapper({
  viewportId,
  displaySets,
  location,
}: withAppTypes<{
  viewportId: string;
  element: HTMLElement;
  location: string;
}>): ReactNode {
  const [viewportGrid] = useViewportGrid();
  const [actionCornerState, viewportActionCornersAPI] = useViewportActionCorners();

  const isMenuOpen =
    actionCornerState.viewports[viewportId]?.[location]?.find(item => item.id === MENU_ID)
      ?.isOpen ?? false;

  const handleOpenChange = (openState: boolean) => {
    if (openState) {
      viewportActionCornersAPI.openItem?.(viewportId, MENU_ID);
    } else {
      viewportActionCornersAPI.closeItem?.(viewportId, MENU_ID);
    }
  };

  // Get proper alignment and side based on the location
  let align = 'center';
  let side = 'bottom';

  if (location !== undefined) {
    const positioning = viewportActionCornersAPI.getAlignAndSide(location);
    align = positioning.align;
    side = positioning.side;
  }

  return (
    <Popover
      open={isMenuOpen}
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
