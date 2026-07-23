import React, { ReactNode } from 'react';
import { useSystem } from '@ohif/core';
import {
  Button,
  Icons,
  Popover,
  PopoverContent,
  PopoverTrigger,
  useIconPresentation,
} from '@ohif/ui-next';
import ViewportDataOverlayMenu from './ViewportDataOverlayMenu';
import { useViewportDisplaySets } from '../../hooks/useViewportDisplaySets';

type DataOverlayMenuProps = {
  viewportId: string;
  location: string;
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  disabled?: boolean;
  id?: string;
};

export function ViewportDataOverlayMenuWrapper(props: DataOverlayMenuProps): ReactNode {
  const { viewportId, location, isOpen = false, onOpen, onClose, disabled, ...rest } = props;
  const { viewportDisplaySets: displaySets } = useViewportDisplaySets(viewportId);
  const { IconContainer, className: iconClassName, containerProps } = useIconPresentation();

  const handleOpenChange = (openState: boolean) => {
    if (openState) {
      onOpen?.();
    } else {
      onClose?.();
    }
  };

  const { servicesManager } = useSystem();
  const { toolbarService } = servicesManager.services;

  const { align, side } = toolbarService.getAlignAndSide(location);

  const Icon = <Icons.ViewportViews className={iconClassName} />;

  const idProp = rest.id ? { id: `${rest.id}-${viewportId}` } : {};
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
              icon="ViewportViews"
              {...rest}
              {...containerProps}
              {...idProp}
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
        <ViewportDataOverlayMenu
          className="w-full"
          viewportId={viewportId}
          displaySets={displaySets}
        />
      </PopoverContent>
    </Popover>
  );
}
