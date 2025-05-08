import React, { ReactNode } from 'react';
import { useSystem } from '@ohif/core';
import { Button, Icons, Popover, PopoverContent, PopoverTrigger, useIconSize } from '@ohif/ui-next';
import ViewportDataOverlayMenu from './ViewportDataOverlayMenu';
import { useViewportDisplaySets } from '../../hooks/useViewportDisplaySets';

export function ViewportDataOverlayMenuWrapper({
  location,
  viewportId,
  isOpen = false,
  onOpen,
  onClose,
  iconSize = 24,
}: withAppTypes<{
  viewportId: string;
  element?: HTMLElement;
  location?: string;
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  iconSize?: number;
}>): ReactNode {
  const { allDisplaySets: displaySets } = useViewportDisplaySets(viewportId);
  const iconClasses = useIconSize();

  const handleOpenChange = (openState: boolean) => {
    if (openState) {
      onOpen?.();
    } else {
      onClose?.();
    }
  };

  const { servicesManager } = useSystem();
  const { toolbarService } = servicesManager.services;

  // Get alignment and side from the toolbar service
  const { align, side } = toolbarService.getAlignAndSide(Number(location));

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
          <Icons.ViewportViews className={iconClasses} />
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
