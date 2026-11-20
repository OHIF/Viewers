import React, { useState } from 'react';
import { useSystem } from '@ohif/core';
import {
  Button,
  Icons,
  Popover,
  PopoverContent,
  PopoverTrigger,
  useIconPresentation,
} from '@ohif/ui-next';
import { getVolume3DSpin, type ViewDirection } from '../../utils/volume3dView';

const CENTER = 50;
const LINE_RADIUS = 30;
const LABEL_RADIUS = 42;

// Screen angle of each label; P-A is drawn as a diagonal to suggest depth.
const DIRECTIONS: { direction: ViewDirection; angle: number }[] = [
  { direction: 'S', angle: -90 },
  { direction: 'I', angle: 90 },
  { direction: 'R', angle: 180 },
  { direction: 'L', angle: 0 },
  { direction: 'P', angle: 225 },
  { direction: 'A', angle: 45 },
];
const AXIS_ANGLES = [180, -90, 225];

const toXY = (angleDegrees: number, radius: number) => {
  const radians = (angleDegrees * Math.PI) / 180;
  return { x: CENTER + radius * Math.cos(radians), y: CENTER + radius * Math.sin(radians) };
};

/**
 * Orientation menu of a volume3d viewport, in the style of the 3D Slicer view controller:
 * click S, I, R, L, A or P to look from that side, and set a continuous spin speed.
 */
function Viewport3DCompassMenu({
  location,
  viewportId,
  isOpen = false,
  onOpen,
  onClose,
  disabled,
  ...props
}: withAppTypes<{
  location?: string;
  viewportId: string;
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  disabled?: boolean;
}>) {
  const { servicesManager, commandsManager } = useSystem();
  const { toolbarService } = servicesManager.services;
  const { IconContainer, className: iconClassName, containerProps } = useIconPresentation();
  const [spin, setSpin] = useState(0);

  const changeSpin = (speed: number) => {
    commandsManager.runCommand('setViewport3DSpin', { viewportId, speed });
    setSpin(speed);
  };

  const lookFrom = (direction: ViewDirection) =>
    commandsManager.runCommand('setViewport3DViewDirection', { viewportId, direction });

  const handleOpenChange = (openState: boolean) => {
    if (openState) {
      // The spin can stop without this menu, for example when the viewport changes.
      setSpin(getVolume3DSpin(viewportId));
      onOpen?.();
    } else {
      onClose?.();
    }
  };

  const { align, side } = toolbarService.getAlignAndSide(Number(location));
  const Icon = <Icons.OrientationSwitch className={iconClassName} />;
  const gradientId = `compass-sphere-${viewportId}`;

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
            >
              {Icon}
            </Button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto flex-shrink-0 rounded-lg border-0 bg-neutral-800 p-1 shadow-none"
        align={align}
        side={side}
        style={{ left: 0 }}
      >
        <svg
          viewBox="0 0 100 100"
          className="h-36 w-36"
          role="group"
          aria-label="View direction"
        >
          <defs>
            <radialGradient
              id={gradientId}
              cx="35%"
              cy="35%"
              r="65%"
              fx="35%"
              fy="35%"
            >
              <stop
                offset="0%"
                stopColor="hsl(var(--secondary-foreground))"
                stopOpacity="0.9"
              />
              <stop
                offset="45%"
                stopColor="hsl(var(--secondary))"
                stopOpacity="1"
              />
              <stop
                offset="100%"
                stopColor="hsl(var(--secondary))"
                stopOpacity="0.55"
              />
            </radialGradient>
          </defs>
          {AXIS_ANGLES.map(angle => {
            const start = toXY(angle, LINE_RADIUS);
            const end = toXY(angle + 180, LINE_RADIUS);
            return (
              <line
                key={angle}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke="white"
                strokeWidth="1.2"
              />
            );
          })}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={5}
            fill={`url(#${gradientId})`}
            className="drop-shadow-[0_0_6px_hsl(var(--secondary)/0.7)]"
          />
          {DIRECTIONS.map(({ direction, angle }) => {
            const { x, y } = toXY(angle, LABEL_RADIUS);
            return (
              <g
                key={direction}
                className="cursor-pointer select-none outline-none"
                onClick={() => lookFrom(direction)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    lookFrom(direction);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`View from ${direction}`}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={10}
                  fill="transparent"
                />
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="sans-serif"
                  className="pointer-events-none"
                >
                  {direction}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="mt-2 flex items-center justify-center">
          <button
            type="button"
            className="mr-2 cursor-pointer text-lg text-neutral-400 outline-none hover:text-neutral-200 focus:text-neutral-200"
            onClick={() => changeSpin(spin === 0 ? 1 : 0)}
            aria-label={spin === 0 ? 'Start spin' : 'Stop spin'}
          >
            Spin
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => changeSpin(spin - 1)}
            aria-label="Decrease spin"
          >
            <Icons.ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[1.75rem] text-center font-mono text-sm font-medium">{spin}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => changeSpin(spin + 1)}
            aria-label="Increase spin"
          >
            <Icons.ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default Viewport3DCompassMenu;
