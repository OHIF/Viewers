import React, { ReactNode } from 'react';
import { Button, Icons, Popover, PopoverContent, PopoverTrigger } from '@ohif/ui-next';
import ViewportDataOverlayMenu from './ViewportDataOverlayMenu';
import classNames from 'classnames';
import { MENU_IDS } from '../menus/menu-ids';
import { useViewportDisplaySets } from '../../hooks/useViewportDisplaySets';

export function ViewportDataOverlayMenuWrapper({
  location,
  viewportId,
  isOpen = false,
  onOpen,
  onClose,
}: withAppTypes<{
  viewportId: string;
  element?: HTMLElement;
  location?: string;
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}>): ReactNode {
  const { allDisplaySets: displaySets } = useViewportDisplaySets(viewportId);

  const handleOpenChange = (openState: boolean) => {
    if (openState) {
      onOpen?.();
    } else {
      onClose?.();
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
