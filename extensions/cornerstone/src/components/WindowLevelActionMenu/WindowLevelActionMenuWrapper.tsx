import React, { ReactNode } from 'react';
import { useSystem } from '@ohif/core';
import {
  Button,
  Icons,
  Popover,
  PopoverContent,
  PopoverTrigger,
  AllInOneMenu,
} from '@ohif/ui-next';
import { WindowLevelActionMenu } from './WindowLevelActionMenu';
import { useViewportDisplaySets } from '../../hooks/useViewportDisplaySets';

export function WindowLevelActionMenuWrapper({
  viewportId,
  element,
  location,
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
  displaySets?: Array<AppTypes.DisplaySet>;
}>): ReactNode {
  const { allDisplaySets: displaySets } = useViewportDisplaySets(viewportId);

  const { servicesManager } = useSystem();
  const { customizationService } = servicesManager.services;

  const presets = customizationService.getCustomization('cornerstone.windowLevelPresets');
  const colorbarProperties = customizationService.getCustomization('cornerstone.colorbar');

  const { volumeRenderingPresets, volumeRenderingQualityRange } =
    customizationService.getCustomization('cornerstone.3dVolumeRendering');

  const handleOpenChange = (openState: boolean) => {
    if (openState) {
      onOpen?.();
    } else {
      onClose?.();
    }
  };

  const { align, side, horizontalDirection, verticalDirection } = getMenuDirections(location);

  const displaySetPresets = displaySets
    .filter(displaySet => presets[displaySet.Modality])
    .map(displaySet => {
      return { [displaySet.Modality]: presets[displaySet.Modality] };
    });

  const modalities = displaySets.map(displaySet => displaySet.supportsWindowLevel);

  if (modalities.length === 0) {
    return null;
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
          <Icons.ByName name="viewport-window-level" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="border-none bg-transparent p-0 shadow-none"
        side={side}
        align={align}
        alignOffset={0}
        sideOffset={5}
      >
        <WindowLevelActionMenu
          viewportId={viewportId}
          element={element}
          presets={displaySetPresets}
          horizontalDirection={horizontalDirection}
          verticalDirection={verticalDirection}
          colorbarProperties={colorbarProperties}
          displaySets={displaySets}
          volumeRenderingPresets={volumeRenderingPresets}
          volumeRenderingQualityRange={volumeRenderingQualityRange}
        />
      </PopoverContent>
    </Popover>
  );
}

const getMenuDirections = location => {
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

  let horizontalDirection;
  let verticalDirection;

  if (side === 'bottom') {
    verticalDirection = AllInOneMenu.VerticalDirection.TopToBottom;
  } else {
    verticalDirection = AllInOneMenu.VerticalDirection.BottomToTop;
  }

  if (align === 'start') {
    horizontalDirection = AllInOneMenu.HorizontalDirection.LeftToRight;
  } else {
    horizontalDirection = AllInOneMenu.HorizontalDirection.RightToLeft;
  }

  return { align, side, horizontalDirection, verticalDirection };
};
