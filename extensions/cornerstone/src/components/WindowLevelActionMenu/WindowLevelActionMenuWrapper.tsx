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
import { AllInOneMenu } from '@ohif/ui-next';
import { WindowLevelActionMenu } from './WindowLevelActionMenu';
import { MENU_IDS } from '../menus/menu-ids';
import { useSystem } from '@ohif/core/src/contextProviders/SystemProvider';

export function WindowLevelActionMenuWrapper({
  viewportId,
  element,
  location,
  displaySets,
}: withAppTypes<{
  viewportId: string;
  element: HTMLElement;
  location: string;
  displaySets: Array<any>;
}>): ReactNode {
  const [viewportGrid] = useViewportGrid();
  const [actionCornerState, viewportActionCornersAPI] = useViewportActionCorners();
  const isActiveViewport = viewportId === viewportGrid.activeViewportId;
  const { servicesManager } = useSystem();
  const { customizationService } = servicesManager.services;

  const presets = customizationService.getCustomization('cornerstone.windowLevelPresets');
  const colorbarProperties = customizationService.getCustomization('cornerstone.colorbar');
  const { volumeRenderingPresets, volumeRenderingQualityRange } =
    customizationService.getCustomization('cornerstone.3dVolumeRendering');

  const isMenuOpen =
    actionCornerState.viewports[viewportId]?.[location]?.find(
      item => item.id === MENU_IDS.WINDOW_LEVEL_MENU
    )?.isOpen ?? false;

  const handleOpenChange = (openState: boolean) => {
    if (openState) {
      viewportActionCornersAPI.openItem?.(viewportId, MENU_IDS.WINDOW_LEVEL_MENU);
    } else {
      viewportActionCornersAPI.closeItem?.(viewportId, MENU_IDS.WINDOW_LEVEL_MENU);
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

  // Determine the horizontal and vertical direction for the AllInOneMenu
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
            isActiveViewport ? 'visible' : 'invisible group-hover/pane:visible',
            'text-highlight'
          )}
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
