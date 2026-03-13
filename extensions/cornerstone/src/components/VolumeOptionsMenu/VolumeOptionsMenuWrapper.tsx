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
import { useViewportDisplaySets } from '../../hooks/useViewportDisplaySets';
import { VolumeOptions } from './VolumeOptions';
import { VolumeCropping } from './VolumeCropping';

const VolumeIcon = (Icons as Record<string, React.ComponentType<{ className?: string }>>)['icon-mpr'];

export function VolumeOptionsMenuWrapper(
  props: withAppTypes<{
    viewportId: string;
    location?: number;
    isOpen?: boolean;
    onOpen?: () => void;
    onClose?: () => void;
    disabled?: boolean;
  }>
): ReactNode {
  const { viewportId, location, isOpen = false, onOpen, onClose, disabled, ...rest } = props;

  const [gridState] = useViewportGrid();
  const viewportIdToUse = viewportId || gridState.activeViewportId;
  const { viewportDisplaySets: displaySets } = useViewportDisplaySets(viewportIdToUse);
  const { servicesManager } = useSystem();
  const { toolbarService } = servicesManager.services;
  const { IconContainer, className: iconClassName, containerProps } = useIconPresentation();

  const handleOpenChange = (openState: boolean) => {
    if (openState) {
      onOpen?.();
    } else {
      onClose?.();
    }
  };

  const { align, side } = toolbarService.getAlignAndSide(location);

  const isVolumeViewport = displaySets.some(ds => ds?.isReconstructable);
  if (!isVolumeViewport || displaySets.length === 0) {
    return null;
  }

  const Icon = VolumeIcon ? <VolumeIcon className={iconClassName} /> : null;

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild className="flex items-center justify-center">
        <div>
          {IconContainer ? (
            <IconContainer
              disabled={disabled}
              icon="icon-mpr"
              {...rest}
              {...containerProps}
            >
              {Icon}
            </IconContainer>
          ) : (
            <Button variant="ghost" size="icon" disabled={disabled}>
              {Icon}
            </Button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="border-none bg-transparent p-0 shadow-none min-w-[280px]"
        side={side}
        align={align}
        alignOffset={0}
        sideOffset={5}
      >
        <div className="bg-popover rounded p-2">
          <VolumeCropping viewportId={viewportIdToUse} />
          <div className="bg-background my-2 h-px w-full" />
          <VolumeOptions viewportId={viewportIdToUse} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
