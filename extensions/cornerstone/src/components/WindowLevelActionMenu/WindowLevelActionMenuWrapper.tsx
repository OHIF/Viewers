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
import useViewportRendering from '../../hooks/useViewportRendering';

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

  const { hasColorbar, colorbarPosition, toggleColorbar } = useViewportRendering(viewportId);

  const { viewportDisplaySets: displaySets } = useViewportDisplaySets(viewportIdToUse);
  const { servicesManager } = useSystem();
  const { toolbarService } = servicesManager.services;
  const { IconContainer, className: iconClassName, containerProps } = useIconPresentation();

  const isAdvancedColorbar = hasColorbar && colorbarPosition === 'bottom';

  const handleOpenChange = (openState: boolean) => {
    if (isAdvancedColorbar && openState) {
      toggleColorbar();
      return;
    }

    if (openState) {
      onOpen?.();
    } else {
      onClose?.();
    }
  };

  const { align, side } = toolbarService.getAlignAndSide(location);

  const modalities = displaySets.map(displaySet => displaySet.supportsWindowLevel);

  if (modalities.length === 0) {
    return null;
  }

  const Icon = isAdvancedColorbar ? (
    <Icons.Close className={'h-5 w-5'} />
  ) : (
    <Icons.ViewportWindowLevel className={iconClassName} />
  );

  if (isAdvancedColorbar && isOpen) {
    onClose?.();
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
        <div>
          {IconContainer ? (
            <IconContainer
              disabled={disabled}
              {...rest}
              {...containerProps}
            >
              {Icon}
            </IconContainer>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              disabled={disabled}
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
