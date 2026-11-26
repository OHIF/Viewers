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
import i18n from 'i18next';
import { Enums } from '@cornerstonejs/tools';
import { toolNames } from '../../initCornerstoneTools';
import { getVolumeCroppingState } from '../../utils/getVolumeCroppingToolGroup';

type CroppingState = { handles: boolean; rotatePlanes: boolean };

/**
 * Viewport corner menu for the VolumeCropping tool of a volume3d viewport, shown while
 * the crop box is on: the drag handles, and whether a plain drag rotates the crop planes.
 * The VolumeCropping toolbar button turns the crop box on and off.
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
  const [state, setState] = useState<CroppingState>({ handles: false, rotatePlanes: false });

  // The tool owns this state, and hotkeys or other code can change it, so read it on open.
  const readState = () => {
    const tool = toolGroupService
      .getToolGroupForViewport(viewportId)
      ?.getToolInstance(toolNames.VolumeCropping);
    setState({
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

  // Toolbar state is evaluated for the active viewport only, so check this viewport too.
  const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);
  if (
    !toolGroup?.hasTool(toolNames.VolumeCropping) ||
    getVolumeCroppingState(toolGroup) === Enums.ToolModes.Disabled
  ) {
    return null;
  }

  const { align, side } = toolbarService.getAlignAndSide(Number(location));
  const Icon = <Icons.Crop className={iconClassName} />;
  const ariaLabel = i18n.t('Buttons:Volume Cropping');

  const rows = [
    {
      label: i18n.t('Buttons:Show handles'),
      tooltip: i18n.t('Buttons:Show the drag handles of the crop box'),
      checked: state.handles,
      onChange: (visible: boolean) => run('toggle3Dhandles', { visible }),
    },
    {
      label: i18n.t('Buttons:Rotate planes on drag'),
      tooltip: i18n.t(
        'Buttons:While the crop tool is active, a drag rotates the crop planes, not the camera'
      ),
      checked: state.rotatePlanes,
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
              aria-label={ariaLabel}
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
              aria-label={ariaLabel}
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
              onCheckedChange={row.onChange}
            />
          </label>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export default VolumeCroppingMenu;
