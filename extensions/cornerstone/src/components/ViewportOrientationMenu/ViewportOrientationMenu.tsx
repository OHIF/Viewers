import React from 'react';
import { cn, Icons, useIconPresentation } from '@ohif/ui-next';
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
  viewportOrientation = 'sagittal',
  ...props
}: withAppTypes<{
  location?: string;
  viewportId: string;
  displaySets: AppTypes.DisplaySet[];
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  disabled?: boolean;
  viewportOrientation: string;
}>) {
  const [gridState] = useViewportGrid();
  const viewportIdToUse = viewportId || gridState.activeViewportId;
  const { IconContainer, className: iconClassName, containerProps } = useIconPresentation();
  const [currentOrientation, setCurrentOrientation] = React.useState<string>(
    typeof viewportOrientation === 'string' ? viewportOrientation : 'axial'
  );
  const { servicesManager, commandsManager } = useSystem();
  const { cornerstoneViewportService, toolbarService } = servicesManager.services;

  const getIcon = (orientationName: string) => {
    switch (orientationName.toLowerCase()) {
      case 'axial':
        return Icons.OrientationSwitchA;
      case 'sagittal':
        return Icons.OrientationSwitchS;
      case 'coronal':
        return Icons.OrientationSwitchC;
      case 'reformat':
        return Icons.OrientationSwitchR;
      default:
        return Icons.OrientationSwitch;
    }
  };

  const handleOrientationChange = (orientation: string) => {
    setCurrentOrientation(orientation);
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
      case 'reformat':
        orientationEnum = Enums.OrientationAxis.REFORMAT;
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

  const Icon = React.createElement(getIcon(currentOrientation), { className: iconClassName });
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
        className="w-[140px] p-2"
        align={align}
        side={side}
      >
        <div className="flex flex-col">
          <Button
            variant="ghost"
            className="flex items-center justify-start"
            onClick={() => handleOrientationChange('axial')}
          >
            <span className="mr-2 inline-block w-5 min-w-[20px] text-left">
              {currentOrientation === 'axial' ? (
                <Icons.Checked className="text-primary h-4 w-4" />
              ) : null}
            </span>
            <span className="flex-1 text-left">Axial</span>
          </Button>
          <Button
            variant="ghost"
            className="flex items-center justify-start"
            onClick={() => handleOrientationChange('sagittal')}
          >
            <span className="mr-2 inline-block w-5 min-w-[20px] text-left">
              {currentOrientation === 'sagittal' ? (
                <Icons.Checked className="text-primary h-4 w-4" />
              ) : null}
            </span>
            <span className="flex-1 text-left">Sagittal</span>
          </Button>
          <Button
            variant="ghost"
            className="flex items-center justify-start"
            onClick={() => handleOrientationChange('coronal')}
          >
            <span className="mr-2 inline-block w-5 min-w-[20px] text-left">
              {currentOrientation === 'coronal' ? (
                <Icons.Checked className="text-primary h-4 w-4" />
              ) : null}
            </span>
            <span className="flex-1 text-left">Coronal</span>
          </Button>
          <Button
            variant="ghost"
            className="flex items-center justify-start"
            onClick={() => handleOrientationChange('acquisition')}
          >
            <span className="mr-2 inline-block w-5 min-w-[20px] text-left">
              {currentOrientation === 'acquisition' ? (
                <Icons.Checked className="text-primary h-4 w-4" />
              ) : null}
            </span>
            <span className="flex-1 text-left">Acquisition</span>
          </Button>
          {/* Divider */}
          <div className="my-2 border-t border-white/20" />
          <Button
            variant="ghost"
            className="flex items-center justify-start"
            onClick={() => handleOrientationChange('reformat')}
          >
            <span className="mr-2 inline-block w-5 min-w-[20px] text-left">
              {currentOrientation === 'reformat' ? (
                <Icons.Checked className="text-primary h-4 w-4" />
              ) : null}
            </span>
            <span className="flex-1 text-left">Reformat</span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default ViewportOrientationMenu;
