import React, { ReactNode } from 'react';
import { useSystem } from '@ohif/core';
import {
  Button,
  Icons,
  Popover,
  PopoverContent,
  PopoverTrigger,
  useViewportGrid,
  useIconPresentation,
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
  const {
    viewportId,
    element,
    location,
    isOpen = false,
    onOpen,
    onClose,
    disabled,
    ...rest
  } = props;
  const [gridState] = useViewportGrid();
  const viewportIdToUse = viewportId || gridState.activeViewportId;

  const { viewportDisplaySets: displaySets } = useViewportDisplaySets(viewportIdToUse);
  const { servicesManager } = useSystem();
  const { customizationService, toolbarService } = servicesManager.services;
  const { IconContainer, className: iconClassName, containerProps } = useIconPresentation();

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

  const { align, side } = toolbarService.getAlignAndSide(Number(location));

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
              disabled={disabled}
              {...rest}
              {...containerProps}
              icon="ViewportWindowLevel"
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
          align={align}
          side={side}
        />
      </PopoverContent>
    </Popover>
  );
}
