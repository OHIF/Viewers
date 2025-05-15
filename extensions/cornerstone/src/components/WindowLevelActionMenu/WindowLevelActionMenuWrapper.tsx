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
import { useViewportRendering } from '../../hooks';

export function WindowLevelActionMenuWrapper(
  props: withAppTypes<{
    viewportId: string;
    element?: HTMLElement;
    location?: number;
    isOpen?: boolean;
    onOpen?: () => void;
    onClose?: () => void;
    displaySets?: Array<AppTypes.DisplaySet>;
    disabled?: boolean;
    isEmbedded?: boolean;
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
    isEmbedded = false,
    onInteraction: onInteractionProps,
    hasEmbeddedVariantToUse,
    ...rest
  } = props;

  const [gridState] = useViewportGrid();
  const viewportIdToUse = viewportId || gridState.activeViewportId;

  const { viewportDisplaySets: displaySets } = useViewportDisplaySets(viewportIdToUse);
  const { servicesManager } = useSystem();
  const { toolbarService } = servicesManager.services;
  const { IconContainer, className: iconClassName, containerProps } = useIconPresentation();
  const { hasColorbar, toggleColorbar } = useViewportRendering(viewportId);

  const handleOpenChange = (openState: boolean) => {
    const shouldToggleColorbar = hasColorbar && !isEmbedded;

    if (isOpen && shouldToggleColorbar && openState) {
      toggleColorbar();
      onClose?.();
      return;
    }

    if (!isOpen && openState && shouldToggleColorbar) {
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

  const Icon =
    hasColorbar && !isEmbedded && hasEmbeddedVariantToUse ? (
      <Icons.Close className={iconClassName} />
    ) : (
      <Icons.ViewportWindowLevel className={iconClassName} />
    );

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
