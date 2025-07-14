import React from 'react';
import { cn, Icons, ToolButton, useIconPresentation } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';
import { Enums } from '@cornerstonejs/core';
import { Popover, PopoverTrigger, PopoverContent, Button, useViewportGrid } from '@ohif/ui-next';

function ViewportOrientationMenu({
  location,
  viewportId,
  displaySets,
  isOpen = false,
  onOpen,
  onClose,
  disabled,
  ...props
}: withAppTypes<{
  location?: string;
  viewportId: string;
  displaySets: AppTypes.DisplaySet[];
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  disabled?: boolean;
}>) {
  const [gridState] = useViewportGrid();
  const viewportIdToUse = viewportId || gridState.activeViewportId;
  const { IconContainer, className: iconClassName, containerProps } = useIconPresentation();
  const { servicesManager, commandsManager } = useSystem();
  const { cornerstoneViewportService, toolbarService } = servicesManager.services;

  const handleOrientationChange = (orientation: string) => {
    const viewportInfo = cornerstoneViewportService.getViewportInfo(viewportIdToUse);
    const currentViewportType = viewportInfo?.getViewportType();

    if (!displaySets.length) {
      return;
    }

    // Check if at least one displaySet is reconstructable
    const hasReconstructableDisplaySet = displaySets.some(ds => ds.isReconstructable);

    if (!hasReconstructableDisplaySet) {
      console.warn('Cannot change orientation: No reconstructable display sets in viewport');
      return;
    }

    // Set the orientation enum based on the selected orientation
    let orientationEnum;
    switch (orientation.toLowerCase()) {
      case 'axial':
        orientationEnum = Enums.OrientationAxis.AXIAL;
        break;
      case 'sagittal':
        orientationEnum = Enums.OrientationAxis.SAGITTAL;
        break;
      case 'coronal':
        orientationEnum = Enums.OrientationAxis.CORONAL;
        break;
      default:
        orientationEnum = Enums.OrientationAxis.ACQUISITION;
    }

    const displaySetUIDs = displaySets.map(ds => ds.displaySetInstanceUID);

    // If viewport is not already a volume type, we need to convert it
    if (currentViewportType !== Enums.ViewportType.ORTHOGRAPHIC) {
      // Configure the viewport to be a volume viewport with current display sets
      const updatedViewport = {
        viewportId: viewportIdToUse,
        displaySetInstanceUIDs: displaySetUIDs,
        viewportOptions: {
          viewportType: Enums.ViewportType.ORTHOGRAPHIC,
          orientation: orientationEnum,
        },
        displaySetOptions: displaySetUIDs.map(() => ({})),
      };

      // Update the viewport to be a volume viewport
      commandsManager.run('setDisplaySetsForViewports', {
        viewportsToUpdate: [updatedViewport],
      });
    } else {
      // Set the viewport orientation
      commandsManager.runCommand('setViewportOrientation', {
        viewportId: viewportIdToUse,
        orientation: orientationEnum,
      });
    }

    // Close the menu after selection
    onClose?.();
  };

  const handleOpenChange = (openState: boolean) => {
    if (openState) {
      onOpen?.();
    } else {
      onClose?.();
    }
  };

  if (!displaySets.length) {
    return null;
  }

  // Get proper alignment and side based on the location using toolbar service
  const { align, side } = toolbarService.getAlignAndSide(Number(location));

  const Icon = <Icons.OrientationSwitch className={iconClassName} />;
  return (
    <Popover
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      <PopoverTrigger
        asChild
        className={cn('flex items-center justify-center')}
      >
        <div>
          {IconContainer ? (
            <IconContainer
              disabled={disabled}
              icon="OrientationSwitch"
              {...props}
              {...containerProps}
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
        className="w-[100px] p-1"
        align={align}
        side={side}
      >
        <div className="flex flex-col">
          <Button
            variant="ghost"
            className="justify-start"
            onClick={() => handleOrientationChange('axial')}
          >
            轴位
          </Button>
          <Button
            variant="ghost"
            className="justify-start"
            onClick={() => handleOrientationChange('sagittal')}
          >
            矢状位
          </Button>
          <Button
            variant="ghost"
            className="justify-start"
            onClick={() => handleOrientationChange('coronal')}
          >
            冠状位
          </Button>
          <Button
            variant="ghost"
            className="justify-start"
            onClick={() => handleOrientationChange('acquisition')}
          >
            采集
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default ViewportOrientationMenu;
