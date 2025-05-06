import React, { useEffect, useRef, useState } from 'react';
import { Button, Icons } from '@ohif/ui-next';
import { utilities } from '@cornerstonejs/tools';
import { useSystem } from '@ohif/core';
import {
  ColorbarPositionType,
  TickPositionType,
  ColorbarCustomization,
} from '../../types/Colorbar';

const { ViewportColorbar: CornerstoneViewportColorbar } = utilities.voi.colorbar;

type ColorbarProps = {
  viewportId: string;
  displaySetInstanceUID: string;
  colormap: any;
  colormaps: any[];
  activeColormapName: string;
  volumeId?: string;
  position: ColorbarPositionType;
  tickPosition: TickPositionType;
  tickStyles: any;
  containerStyles: any;
  dimensionStyles: any;
  onClose: () => void;
};

/**
 * ViewportColorbar Component
 * A React wrapper for the cornerstone ViewportColorbar that adds a close button
 * positioned appropriately based on the colorbar position.
 */
const ViewportColorbar = ({
  viewportId,
  displaySetInstanceUID,
  colormap,
  colormaps,
  activeColormapName,
  volumeId,
  position,
  tickPosition,
  tickStyles,
  containerStyles,
  dimensionStyles,
  onClose,
}: ColorbarProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [colorbarInstance, setColorbarInstance] = useState(null);
  const { servicesManager } = useSystem();
  const { customizationService } = servicesManager.services;

  // Close button position styles based on colorbar position
  const closeButtonStyles = {
    position: 'absolute',
    zIndex: 10,
    ...(position === 'bottom'
      ? { left: '-25px', top: '0', transform: 'translateY(-50%)' }
      : position === 'right'
        ? { top: '-25px', left: '0', transform: 'translateX(-50%)' }
        : position === 'left'
          ? { top: '-25px', right: '0', transform: 'translateX(50%)' }
          : { bottom: '-25px', right: '0', transform: 'translateX(50%)' }), // top position
  };

  // Initialize and clean up the colorbar
  useEffect(() => {
    if (!containerRef.current || !colormaps || !activeColormapName) {
      return;
    }

    const colorbarCustomization = customizationService.getCustomization(
      'cornerstone.colorbar'
    ) as unknown as ColorbarCustomization;

    // Get position-specific tick styles if available
    const positionTickStyles = colorbarCustomization?.positionTickStyles?.[position];

    // Create the cornerstone viewport colorbar
    const csColorbar = new CornerstoneViewportColorbar({
      id: `Colorbar-${viewportId}-${displaySetInstanceUID}`,
      element: document.getElementById(`viewport-element-${viewportId}`),
      container: containerRef.current,
      colormaps: colormaps,
      activeColormapName: activeColormapName,
      volumeId,
      ticks: {
        position: tickPosition,
        style: {
          ...(colorbarCustomization?.tickStyles || {}),
          ...(positionTickStyles?.style || {}),
          ...(tickStyles || {}),
        },
      },
    });

    setColorbarInstance(csColorbar);

    // Clean up on unmount
    return () => {
      if (csColorbar) {
        csColorbar.destroy();
      }
    };
  }, [
    viewportId,
    displaySetInstanceUID,
    colormaps,
    activeColormapName,
    volumeId,
    position,
    tickPosition,
  ]);

  return (
    <div
      id={`colorbar-container-${viewportId}-${displaySetInstanceUID}`}
      ref={containerRef}
      style={{
        position: 'absolute',
        boxSizing: 'border-box',
        border: '1px solid #555',
        cursor: 'initial',
        ...containerStyles,
        ...dimensionStyles,
      }}
    >
      <div style={closeButtonStyles}>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          aria-label="Close colorbar"
          className="bg-gray-950 hover:bg-primary text-primary hover:text-background border-primary flex h-7 w-7 items-center justify-center rounded-full border shadow-md"
        >
          <Icons.Close className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ViewportColorbar;
