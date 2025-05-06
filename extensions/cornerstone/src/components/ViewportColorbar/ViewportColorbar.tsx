import React, { useEffect, useRef } from 'react';
import { utilities } from '@cornerstonejs/tools';
import { useSystem } from '@ohif/core';
import {
  ColorbarPositionType,
  TickPositionType,
  ColorbarCustomization,
  TickStyleType,
  ContainerStyleType,
} from '../../types/Colorbar';

const { ViewportColorbar: CornerstoneViewportColorbar } = utilities.voi.colorbar;

type ColorbarProps = {
  viewportId: string;
  displaySetInstanceUID: string;
  colormap?: any;
  colormaps: any[];
  activeColormapName: string;
  volumeId?: string;
  position: ColorbarPositionType;
  tickPosition: TickPositionType;
  tickStyles?: TickStyleType;
  containerStyles?: ContainerStyleType;
  dimensionStyles: Record<string, string | number>;
};

/**
 * ViewportColorbar Component
 * A React wrapper for the cornerstone ViewportColorbar that adds a close button
 * positioned appropriately based on the colorbar position.
 */
const ViewportColorbar = ({
  viewportId,
  displaySetInstanceUID,
  colormaps,
  activeColormapName,
  volumeId,
  position,
  tickPosition,
  tickStyles,
  containerStyles,
  dimensionStyles,
}: ColorbarProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { servicesManager } = useSystem();
  const { customizationService } = servicesManager.services;

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
    ></div>
  );
};

export default ViewportColorbar;
