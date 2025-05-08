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

  // Set default alignment and side
  let align = 'center';
  let side = 'bottom';

  // Based on location string, determine the appropriate alignment
  if (location) {
    if (location.includes('topRight') || location.includes('viewportActionMenu.topRight')) {
      align = 'end';
      side = 'bottom';
    } else if (location.includes('topLeft') || location.includes('viewportActionMenu.topLeft')) {
      align = 'start';
      side = 'bottom';
    } else if (
      location.includes('bottomRight') ||
      location.includes('viewportActionMenu.bottomRight')
    ) {
      align = 'end';
      side = 'top';
    } else if (
      location.includes('bottomLeft') ||
      location.includes('viewportActionMenu.bottomLeft')
    ) {
      align = 'start';
      side = 'top';
    }
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
