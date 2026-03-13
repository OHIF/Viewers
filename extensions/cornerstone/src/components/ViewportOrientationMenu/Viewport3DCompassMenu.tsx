import React from 'react';
import { cn, Icons, useIconPresentation } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';
import { Popover, PopoverTrigger, PopoverContent, Button, useViewportGrid } from '@ohif/ui-next';

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
  const { cornerstoneViewportService, toolbarService } = servicesManager.services;
  const [gridState] = useViewportGrid();
  const viewportIdToUse = viewportId || gridState.activeViewportId;
  const { IconContainer, className: iconClassName, containerProps } = useIconPresentation();

  const [spin, setSpin] = React.useState(0);

  React.useEffect(() => {
    if (spin === 0) return;
    const degreesPerSecondPerSpin = 18;
    let lastTime = performance.now();
    let rafId: number;
    const tick = () => {
      const now = performance.now();
      const deltaMs = now - lastTime;
      lastTime = now;
      const angle = -spin * degreesPerSecondPerSpin * (deltaMs / 1000);
      commandsManager.runCommand('rotateViewport3DBy', {
        viewportId: viewportIdToUse,
        angle,
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [spin, viewportIdToUse, commandsManager]);

  const handleDirectionChange = (direction: 'S' | 'P' | 'R' | 'L' | 'A' | 'I') => {
    commandsManager.runCommand('setViewport3DViewDirection', {
      viewportId: viewportIdToUse,
      direction,
    });
  };

  const handleOpenChange = (openState: boolean) => {
    if (openState) {
      onOpen?.();
    } else {
      onClose?.();
    }
  };

  const { align, side } = toolbarService.getAlignAndSide(Number(location));

  const cx = 50;
  const cy = 50;
  const lineR = 30;
  const labelR = 42;
  const dirs: { dir: 'S' | 'P' | 'R' | 'L' | 'A' | 'I'; angle: number }[] = [
    { dir: 'S', angle: -90 },
    { dir: 'I', angle: 90 },
    { dir: 'R', angle: 180 },
    { dir: 'L', angle: 0 },
    { dir: 'P', angle: 225 },
    { dir: 'A', angle: 45 },
  ];
  const toXY = (angleDeg: number, radius: number) => {
    const a = (angleDeg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
  };

  const Icon = <Icons.OrientationSwitch className={iconClassName} />;

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild className={cn('flex items-center justify-center')}>
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
            <Button variant="ghost" size="icon" disabled={disabled} onClick={() => {}}>
              {Icon}
            </Button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto flex-shrink-0 rounded-lg bg-neutral-800 p-1"
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
              id={`compass-sphere-${viewportIdToUse}`}
              cx="35%"
              cy="35%"
              r="65%"
              fx="35%"
              fy="35%"
            >
              <stop offset="0%" stopColor="hsl(var(--secondary-foreground))" stopOpacity="0.9" />
              <stop offset="45%" stopColor="hsl(var(--secondary))" stopOpacity="1" />
              <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0.55" />
            </radialGradient>
          </defs>
          {/* Horizontal axis R-L (solid) */}
          <line
            x1={toXY(180, lineR).x}
            y1={toXY(180, lineR).y}
            x2={toXY(0, lineR).x}
            y2={toXY(0, lineR).y}
            stroke="white"
            strokeWidth="1.2"
          />
          {/* Vertical axis S-I (solid) */}
          <line
            x1={toXY(-90, lineR).x}
            y1={toXY(-90, lineR).y}
            x2={toXY(90, lineR).x}
            y2={toXY(90, lineR).y}
            stroke="white"
            strokeWidth="1.2"
          />
          {/* Diagonal axis P-A: P top-left, A bottom-right */}
          <line
            x1={toXY(225, lineR).x}
            y1={toXY(225, lineR).y}
            x2={toXY(45, lineR).x}
            y2={toXY(45, lineR).y}
            stroke="white"
            strokeWidth="1.2"
          />
          {/* Center sphere - 3D effect via radial gradient */}
          <circle
            cx={cx}
            cy={cy}
            r={5}
            fill={`url(#compass-sphere-${viewportIdToUse})`}
            className="drop-shadow-[0_0_6px_hsl(var(--secondary)/0.7)]"
          />
          {/* Clickable labels */}
          {dirs.map(({ dir, angle }) => {
            const { x, y } = toXY(angle, labelR);
            return (
              <g
                key={dir}
                className="cursor-pointer select-none outline-none focus:outline-none focus:ring-0"
                onClick={() => handleDirectionChange(dir)}
                onKeyDown={e => e.key === 'Enter' && handleDirectionChange(dir)}
                role="button"
                tabIndex={-1}
                aria-label={dir}
              >
                <circle cx={x} cy={y} r={10} fill="transparent" />
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
                  {dir}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="mt-2 flex items-center justify-center gap-0 pt-0">
          <span className="mr-2 text-lg text-neutral-400">Spin</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setSpin(s => s - 1)}
            aria-label="Decrease spin"
          >
            <Icons.ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[1.75rem] text-center font-mono text-sm font-medium">
            {spin}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setSpin(s => s + 1)}
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
