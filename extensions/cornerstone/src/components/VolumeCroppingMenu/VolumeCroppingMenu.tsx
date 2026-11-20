import React, { useState } from 'react';
import { useSystem } from '@ohif/core';
import {
  Button,
  Icons,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Switch,
  useIconPresentation,
} from '@ohif/ui-next';
import { toolNames } from '../../initCornerstoneTools';

type CroppingState = { cropping: boolean; handles: boolean; rotatePlanes: boolean };

/**
 * Viewport corner menu for the VolumeCropping tool of a volume3d viewport: shows the crop
 * box, its drag handles, and whether a plain drag rotates the crop planes.
 */
function VolumeCroppingMenu({
  viewportId,
  location,
  isOpen = false,
  onOpen,
  onClose,
  disabled,
  ...props
}: withAppTypes<{
  viewportId: string;
  location?: string;
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  disabled?: boolean;
}>) {
  const { servicesManager, commandsManager } = useSystem();
  const { toolGroupService, toolbarService } = servicesManager.services;
  const { IconContainer, className: iconClassName, containerProps } = useIconPresentation();
  const [state, setState] = useState<CroppingState>({
    cropping: false,
    handles: false,
    rotatePlanes: false,
  });

  // The tool owns this state, and hotkeys or other code can change it, so read it on open.
  const readState = () => {
    const tool = toolGroupService
      .getToolGroupForViewport(viewportId)
      ?.getToolInstance(toolNames.VolumeCropping);
    setState({
      cropping: !!tool?.getClippingPlanesVisible(),
      handles: !!tool?.getHandlesVisible(),
      rotatePlanes: !!tool?.getRotatePlanesOnDrag(),
    });
  };

  const run = (commandName: string, options: Record<string, unknown>) => {
    commandsManager.runCommand(commandName, { viewportId, ...options });
    readState();
  };

  const handleOpenChange = (openState: boolean) => {
    if (openState) {
      readState();
      onOpen?.();
    } else {
      onClose?.();
    }
  };

  const { align, side } = toolbarService.getAlignAndSide(Number(location));
  const Icon = <Icons.Crop className={iconClassName} />;

  const rows = [
    {
      label: 'Crop volume',
      tooltip: 'Show the crop box. Drag a handle to crop; SHIFT-drag rotates the crop planes.',
      checked: state.cropping,
      onChange: (visible: boolean) => run('toggleCropping', { visible }),
    },
    {
      label: 'Show handles',
      tooltip: 'Show the drag handles of the crop box.',
      checked: state.handles,
      disabled: !state.cropping,
      onChange: (visible: boolean) => run('toggle3Dhandles', { visible }),
    },
    {
      label: 'Rotate planes on drag',
      tooltip: 'A plain drag rotates the crop planes, not the camera.',
      checked: state.rotatePlanes,
      disabled: !state.cropping,
      onChange: (enabled: boolean) => run('togglePlaneRotation', { enabled }),
    },
  ];

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
              icon="Crop"
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
            >
              {Icon}
            </Button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="flex w-[240px] flex-col gap-2 rounded p-2"
        align={align}
        side={side}
      >
        {rows.map(row => (
          <label
            key={row.label}
            title={row.tooltip}
            className="flex items-center justify-between text-sm"
          >
            {row.label}
            <Switch
              checked={row.checked}
              disabled={row.disabled}
              onCheckedChange={row.onChange}
            />
          </label>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export default VolumeCroppingMenu;
