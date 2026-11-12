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
import ThresholdMenu from './ThresholdMenu';

type ThresholdMenuWrapperProps = {
  viewportId: string;
  location: string;
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  disabled?: boolean;
};

export function ThresholdMenuWrapper(props: ThresholdMenuWrapperProps): ReactNode {
  const { viewportId, location, isOpen = false, onOpen, onClose, disabled, ...rest } = props;
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

  const Icon = <Icons.Threshold className={iconClassName} />;

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
              icon="Threshold"
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
        <ThresholdMenu
          className="w-full"
          viewportId={viewportId}
        />
      </PopoverContent>
    </Popover>
  );
}