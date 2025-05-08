import React, { ReactNode } from 'react';
import {
  Button,
  Icons,
  Popover,
  PopoverContent,
  PopoverTrigger,
  useViewportGrid,
  useViewportActionCorners,
} from '@ohif/ui-next';
import ViewportDataOverlayMenu from './ViewportDataOverlayMenu';
import classNames from 'classnames';
import { MENU_IDS } from '../menus/menu-ids';
import { useViewportDisplaySets } from '../../hooks/useViewportDisplaySets';

export function ViewportDataOverlayMenuWrapper({
  location,
  viewportId,
}: withAppTypes<{
  viewportId: string;
  element: HTMLElement;
  location: string;
}>): ReactNode {
  const [actionCornerState, viewportActionCornersAPI] = useViewportActionCorners();
  const { allDisplaySets: displaySets } = useViewportDisplaySets(viewportId);

  const isMenuOpen =
    actionCornerState.viewports[viewportId]?.[location]?.find(
      item => item.id === MENU_IDS.DATA_OVERLAY_MENU
    )?.isOpen ?? false;

  const handleOpenChange = (openState: boolean) => {
    if (openState) {
      viewportActionCornersAPI.openItem?.(viewportId, MENU_IDS.DATA_OVERLAY_MENU);
    } else {
      viewportActionCornersAPI.closeItem?.(viewportId, MENU_IDS.DATA_OVERLAY_MENU);
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
        >
          <Icons.ViewportViews className={classNames('text-highlight')} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="border-none bg-transparent p-0 shadow-none"
        id="abbas"
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
