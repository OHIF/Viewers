import React, { ReactNode } from 'react';
import { useSystem } from '@ohif/core';
import {
  Button,
  Icons,
  Popover,
  PopoverContent,
  PopoverTrigger,
  AllInOneMenu,
  useViewportGrid,
  useIconSize,
} from '@ohif/ui-next';
import { WindowLevelActionMenu } from './WindowLevelActionMenu';
import { useViewportDisplaySets } from '../../hooks/useViewportDisplaySets';

export function WindowLevelActionMenuWrapper(
  props: withAppTypes<{
    viewportId: string;
    element?: HTMLElement;
    location?: string;
    isOpen?: boolean;
    onOpen?: () => void;
    onClose?: () => void;
    displaySets?: Array<AppTypes.DisplaySet>;
    disabled?: boolean;
  }>
): ReactNode {
  const { viewportId, element, location, isOpen = false, onOpen, onClose, disabled } = props;
  const [gridState] = useViewportGrid();
  const viewportIdToUse = viewportId || gridState.activeViewportId;

  const { viewportDisplaySets: displaySets } = useViewportDisplaySets(viewportIdToUse);
  const { servicesManager } = useSystem();
  const { customizationService } = servicesManager.services;
  const { IconContainer, className: iconClassName } = useIconSize();

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

  const Icon = <Icons.ViewportWindowLevel className={iconClassName} />;

  return (
    <Popover
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      <PopoverTrigger
        asChild
        className="flex items-center justify-center"
      >
        <div>
          {IconContainer ? (
            <IconContainer
              variant="ghost"
              size="icon"
              icon="viewport-window-level"
              disabled={disabled}
            >
              {Icon}
            </IconContainer>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              disabled={disabled}
              onClick={() => {}}
            >
              {Icon}
            </Button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="border-none bg-transparent p-0 shadow-none"
        side={side}
        align={align}
        alignOffset={0}
        sideOffset={5}
      >
        <WindowLevelActionMenu
          viewportId={viewportIdToUse}
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
  const { servicesManager } = useSystem();
  const { toolbarService } = servicesManager.services;

  // Get alignment and side from the toolbar service
  const { align, side } = toolbarService.getAlignAndSide(Number(location));

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
